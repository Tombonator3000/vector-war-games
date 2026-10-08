import { memo } from 'react';
import * as THREE from 'three';
import { EARTH_RADIUS } from '@/constants/globe.constants';
import { ATMOSPHERE_HALO_VERTEX_SHADER, ATMOSPHERE_HALO_FRAGMENT_SHADER } from '@/constants/globeShaders';

interface AtmosphereProps {
  morphFactor?: number;
}

export const Atmosphere = memo(function Atmosphere({ morphFactor = 0 }: AtmosphereProps) {
  // Fade atmosphere as we transition to flat map
  const opacity = Math.max(0, 1 - morphFactor * 1.5);

  // Don't render if fully flat
  if (morphFactor > 0.7) {
    return null;
  }

  return (
    <group>
      {/* Outer halo ring around globe - creates visible glow at edges */}
      <mesh scale={1.12} renderOrder={2}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <shaderMaterial
          vertexShader={ATMOSPHERE_HALO_VERTEX_SHADER}
          fragmentShader={ATMOSPHERE_HALO_FRAGMENT_SHADER}
          uniforms={{ uOpacity: { value: opacity * 0.8 } }}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  );
});

