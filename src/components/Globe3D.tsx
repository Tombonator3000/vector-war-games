import { useMemo, useRef, useEffect, Suspense, Component, ReactNode } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars, Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface Globe3DProps {
  nations?: any[];
  onNationClick?: (nationId: string) => void;
}

// Error boundary for WebGL/Three.js errors
interface ErrorBoundaryState {
  hasError: boolean;
}

class Globe3DErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('Globe3D error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <GlobeFallback />;
    }
    return this.props.children;
  }
}

// Fallback component when WebGL fails
function GlobeFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-blue-900 via-blue-600 to-cyan-400 shadow-[0_0_60px_rgba(59,130,246,0.5)] animate-pulse">
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-green-800 via-green-600 to-emerald-400 opacity-60" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-transparent to-white/20" />
      </div>
    </div>
  );
}

// Loading component
function GlobeLoader() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-48 h-48 rounded-full border-4 border-cyan-500/30 border-t-cyan-500 animate-spin" />
    </div>
  );
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

  useEffect(() => {
    [colorMap, normalMap, specularMap].forEach(texture => {
      if (texture) {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 16;
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.flipY = false; // Prevent texture inversion on globe
        texture.needsUpdate = true;
      }
    });
  }, [colorMap, normalMap, specularMap]);

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
    <Globe3DErrorBoundary>
      <Suspense fallback={<GlobeLoader />}>
        <div className="w-full h-full">
          <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
            <ambientLight intensity={0.6} />
            <pointLight position={[10, 10, 10]} intensity={2} />
            <pointLight position={[-10, -10, -10]} intensity={0.8} />
            <Stars radius={100} depth={50} count={5000} factor={4} />
            <Earth />
            <OrbitControls
              enableZoom={true}
              enablePan={true}
              mouseButtons={{
                LEFT: undefined,
                MIDDLE: undefined,
                RIGHT: 2, // Right button for panning
              }}
              zoomSpeed={1.2}
            />
          </Canvas>
        </div>
      </Suspense>
    </Globe3DErrorBoundary>
  );
}