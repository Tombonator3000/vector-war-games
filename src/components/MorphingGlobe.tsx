/**
 * MorphingGlobe - Seamless globe-to-flat-map transition component
 *
 * Inspired by Polyglobe (pizzint.watch/polyglobe), this component provides
 * a smooth animated transition between a 3D spherical globe view and a
 * 2D flat equirectangular map projection using vertex shader interpolation.
 */
import { forwardRef, useEffect, useMemo, useRef, useState, useImperativeHandle } from 'react';
import type { MutableRefObject } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { resolvePublicAssetPath } from '@/lib/renderingUtils';

const EARTH_RADIUS = 1.8;
const FLAT_ASPECT = 2; // Equirectangular map is 2:1 aspect ratio
const FLAT_HEIGHT = EARTH_RADIUS * 1.5;
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
}

export interface MorphingGlobeProps {
  /** Initial view: 'globe' or 'flat' */
  initialView?: 'globe' | 'flat';
  /** Animation duration in seconds */
  animationDuration?: number;
  /** Texture variant: 'day' or 'night' */
  textureVariant?: 'day' | 'night';
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
    float phi = (1.0 - uv.y) * 3.14159265359; // latitude: 0 at top, PI at bottom
    float theta = uv.x * 2.0 * 3.14159265359 - 3.14159265359; // longitude: -PI to PI

    vec3 spherePos = vec3(
      uRadius * sin(phi) * cos(theta),
      uRadius * cos(phi),
      uRadius * sin(phi) * sin(theta)
    );

    // Flat position (centered plane)
    vec3 flatPos = vec3(
      (uv.x - 0.5) * uFlatWidth,
      (uv.y - 0.5) * uFlatHeight,
      0.0
    );

    // Interpolate between sphere and flat based on morph factor
    vec3 morphedPosition = mix(spherePos, flatPos, uMorphFactor);

    // Normal interpolation
    vec3 sphereNormal = normalize(spherePos);
    vec3 flatNormal = vec3(0.0, 0.0, 1.0);
    vNormal = normalize(mix(sphereNormal, flatNormal, uMorphFactor));

    vPosition = morphedPosition;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(morphedPosition, 1.0);
  }
`;

// Fragment shader with lighting
const morphFragmentShader = /* glsl */ `
  uniform sampler2D uTexture;
  uniform float uMorphFactor;
  uniform vec3 uLightDirection;
  uniform float uAmbientIntensity;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vec4 texColor = texture2D(uTexture, vUv);

    // Simple diffuse lighting
    float diffuse = max(dot(vNormal, normalize(uLightDirection)), 0.0);

    // Blend between lit (globe) and unlit (flat) based on morph factor
    float lightInfluence = mix(1.0, 0.3, uMorphFactor);
    float lighting = mix(uAmbientIntensity, 1.0, diffuse * lightInfluence);

    // Slight brightness boost for flat view
    float flatBoost = mix(1.0, 1.15, uMorphFactor);

    vec3 finalColor = texColor.rgb * lighting * flatBoost;

    gl_FragColor = vec4(finalColor, texColor.a);
  }
`;

// Easing function for smooth animation
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export const MorphingGlobe = forwardRef<MorphingGlobeHandle, MorphingGlobeProps>(
  function MorphingGlobe(
    {
      initialView = 'globe',
      animationDuration = 1.2,
      textureVariant = 'day',
      customTextureUrl,
      onMorphStart,
      onMorphComplete,
      onMorphProgress,
      meshRef: externalMeshRef,
    },
    ref
  ) {
    const internalMeshRef = useRef<THREE.Mesh>(null);
    const meshRef = externalMeshRef ?? internalMeshRef;
    const materialRef = useRef<THREE.ShaderMaterial>(null);
    const { camera } = useThree();

    // Animation state
    const [morphFactor, setMorphFactor] = useState(initialView === 'flat' ? 1 : 0);
    const animationRef = useRef<{
      active: boolean;
      startTime: number;
      startValue: number;
      endValue: number;
      duration: number;
    } | null>(null);

    // Load texture
    const textureUrl = useMemo(() => {
      if (customTextureUrl) return customTextureUrl;
      const variant = textureVariant === 'night' ? 'earth_night_flat' : 'earth_day_flat';
      return resolvePublicAssetPath(`textures/${variant}.jpg`);
    }, [customTextureUrl, textureVariant]);

    const texture = useLoader(THREE.TextureLoader, textureUrl);

    useEffect(() => {
      if (texture) {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 16;
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        // Disable flipY to match shader UV mapping:
        // - uv.y = 0 should sample south pole (bottom of equirectangular image)
        // - uv.y = 1 should sample north pole (top of equirectangular image)
        texture.flipY = false;
        texture.needsUpdate = true;
      }
    }, [texture]);

    // Create shader material uniforms
    const uniforms = useMemo(
      () => ({
        uMorphFactor: { value: initialView === 'flat' ? 1.0 : 0.0 },
        uRadius: { value: EARTH_RADIUS },
        uFlatWidth: { value: FLAT_WIDTH },
        uFlatHeight: { value: FLAT_HEIGHT },
        uTexture: { value: texture },
        uLightDirection: { value: new THREE.Vector3(1, 0.5, 1).normalize() },
        uAmbientIntensity: { value: 0.4 },
      }),
      [texture, initialView]
    );

    // Update texture uniform when it changes
    useEffect(() => {
      if (materialRef.current && texture) {
        materialRef.current.uniforms.uTexture.value = texture;
        materialRef.current.needsUpdate = true;
      }
    }, [texture]);

    // Animation frame update
    useFrame((_, delta) => {
      const animation = animationRef.current;

      if (animation?.active) {
        const elapsed = performance.now() / 1000 - animation.startTime;
        const progress = Math.min(elapsed / animation.duration, 1);
        const easedProgress = easeInOutCubic(progress);

        const newValue =
          animation.startValue + (animation.endValue - animation.startValue) * easedProgress;

        setMorphFactor(newValue);
        onMorphProgress?.(newValue);

        if (materialRef.current) {
          materialRef.current.uniforms.uMorphFactor.value = newValue;
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
        getMorphFactor: () => morphFactor,
        setMorphFactor: (value: number) => {
          const clamped = Math.max(0, Math.min(1, value));
          setMorphFactor(clamped);
          if (materialRef.current) {
            materialRef.current.uniforms.uMorphFactor.value = clamped;
          }
        },
        morphToGlobe: (duration = animationDuration) => {
          onMorphStart?.('globe');
          animationRef.current = {
            active: true,
            startTime: performance.now() / 1000,
            startValue: morphFactor,
            endValue: 0,
            duration,
          };
        },
        morphToFlat: (duration = animationDuration) => {
          onMorphStart?.('flat');
          animationRef.current = {
            active: true,
            startTime: performance.now() / 1000,
            startValue: morphFactor,
            endValue: 1,
            duration,
          };
        },
        toggle: (duration = animationDuration) => {
          const targetFlat = morphFactor < 0.5;
          onMorphStart?.(targetFlat ? 'flat' : 'globe');
          animationRef.current = {
            active: true,
            startTime: performance.now() / 1000,
            startValue: morphFactor,
            endValue: targetFlat ? 1 : 0,
            duration,
          };
        },
        isFlat: () => morphFactor > 0.5,
      }),
      [morphFactor, animationDuration, onMorphStart]
    );

    // Create geometry with enough segments for smooth morphing
    const geometry = useMemo(() => {
      const geo = new THREE.PlaneGeometry(1, 1, 128, 64);
      return geo;
    }, []);

    return (
      <mesh ref={meshRef} geometry={geometry}>
        <shaderMaterial
          ref={materialRef}
          vertexShader={morphVertexShader}
          fragmentShader={morphFragmentShader}
          uniforms={uniforms}
          side={THREE.DoubleSide}
          transparent={true}
          depthWrite={true}
        />
      </mesh>
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
  // Sphere position
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);

  const spherePos = new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );

  // Flat position (normalized 0-1, then scaled)
  // u: longitude maps from -180..+180 to 0..1
  // v: latitude maps from -90..+90 to 0..1 (south at bottom, north at top)
  const u = (lon + 180) / 360;
  const v = (lat + 90) / 180;

  const flatPos = new THREE.Vector3(
    (u - 0.5) * FLAT_WIDTH,
    (v - 0.5) * FLAT_HEIGHT,
    0
  );

  // Interpolate
  return spherePos.lerp(flatPos, morphFactor);
}

export default MorphingGlobe;
