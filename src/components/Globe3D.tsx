import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface Globe3DProps {
  nations?: any[];
  onNationClick?: (nationId: string) => void;
}

function Earth() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001;
    }
  });

  return (
    <Sphere ref={meshRef} args={[2, 64, 64]}>
      <meshStandardMaterial
        color="#1e40af"
        metalness={0.4}
        roughness={0.7}
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