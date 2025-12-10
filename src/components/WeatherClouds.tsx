/**
 * WeatherClouds - 3D cloud layer rendered from weather radar data
 *
 * Renders cloud formations on top of the globe/flat map with:
 * - Volumetric-looking cloud meshes using instanced rendering
 * - Shadow layer offset below to create floating effect
 * - Smooth morphing between globe and flat map views
 * - Animated subtle drift for realism
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getMorphedPosition } from '@/components/MorphingGlobe';
import type { CloudRegion } from '@/hooks/useWeatherRadar';

const EARTH_RADIUS = 1.8;

// Cloud altitude above the surface (in globe radius units)
const CLOUD_BASE_ALTITUDE = 0.08;
// Shadow offset below the cloud (creates floating effect)
const SHADOW_OFFSET = 0.04;
// Maximum instances per cloud type
const MAX_CLOUD_INSTANCES = 200;
// Cloud particle count per region (for volumetric effect)
const PARTICLES_PER_CLOUD = 5;

interface WeatherCloudsProps {
  /** Cloud regions from weather radar data */
  clouds: CloudRegion[];
  /** Current morph factor (0 = globe, 1 = flat) */
  morphFactor: number;
  /** Overall opacity multiplier */
  opacity?: number;
  /** Whether to show shadows */
  showShadows?: boolean;
  /** Animation speed multiplier */
  animationSpeed?: number;
}

// Cloud vertex shader with billboarding and morph support
const cloudVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uMorphFactor;

  attribute vec3 instancePosition;
  attribute float instanceScale;
  attribute float instanceOpacity;
  attribute vec3 instanceColor;
  attribute float instancePhase;

  varying float vOpacity;
  varying vec3 vColor;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vOpacity = instanceOpacity;
    vColor = instanceColor;

    // Billboard the cloud particle to always face camera
    vec3 cameraRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
    vec3 cameraUp = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);

    // Subtle animation - drift and bob
    float drift = sin(uTime * 0.3 + instancePhase) * 0.02;
    float bob = sin(uTime * 0.5 + instancePhase * 2.0) * 0.01;

    // Scale the quad vertices
    vec3 scaledPosition = position * instanceScale;

    // Apply billboarding
    vec3 worldPosition = instancePosition;
    worldPosition += cameraRight * scaledPosition.x;
    worldPosition += cameraUp * scaledPosition.y;
    worldPosition.x += drift;
    worldPosition.y += bob * (1.0 - uMorphFactor); // Less bob when flat

    gl_Position = projectionMatrix * viewMatrix * vec4(worldPosition, 1.0);
  }
`;

// Cloud fragment shader with soft edges
const cloudFragmentShader = /* glsl */ `
  uniform float uGlobalOpacity;

  varying float vOpacity;
  varying vec3 vColor;
  varying vec2 vUv;

  void main() {
    // Soft circular cloud shape
    vec2 center = vUv - 0.5;
    float dist = length(center);

    // Soft falloff from center
    float alpha = smoothstep(0.5, 0.15, dist);

    // Add some noise-like variation (fake it with math)
    float noise = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
    alpha *= 0.85 + noise * 0.15;

    // Apply opacity
    alpha *= vOpacity * uGlobalOpacity;

    gl_FragColor = vec4(vColor, alpha);
  }
`;

// Shadow vertex shader (similar but with offset)
const shadowVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uMorphFactor;
  uniform float uShadowOffset;

  attribute vec3 instancePosition;
  attribute float instanceScale;
  attribute float instanceOpacity;
  attribute float instancePhase;

  varying float vOpacity;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vOpacity = instanceOpacity * 0.6; // Shadows are more transparent

    // Billboard
    vec3 cameraRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
    vec3 cameraUp = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);

    // Shadow drift matches cloud
    float drift = sin(uTime * 0.3 + instancePhase) * 0.02;

    // Scale slightly larger for shadow spread
    vec3 scaledPosition = position * instanceScale * 1.2;

    // Apply billboarding with shadow offset
    vec3 worldPosition = instancePosition;

    // Offset shadow downward (in world Y for flat, radially inward for globe)
    float globeShadowOffset = -uShadowOffset;
    float flatShadowOffset = -uShadowOffset * 0.5;
    worldPosition.y += mix(0.0, flatShadowOffset, uMorphFactor);

    // For globe mode, offset toward center (radially inward)
    if (uMorphFactor < 0.5) {
      vec3 radialDir = normalize(worldPosition);
      worldPosition -= radialDir * uShadowOffset * (1.0 - uMorphFactor * 2.0);
    }

    worldPosition += cameraRight * scaledPosition.x;
    worldPosition += cameraUp * scaledPosition.y;
    worldPosition.x += drift;

    gl_Position = projectionMatrix * viewMatrix * vec4(worldPosition, 1.0);
  }
`;

// Shadow fragment shader
// Note: With MultiplyBlending, we need to output colors that blend toward white (1,1,1)
// when alpha decreases, since multiplying by 1 = no change. We pre-multiply the alpha
// into the color and output solid alpha to avoid black box artifacts.
const shadowFragmentShader = /* glsl */ `
  uniform float uGlobalOpacity;

  varying float vOpacity;
  varying vec2 vUv;

  void main() {
    vec2 center = vUv - 0.5;
    float dist = length(center);

    // Softer falloff for shadow
    float alpha = smoothstep(0.5, 0.25, dist);
    alpha *= vOpacity * uGlobalOpacity;

    // For multiply blending: interpolate between white (no effect) and dark shadow
    // When alpha=0 → output white (1,1,1) → multiply has no effect
    // When alpha=1 → output shadow color → multiply darkens
    vec3 shadowColor = vec3(0.05, 0.05, 0.1);
    vec3 finalColor = mix(vec3(1.0), shadowColor, alpha);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

interface CloudInstance {
  position: THREE.Vector3;
  scale: number;
  opacity: number;
  color: THREE.Color;
  phase: number;
  lon: number;
  lat: number;
  altitudeOffset: number;
}

export function WeatherClouds({
  clouds,
  morphFactor,
  opacity = 1.0,
  showShadows = true,
  animationSpeed = 1.0,
}: WeatherCloudsProps) {
  const cloudMeshRef = useRef<THREE.InstancedMesh>(null);
  const shadowMeshRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  // Generate cloud instances from regions
  const cloudInstances = useMemo(() => {
    const instances: CloudInstance[] = [];

    clouds.forEach((cloud) => {
      // Generate multiple particles per cloud region for volumetric effect
      const particleCount = Math.min(
        PARTICLES_PER_CLOUD,
        Math.ceil(PARTICLES_PER_CLOUD * cloud.intensity)
      );

      for (let i = 0; i < particleCount; i++) {
        // Random offset within cloud region
        const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.5;
        const dist = Math.random() * cloud.radius * 0.5;
        const latOffset = Math.sin(angle) * dist;
        const lonOffset = Math.cos(angle) * dist / Math.cos(THREE.MathUtils.degToRad(cloud.latitude));

        const lon = cloud.longitude + lonOffset;
        const lat = THREE.MathUtils.clamp(cloud.latitude + latOffset, -85, 85);

        // Calculate 3D position
        const altitude = CLOUD_BASE_ALTITUDE * cloud.altitudeScale + (Math.random() * 0.02);
        const position = getMorphedPosition(lon, lat, morphFactor, EARTH_RADIUS + altitude);

        // Scale based on cloud size and intensity
        const baseScale = 0.15 + cloud.radius * 0.02;
        const scale = baseScale * (0.6 + Math.random() * 0.4) * cloud.intensity;

        // Color based on cloud type
        let color: THREE.Color;
        switch (cloud.type) {
          case 'storm':
            color = new THREE.Color(0.35, 0.35, 0.45);
            break;
          case 'heavy':
            color = new THREE.Color(0.55, 0.55, 0.65);
            break;
          case 'moderate':
            color = new THREE.Color(0.75, 0.75, 0.82);
            break;
          case 'light':
          default:
            color = new THREE.Color(0.9, 0.9, 0.95);
        }

        instances.push({
          position,
          scale,
          opacity: 0.5 + cloud.intensity * 0.4,
          color,
          phase: Math.random() * Math.PI * 2,
          lon,
          lat,
          altitudeOffset: altitude,
        });
      }
    });

    return instances.slice(0, MAX_CLOUD_INSTANCES);
  }, [clouds, morphFactor]);

  // Plane geometry for billboard
  const planeGeometry = useMemo(() => {
    return new THREE.PlaneGeometry(1, 1);
  }, []);

  // Cloud material
  const cloudMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: cloudVertexShader,
      fragmentShader: cloudFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uMorphFactor: { value: morphFactor },
        uGlobalOpacity: { value: opacity },
      },
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide,
    });
  }, []);

  // Shadow material
  const shadowMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: shadowVertexShader,
      fragmentShader: shadowFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uMorphFactor: { value: morphFactor },
        uGlobalOpacity: { value: opacity },
        uShadowOffset: { value: SHADOW_OFFSET },
      },
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.MultiplyBlending,
      side: THREE.DoubleSide,
    });
  }, []);

  // Update instance attributes when cloud data changes
  useEffect(() => {
    const cloudMesh = cloudMeshRef.current;
    const shadowMesh = shadowMeshRef.current;

    if (!cloudMesh || cloudInstances.length === 0) return;

    // Create attribute arrays
    const positions = new Float32Array(MAX_CLOUD_INSTANCES * 3);
    const scales = new Float32Array(MAX_CLOUD_INSTANCES);
    const opacities = new Float32Array(MAX_CLOUD_INSTANCES);
    const colors = new Float32Array(MAX_CLOUD_INSTANCES * 3);
    const phases = new Float32Array(MAX_CLOUD_INSTANCES);

    // Fill attribute data
    cloudInstances.forEach((instance, i) => {
      positions[i * 3] = instance.position.x;
      positions[i * 3 + 1] = instance.position.y;
      positions[i * 3 + 2] = instance.position.z;

      scales[i] = instance.scale;
      opacities[i] = instance.opacity;

      colors[i * 3] = instance.color.r;
      colors[i * 3 + 1] = instance.color.g;
      colors[i * 3 + 2] = instance.color.b;

      phases[i] = instance.phase;
    });

    // Set cloud mesh attributes
    cloudMesh.geometry.setAttribute(
      'instancePosition',
      new THREE.InstancedBufferAttribute(positions, 3)
    );
    cloudMesh.geometry.setAttribute(
      'instanceScale',
      new THREE.InstancedBufferAttribute(scales, 1)
    );
    cloudMesh.geometry.setAttribute(
      'instanceOpacity',
      new THREE.InstancedBufferAttribute(opacities, 1)
    );
    cloudMesh.geometry.setAttribute(
      'instanceColor',
      new THREE.InstancedBufferAttribute(colors, 3)
    );
    cloudMesh.geometry.setAttribute(
      'instancePhase',
      new THREE.InstancedBufferAttribute(phases, 1)
    );
    cloudMesh.count = cloudInstances.length;

    // Set shadow mesh attributes (reuse positions, scales, opacities, phases)
    if (shadowMesh && showShadows) {
      shadowMesh.geometry.setAttribute(
        'instancePosition',
        new THREE.InstancedBufferAttribute(positions.slice(), 3)
      );
      shadowMesh.geometry.setAttribute(
        'instanceScale',
        new THREE.InstancedBufferAttribute(scales.slice(), 1)
      );
      shadowMesh.geometry.setAttribute(
        'instanceOpacity',
        new THREE.InstancedBufferAttribute(opacities.slice(), 1)
      );
      shadowMesh.geometry.setAttribute(
        'instancePhase',
        new THREE.InstancedBufferAttribute(phases.slice(), 1)
      );
      shadowMesh.count = cloudInstances.length;
    }
  }, [cloudInstances, showShadows]);

  // Update positions when morphFactor changes
  useEffect(() => {
    const cloudMesh = cloudMeshRef.current;
    const shadowMesh = shadowMeshRef.current;

    if (!cloudMesh || cloudInstances.length === 0) return;

    // Recalculate positions for new morph factor
    const positions = new Float32Array(MAX_CLOUD_INSTANCES * 3);

    cloudInstances.forEach((instance, i) => {
      const newPos = getMorphedPosition(
        instance.lon,
        instance.lat,
        morphFactor,
        EARTH_RADIUS + instance.altitudeOffset
      );

      positions[i * 3] = newPos.x;
      positions[i * 3 + 1] = newPos.y;
      positions[i * 3 + 2] = newPos.z;
    });

    // Update cloud mesh positions
    const posAttr = cloudMesh.geometry.getAttribute('instancePosition') as THREE.InstancedBufferAttribute;
    if (posAttr) {
      posAttr.array.set(positions);
      posAttr.needsUpdate = true;
    }

    // Update shadow mesh positions
    if (shadowMesh && showShadows) {
      const shadowPosAttr = shadowMesh.geometry.getAttribute('instancePosition') as THREE.InstancedBufferAttribute;
      if (shadowPosAttr) {
        shadowPosAttr.array.set(positions);
        shadowPosAttr.needsUpdate = true;
      }
    }

    // Update morph factor uniform
    if (cloudMaterial) {
      cloudMaterial.uniforms.uMorphFactor.value = morphFactor;
    }
    if (shadowMaterial) {
      shadowMaterial.uniforms.uMorphFactor.value = morphFactor;
    }
  }, [morphFactor, cloudInstances, cloudMaterial, shadowMaterial, showShadows]);

  // Animation frame
  useFrame((_, delta) => {
    timeRef.current += delta * animationSpeed;

    if (cloudMaterial) {
      cloudMaterial.uniforms.uTime.value = timeRef.current;
      cloudMaterial.uniforms.uGlobalOpacity.value = opacity;
    }

    if (shadowMaterial) {
      shadowMaterial.uniforms.uTime.value = timeRef.current;
      shadowMaterial.uniforms.uGlobalOpacity.value = opacity;
    }
  });

  // Cleanup
  useEffect(() => {
    return () => {
      planeGeometry.dispose();
      cloudMaterial.dispose();
      shadowMaterial.dispose();
    };
  }, [planeGeometry, cloudMaterial, shadowMaterial]);

  if (cloudInstances.length === 0) {
    return null;
  }

  return (
    <group>
      {/* Shadow layer (rendered first, below clouds) */}
      {showShadows && (
        <instancedMesh
          ref={shadowMeshRef}
          args={[planeGeometry, shadowMaterial, MAX_CLOUD_INSTANCES]}
          frustumCulled={false}
          renderOrder={5}
        />
      )}

      {/* Cloud layer */}
      <instancedMesh
        ref={cloudMeshRef}
        args={[planeGeometry, cloudMaterial, MAX_CLOUD_INSTANCES]}
        frustumCulled={false}
        renderOrder={6}
      />
    </group>
  );
}

export default WeatherClouds;
