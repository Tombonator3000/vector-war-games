import { useRef, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

interface Globe3DProps {
  nations?: any[];
  onNationClick?: (nationId: string) => void;
}

function Earth() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Create earth