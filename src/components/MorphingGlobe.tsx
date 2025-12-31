/**
 * MorphingGlobe - Unified map system with seamless globe-to-flat morphing
 *
 * This is the consolidated map renderer that replaces all previous map styles:
 * - Realistic globe (morphFactor = 0)
 * - Flat map (morphFactor = 1)
 * - Optional vector overlay (borders rendered on top)
 *
 * Inspired by Polyglobe (pizzint.watch/polyglobe), uses vertex shader interpolation.
 */
import { forwardRef, useEffect, useMemo, useRef, useState, useImperativeHandle, useCallback } from 'react';
import type { MutableRefObject } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { FeatureCollection, Polygon, MultiPolygon } from 'geojson';
import { resolvePublicAssetPath } from '@/lib/renderingUtils';

const EARTH_RADIUS = 1.8;
const FLAT_ASPECT = 2; // Equirectangular map is 2:1 aspect ratio
// Flat map height must be at least sphere diameter (2 * radius) to fully cover the globe during morph
const FLAT_HEIGHT = EARTH_RADIUS * 2;
const FLAT_WIDTH = FLAT_HEIGHT * FLAT_ASPECT;

// Export flat dimensions for use in picker/projector calculations
export const MORPHING_FLAT_WIDTH = FLAT_WIDTH;
export const MORPHING_FLAT_HEIGHT = FLAT_HEIGHT;

export interface MorphingGlobeHandle {
  /** Current morph factor (0 = globe, 1 = flat) */
  getMorphFactor: () => number;
  /** Set morph factor directly (0-1) */
  setMorphFactor: (value: number) => void;
  /** Animate to globe view */
  morphToGlobe: (duration?: number) => void;
  /** Animate to flat map view */
  morphToFlat: (duration?: number) => void;
  /** Toggle between views */
  toggle: (duration?: number) => void;
  /** Check if currently in flat mode */
  isFlat: () => boolean;
  /** Toggle vector overlay visibility */
  setVectorOverlay: (visible: boolean) => void;
  /** Get vector overlay visibility */
  getVectorOverlay: () => boolean;
}

export interface MorphingGlobeProps {
  /** Initial view: 'globe' or 'flat' */
  initialView?: 'globe' | 'flat';
  /** Animation duration in seconds */
  animationDuration?: number;
  /** Texture variant: 'day' or 'night' (used when dayNightBlend is not provided) */
  textureVariant?: 'day' | 'night';
  /** Blend factor between day (0) and night (1) textures for smooth transitions */
  dayNightBlend?: number;
  /** Custom texture URL */
  customTextureUrl?: string;
  /** Callback when morph starts */
  onMorphStart?: (targetView: 'globe' | 'flat') => void;
  /** Callback when morph completes */
  onMorphComplete?: (view: 'globe' | 'flat') => void;
  /** Callback during morph with current factor */
  onMorphProgress?: (factor: number) => void;
  /** Reference to the mesh for external access */
  meshRef?: MutableRefObject<THREE.Mesh | null>;
  /** GeoJSON data for vector overlay borders */
  worldCountries?: FeatureCollection<Polygon | MultiPolygon> | null;
  /** Show vector overlay (country borders) */
  showVectorOverlay?: boolean;
  /** Vector overlay color */
  vectorColor?: string;
  /** Vector overlay opacity */
  vectorOpacity?: number;
  /** Vector-only mode: hide earth texture and show only vector borders (for WARGAMES theme) */
  vectorOnlyMode?: boolean;
}

// Vertex shader that interpolates between sphere and flat plane
const morphVertexShader = /* glsl */ `
  uniform float uMorphFactor;
  uniform float uRadius;
  uniform float uFlatWidth;
  uniform float uFlatHeight;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vUv = uv;

    // Sphere position (from UV to spherical coordinates)
    // With flipY=true: uv.y=0 is top of image (north pole), uv.y=1 is bottom (south pole)
    float phi = uv.y * 3.14159265359; // latitude: 0 at north pole, PI at south pole
    float theta = uv.x * 2.0 * 3.14159265359 - 3.14159265359; // longitude: -PI to PI

    vec3 spherePos = vec3(
      -uRadius * sin(phi) * cos(theta),  // Negate X to fix texture mirroring
      uRadius * cos(phi),
      uRadius * sin(phi) * sin(theta)
    );

    // Flat position (centered plane)
    // Flip Y for flat map so north is at top (uv.y=0 -> top, uv.y=1 -> bottom)
    vec3 flatPos = vec3(
      (uv.x - 0.5) * uFlatWidth,
      (0.5 - uv.y) * uFlatHeight,
      0.0
    );

    // Interpolate between sphere and flat based on morph factor
    vec3 morphedPosition = mix(spherePos, flatPos, uMorphFactor);

    // Normal interpolation
    // Negate sphereNormal because we negated X in spherePos, which reverses winding order
    vec3 sphereNormal = -normalize(spherePos);
    vec3 flatNormal = vec3(0.0, 0.0, 1.0);
    vNormal = normalize(mix(sphereNormal, flatNormal, uMorphFactor));

    vPosition = morphedPosition;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(morphedPosition, 1.0);
  }
`;

// Fragment shader with lighting and day/night blending
const morphFragmentShader = /* glsl */ `
  uniform sampler2D uDayTexture;
  uniform sampler2D uNightTexture;
  uniform float uDayNightBlend;
  uniform float uMorphFactor;
  uniform vec3 uLightDirection;
  uniform float uAmbientIntensity;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    // Sample both day and night textures
    vec4 dayColor = texture2D(uDayTexture, vUv);
    vec4 nightColor = texture2D(uNightTexture, vUv);

    // Blend between day and night based on uDayNightBlend (0 = day, 1 = night)
    vec4 texColor = mix(dayColor, nightColor, uDayNightBlend);

    // Simple diffuse lighting
    float diffuse = max(dot(vNormal, normalize(uLightDirection)), 0.0);

    // Blend between lit (globe) and unlit (flat) based on morph factor
    float lightInfluence = mix(1.0, 0.3, uMorphFactor);
    float lighting = mix(uAmbientIntensity, 1.0, diffuse * lightInfluence);

    // Brightness boost for flat view (increased for better visibility)
    float flatBoost = mix(1.0, 1.4, uMorphFactor);

    vec3 finalColor = texColor.rgb * lighting * flatBoost;

    gl_FragColor = vec4(finalColor, texColor.a);
  }
`;

// Simple dark fragment shader for vectorOnlyMode (no texture, just dark color)
const darkFragmentShader = /* glsl */ `
  uniform vec3 uDarkColor;

  void main() {
    gl_FragColor = vec4(uDarkColor, 1.0);
  }
`;

// Easing functions for smooth, satisfying animations
// Polyglobe-inspired elastic ease with slight overshoot for organic feel
function easeOutElastic(t: number): number {
  const c4 = (2 * Math.PI) / 3;
  return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

// Smooth ease-out with subtle bounce
function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// Combined smooth easing: ease-in-out with slight overshoot at end
function easeInOutSmooth(t: number): number {
  if (t < 0.5) {
    // Ease in: smooth acceleration
    return 4 * t * t * t;
  }
  // Ease out with subtle overshoot
  const p = -2 * t + 2;
  const base = 1 - Math.pow(p, 3) / 2;
  // Add tiny overshoot that settles
  const overshoot = Math.sin(t * Math.PI) * 0.03 * (1 - t);
  return Math.min(1, base + overshoot);
}

// Vertex shader for vector overlay lines that morph with the globe
const vectorOverlayVertexShader = /* glsl */ `
  uniform float uMorphFactor;
  uniform float uRadius;
  uniform float uFlatWidth;
  uniform float uFlatHeight;

  attribute vec2 uv2; // UV coordinates for the line endpoints

  varying float vAlpha;

  void main() {
    // Calculate sphere position from UV
    float phi = uv2.y * 3.14159265359;
    float theta = uv2.x * 2.0 * 3.14159265359 - 3.14159265359;

    vec3 spherePos = vec3(
      -(uRadius + 0.005) * sin(phi) * cos(theta),  // Negate X to fix texture mirroring
      (uRadius + 0.005) * cos(phi),
      (uRadius + 0.005) * sin(phi) * sin(theta)
    );

    // Calculate flat position
    vec3 flatPos = vec3(
      (uv2.x - 0.5) * uFlatWidth,
      (0.5 - uv2.y) * uFlatHeight,
      0.01
    );

    // Interpolate
    vec3 morphedPosition = mix(spherePos, flatPos, uMorphFactor);

    // Fade alpha for backfacing lines on globe
    // Negate sphereNormal because we negated X in spherePos, which reverses winding order
    vec3 sphereNormal = -normalize(spherePos);
    vec3 viewDir = normalize(cameraPosition - morphedPosition);
    float facing = dot(sphereNormal, viewDir);
    vAlpha = mix(smoothstep(-0.1, 0.3, facing), 1.0, uMorphFactor);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(morphedPosition, 1.0);
  }
`;

const vectorOverlayFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;

  varying float vAlpha;

  void main() {
    gl_FragColor = vec4(uColor, uOpacity * vAlpha);
  }
`;

/**
 * Convert GeoJSON FeatureCollection to line segment UV coordinates
 * Returns Float32Array of UV pairs (u1, v1, u2, v2, ...)
 */
function collectBorderSegments(
  collection?: FeatureCollection<Polygon | MultiPolygon> | null,
): Float32Array | null {
  if (!collection?.features?.length) {
    return null;
  }

  const segments: number[] = [];

  const pushSegment = (start: readonly [number, number], end: readonly [number, number]) => {
    const [startLon, startLat] = start;
    const [endLon, endLat] = end;

    if (!Number.isFinite(startLon) || !Number.isFinite(startLat)) return;
    if (!Number.isFinite(endLon) || !Number.isFinite(endLat)) return;

    // Convert lon/lat to UV coordinates (0-1 range)
    const startU = THREE.MathUtils.clamp((startLon + 180) / 360, 0, 1);
    const startV = THREE.MathUtils.clamp((90 - startLat) / 180, 0, 1);
    const endU = THREE.MathUtils.clamp((endLon + 180) / 360, 0, 1);
    const endV = THREE.MathUtils.clamp((90 - endLat) / 180, 0, 1);

    segments.push(startU, startV, endU, endV);
  };

  const appendRing = (ring: readonly number[][]) => {
    if (!ring || ring.length < 2) return;

    for (let i = 1; i < ring.length; i += 1) {
      pushSegment(ring[i - 1] as [number, number], ring[i] as [number, number]);
    }

    const first = ring[0] as [number, number];
    const last = ring[ring.length - 1] as [number, number];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      pushSegment(last, first);
    }
  };

  const appendPolygon = (polygon: Polygon['coordinates']) => {
    polygon.forEach(ring => appendRing(ring));
  };

  for (const feature of collection.features) {
    if (!feature) continue;
    const geometry = feature.geometry;
    if (!geometry) continue;

    if (geometry.type === 'Polygon') {
      appendPolygon(geometry.coordinates);
    } else if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach(polygon => appendPolygon(polygon));
    }
  }

  if (!segments.length) {
    return null;
  }

  return new Float32Array(segments);
}

/**
 * Create vector overlay line geometry from UV segments
 */
function createVectorOverlayGeometry(uvSegments: Float32Array): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();

  // Each segment has 4 values (u1, v1, u2, v2), creating 2 vertices
  const vertexCount = uvSegments.length / 2;
  const positions = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);

  // Fill in positions (will be overridden by vertex shader, but needed for buffer)
  // and UV coordinates for the shader
  for (let i = 0; i < uvSegments.length; i += 2) {
    const vertexIndex = i / 2;
    const u = uvSegments[i];
    const v = uvSegments[i + 1];

    // Set UV for shader
    uvs[i] = u;
    uvs[i + 1] = v;

    // Placeholder positions (will be computed in shader)
    positions[vertexIndex * 3] = 0;
    positions[vertexIndex * 3 + 1] = 0;
    positions[vertexIndex * 3 + 2] = 0;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv2', new THREE.BufferAttribute(uvs, 2));

  return geometry;
}

export const MorphingGlobe = forwardRef<MorphingGlobeHandle, MorphingGlobeProps>(
  function MorphingGlobe(
    {
      initialView = 'globe',
      animationDuration = 1.2,
      textureVariant = 'day',
      dayNightBlend,
      customTextureUrl,
      onMorphStart,
      onMorphComplete,
      onMorphProgress,
      meshRef: externalMeshRef,
      worldCountries,
      showVectorOverlay = false,
      vectorColor = '#2ef1ff',
      vectorOpacity = 0.7,
      vectorOnlyMode = false,
    },
    ref
  ) {
    const internalMeshRef = useRef<THREE.Mesh>(null);
    const meshRef = externalMeshRef ?? internalMeshRef;
    const materialRef = useRef<THREE.ShaderMaterial>(null);
    const vectorMaterialRef = useRef<THREE.ShaderMaterial>(null);
    const vectorLinesRef = useRef<THREE.LineSegments | null>(null);
    const { camera } = useThree();
    const [vectorOverlayVisible, setVectorOverlayVisible] = useState(showVectorOverlay);

    // Animation state
    const [morphFactor, setMorphFactor] = useState(initialView === 'flat' ? 1 : 0);
    // Use a ref to track the actual current morph factor for getMorphFactor()
    // This ensures we return the real-time value, not a stale state value
    const morphFactorRef = useRef(initialView === 'flat' ? 1 : 0);
    const animationRef = useRef<{
      active: boolean;
      startTime: number;
      startValue: number;
      endValue: number;
      duration: number;
    } | null>(null);

    // Load both day and night textures for blending
    const dayTextureUrl = useMemo(() => {
      if (customTextureUrl && textureVariant === 'day') return customTextureUrl;
      return resolvePublicAssetPath('textures/earth_day_flat.jpg');
    }, [customTextureUrl, textureVariant]);

    const nightTextureUrl = useMemo(() => {
      if (customTextureUrl && textureVariant === 'night') return customTextureUrl;
      return resolvePublicAssetPath('textures/earth_night_flat.jpg');
    }, [customTextureUrl, textureVariant]);

    const dayTexture = useLoader(THREE.TextureLoader, dayTextureUrl);
    const nightTexture = useLoader(THREE.TextureLoader, nightTextureUrl);

    // Configure day texture
    useEffect(() => {
      if (dayTexture) {
        dayTexture.colorSpace = THREE.SRGBColorSpace;
        dayTexture.anisotropy = 16;
        dayTexture.generateMipmaps = true;
        dayTexture.minFilter = THREE.LinearMipmapLinearFilter;
        dayTexture.magFilter = THREE.LinearFilter;
        dayTexture.wrapS = THREE.RepeatWrapping;
        dayTexture.wrapT = THREE.ClampToEdgeWrapping;
        // flipY defaults to true, which is correct for standard image textures
        dayTexture.needsUpdate = true;
      }
    }, [dayTexture]);

    // Configure night texture
    useEffect(() => {
      if (nightTexture) {
        nightTexture.colorSpace = THREE.SRGBColorSpace;
        nightTexture.anisotropy = 16;
        nightTexture.generateMipmaps = true;
        nightTexture.minFilter = THREE.LinearMipmapLinearFilter;
        nightTexture.magFilter = THREE.LinearFilter;
        nightTexture.wrapS = THREE.RepeatWrapping;
        nightTexture.wrapT = THREE.ClampToEdgeWrapping;
        // flipY defaults to true, which is correct for standard image textures
        nightTexture.needsUpdate = true;
      }
    }, [nightTexture]);

    // Calculate effective blend value
    // If dayNightBlend is provided, use it; otherwise fall back to textureVariant
    const effectiveBlend = useMemo(() => {
      if (typeof dayNightBlend === 'number') {
        return Math.max(0, Math.min(1, dayNightBlend));
      }
      return textureVariant === 'night' ? 1 : 0;
    }, [dayNightBlend, textureVariant]);

    // Create shader material uniforms
    const uniforms = useMemo(
      () => ({
        uMorphFactor: { value: initialView === 'flat' ? 1.0 : 0.0 },
        uRadius: { value: EARTH_RADIUS },
        uFlatWidth: { value: FLAT_WIDTH },
        uFlatHeight: { value: FLAT_HEIGHT },
        uDayTexture: { value: dayTexture },
        uNightTexture: { value: nightTexture },
        uDayNightBlend: { value: effectiveBlend },
        uLightDirection: { value: new THREE.Vector3(1, 0.5, 1).normalize() },
        uAmbientIntensity: { value: 0.95 },
      }),
      [dayTexture, nightTexture, effectiveBlend, initialView]
    );

    // Vector overlay uniforms
    const vectorUniforms = useMemo(
      () => ({
        uMorphFactor: { value: initialView === 'flat' ? 1.0 : 0.0 },
        uRadius: { value: EARTH_RADIUS },
        uFlatWidth: { value: FLAT_WIDTH },
        uFlatHeight: { value: FLAT_HEIGHT },
        uColor: { value: new THREE.Color(vectorColor) },
        uOpacity: { value: vectorOpacity },
      }),
      [initialView, vectorColor, vectorOpacity]
    );

    // Dark background uniforms for vectorOnlyMode (WARGAMES theme)
    const darkUniforms = useMemo(
      () => ({
        uMorphFactor: { value: initialView === 'flat' ? 1.0 : 0.0 },
        uRadius: { value: EARTH_RADIUS },
        uFlatWidth: { value: FLAT_WIDTH },
        uFlatHeight: { value: FLAT_HEIGHT },
        uDarkColor: { value: new THREE.Color('#020a02') }, // Very dark green for WARGAMES aesthetic
      }),
      [initialView]
    );

    // Ref for dark material
    const darkMaterialRef = useRef<THREE.ShaderMaterial>(null);

    // Update texture uniforms when they change
    useEffect(() => {
      if (materialRef.current) {
        if (dayTexture) {
          materialRef.current.uniforms.uDayTexture.value = dayTexture;
        }
        if (nightTexture) {
          materialRef.current.uniforms.uNightTexture.value = nightTexture;
        }
        materialRef.current.needsUpdate = true;
      }
    }, [dayTexture, nightTexture]);

    // Update day/night blend uniform when it changes
    useEffect(() => {
      if (materialRef.current) {
        materialRef.current.uniforms.uDayNightBlend.value = effectiveBlend;
      }
    }, [effectiveBlend]);

    // Ensure morph factor uniform is synced when morphFactor state changes
    // This handles cases where the uniforms object is recreated (e.g., texture changes)
    // and prevents the flat plane from showing inside the globe
    useEffect(() => {
      const currentFactor = morphFactorRef.current;
      if (materialRef.current) {
        materialRef.current.uniforms.uMorphFactor.value = currentFactor;
      }
      if (vectorMaterialRef.current) {
        vectorMaterialRef.current.uniforms.uMorphFactor.value = currentFactor;
      }
      if (darkMaterialRef.current) {
        darkMaterialRef.current.uniforms.uMorphFactor.value = currentFactor;
      }
    }, [morphFactor]);

    // Update vector overlay visibility from prop
    useEffect(() => {
      setVectorOverlayVisible(showVectorOverlay);
    }, [showVectorOverlay]);

    // Update vector color and opacity
    useEffect(() => {
      if (vectorMaterialRef.current) {
        vectorMaterialRef.current.uniforms.uColor.value.set(vectorColor);
        vectorMaterialRef.current.uniforms.uOpacity.value = vectorOpacity;
      }
    }, [vectorColor, vectorOpacity]);

    // Create vector overlay geometry from world countries
    const vectorGeometry = useMemo(() => {
      if (!worldCountries) return null;
      const segments = collectBorderSegments(worldCountries);
      if (!segments) return null;
      return createVectorOverlayGeometry(segments);
    }, [worldCountries]);

    // Animation frame update
    useFrame(() => {
      const animation = animationRef.current;

      if (animation?.active) {
        const elapsed = performance.now() / 1000 - animation.startTime;
        const progress = Math.min(elapsed / animation.duration, 1);
        const easedProgress = easeInOutSmooth(progress);

        const newValue =
          animation.startValue + (animation.endValue - animation.startValue) * easedProgress;

        // Update both state and ref - ref is used for real-time getMorphFactor() calls
        morphFactorRef.current = newValue;
        setMorphFactor(newValue);
        onMorphProgress?.(newValue);

        if (materialRef.current) {
          materialRef.current.uniforms.uMorphFactor.value = newValue;
        }

        // Sync vector overlay morph factor
        if (vectorMaterialRef.current) {
          vectorMaterialRef.current.uniforms.uMorphFactor.value = newValue;
        }

        // Sync dark background morph factor (for vectorOnlyMode)
        if (darkMaterialRef.current) {
          darkMaterialRef.current.uniforms.uMorphFactor.value = newValue;
        }

        if (progress >= 1) {
          animation.active = false;
          const finalView = animation.endValue >= 0.5 ? 'flat' : 'globe';
          onMorphComplete?.(finalView);
        }
      }

      // Update light direction based on camera position for globe view
      if (materialRef.current && morphFactor < 0.5) {
        const cameraDir = new THREE.Vector3();
        camera.getWorldDirection(cameraDir);
        materialRef.current.uniforms.uLightDirection.value
          .copy(cameraDir)
          .negate()
          .add(new THREE.Vector3(0.3, 0.5, 0))
          .normalize();
      }
    });

    // Imperative handle for external control
    useImperativeHandle(
      ref,
      () => ({
        // Use ref for real-time value (not stale state)
        getMorphFactor: () => morphFactorRef.current,
        setMorphFactor: (value: number) => {
          const clamped = Math.max(0, Math.min(1, value));
          morphFactorRef.current = clamped;
          setMorphFactor(clamped);
          if (materialRef.current) {
            materialRef.current.uniforms.uMorphFactor.value = clamped;
          }
          if (vectorMaterialRef.current) {
            vectorMaterialRef.current.uniforms.uMorphFactor.value = clamped;
          }
          if (darkMaterialRef.current) {
            darkMaterialRef.current.uniforms.uMorphFactor.value = clamped;
          }
        },
        morphToGlobe: (duration = animationDuration) => {
          onMorphStart?.('globe');
          animationRef.current = {
            active: true,
            startTime: performance.now() / 1000,
            startValue: morphFactorRef.current,
            endValue: 0,
            duration,
          };
        },
        morphToFlat: (duration = animationDuration) => {
          onMorphStart?.('flat');
          animationRef.current = {
            active: true,
            startTime: performance.now() / 1000,
            startValue: morphFactorRef.current,
            endValue: 1,
            duration,
          };
        },
        toggle: (duration = animationDuration) => {
          const targetFlat = morphFactorRef.current < 0.5;
          onMorphStart?.(targetFlat ? 'flat' : 'globe');
          animationRef.current = {
            active: true,
            startTime: performance.now() / 1000,
            startValue: morphFactorRef.current,
            endValue: targetFlat ? 1 : 0,
            duration,
          };
        },
        isFlat: () => morphFactorRef.current > 0.5,
        setVectorOverlay: (visible: boolean) => {
          setVectorOverlayVisible(visible);
        },
        getVectorOverlay: () => vectorOverlayVisible,
      }),
      [animationDuration, onMorphStart, vectorOverlayVisible]
    );

    // Create geometry with enough segments for smooth morphing
    const geometry = useMemo(() => {
      const geo = new THREE.PlaneGeometry(1, 1, 128, 64);
      return geo;
    }, []);

    // In vectorOnlyMode, force vector overlay to be visible
    const effectiveVectorOverlayVisible = vectorOnlyMode || vectorOverlayVisible;

    return (
      <group>
        {/* Main earth mesh - hidden in vectorOnlyMode, shows only dark background */}
        {/* Use FrontSide to prevent seeing inside of sphere during globe mode */}
        {!vectorOnlyMode && (
          <mesh ref={meshRef} geometry={geometry} renderOrder={0}>
            <shaderMaterial
              ref={materialRef}
              vertexShader={morphVertexShader}
              fragmentShader={morphFragmentShader}
              uniforms={uniforms}
              side={THREE.FrontSide}
              transparent={false}
              depthWrite={true}
              depthTest={true}
            />
          </mesh>
        )}

        {/* Dark background mesh for vectorOnlyMode (WARGAMES theme) - morphs with globe */}
        {vectorOnlyMode && (
          <mesh ref={meshRef} geometry={geometry} renderOrder={0}>
            <shaderMaterial
              ref={darkMaterialRef}
              vertexShader={morphVertexShader}
              fragmentShader={darkFragmentShader}
              uniforms={darkUniforms}
              side={THREE.FrontSide}
              transparent={false}
              depthWrite={true}
              depthTest={true}
            />
          </mesh>
        )}

        {/* Vector overlay (country borders) */}
        {effectiveVectorOverlayVisible && vectorGeometry && (
          <lineSegments geometry={vectorGeometry} frustumCulled={false}>
            <shaderMaterial
              ref={vectorMaterialRef}
              vertexShader={vectorOverlayVertexShader}
              fragmentShader={vectorOverlayFragmentShader}
              uniforms={vectorUniforms}
              transparent={true}
              depthWrite={false}
              depthTest={true}
              blending={THREE.NormalBlending}
            />
          </lineSegments>
        )}
      </group>
    );
  }
);

/**
 * Utility hook for controlling MorphingGlobe from parent components
 */
export function useMorphingGlobe() {
  const ref = useRef<MorphingGlobeHandle>(null);

  return {
    ref,
    morphToGlobe: (duration?: number) => ref.current?.morphToGlobe(duration),
    morphToFlat: (duration?: number) => ref.current?.morphToFlat(duration),
    toggle: (duration?: number) => ref.current?.toggle(duration),
    getMorphFactor: () => ref.current?.getMorphFactor() ?? 0,
    isFlat: () => ref.current?.isFlat() ?? false,
    setVectorOverlay: (visible: boolean) => ref.current?.setVectorOverlay(visible),
    getVectorOverlay: () => ref.current?.getVectorOverlay() ?? false,
  };
}

/**
 * Helper to convert lon/lat to position based on morph factor
 * Use this for positioning markers during the transition
 */
export function getMorphedPosition(
  lon: number,
  lat: number,
  morphFactor: number,
  radius: number = EARTH_RADIUS
): THREE.Vector3 {
  // Sphere position - match the vertex shader formula exactly:
  // Shader: phi = uv.y * PI, theta = uv.x * 2*PI - PI
  // Where uv.x = (lon + 180) / 360, so theta = lon * PI/180
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon); // Match shader: theta ranges -PI to PI

  const spherePos = new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),  // Negate X to fix texture mirroring
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );

  // Flat position (normalized 0-1, then scaled)
  // Match the vertex shader formula exactly:
  // Shader: flatPos.x = (uv.x - 0.5) * uFlatWidth
  // Shader: flatPos.y = (0.5 - uv.y) * uFlatHeight
  // Where uv.x = (lon + 180) / 360, uv.y = (90 - lat) / 180
  const u = (lon + 180) / 360;
  const v = (90 - lat) / 180; // uv.y in shader terms

  const flatPos = new THREE.Vector3(
    (u - 0.5) * FLAT_WIDTH,
    (0.5 - v) * FLAT_HEIGHT, // Match shader: (0.5 - uv.y) * uFlatHeight
    0
  );

  // Interpolate
  return spherePos.lerp(flatPos, morphFactor);
}

export default MorphingGlobe;
