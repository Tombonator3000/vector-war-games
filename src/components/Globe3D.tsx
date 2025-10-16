import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars, Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface Globe3DProps {
  nations?: any[];
  onNationClick?: (nationId: string) => void;
}

function Earth() {
  const meshRef = useRef<THREE.Mesh>(null);

  // Load realistic Earth textures
  const textureUrls = useMemo(() => {
    const baseUrl = import.meta.env.BASE_URL;
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    return [
      `${normalizedBase}textures/earth_day.jpg`,
      `${normalizedBase}textures/earth_normal.jpg`,
      `${normalizedBase}textures/earth_specular.jpg`,
    ];
  }, []);
  const [colorMap, normalMap, specularMap] = useLoader(THREE.TextureLoader, textureUrls);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001;
    }
  });

  return (
    <Sphere ref={meshRef} args={[2, 128, 128]}>
      <meshPhongMaterial
        map={colorMap}
        normalMap={normalMap}
        specularMap={specularMap}
        shininess={15}
        normalScale={new THREE.Vector2(0.85, 0.85)}
      />
    </Sphere>
  );
}

export function Globe3D({ nations = [], onNationClick }: Globe3DProps) {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Stars radius={100} depth={50} count={5000} factor={4} />
        <Earth />
        <OrbitControls enableZoom={true} enablePan={true} />
      </Canvas>
    </div>
  );
}