import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import GlobeScene, { type GlobeSceneHandle } from '@/components/GlobeScene';
import { MorphingGlobe, type MorphingGlobeHandle } from '@/components/MorphingGlobe';
import { getMorphedPosition } from '@/lib/globe/geometry';

let renderer: THREE.WebGLRenderer | null = null;
let camera: THREE.Camera | null = null;

function Probe() {
  const three = useThree();
  useEffect(() => { renderer = three.gl; camera = three.camera; }, [three.gl, three.camera]);
  return null;
}

function solidTexture(color: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 4;
  const context = canvas.getContext('2d')!;
  context.fillStyle = color;
  context.fillRect(0, 0, 4, 4);
  return canvas.toDataURL();
}

function App() {
  const [mode, setMode] = useState('material');
  const [night, setNight] = useState(false);
  const [vector, setVector] = useState(false);
  const surface = useRef<THREE.Mesh | null>(null);
  const globe = useRef<MorphingGlobeHandle>(null);
  const scene = useRef<GlobeSceneHandle>(null);
  const texture = useMemo(() => solidTexture(night ? '#ffb440' : '#808080'), [night]);

  useEffect(() => {
    const api = {
      setNight, setVector, setMode,
      ready: () => mode === 'material' ? Boolean(surface.current && globe.current && renderer) : Boolean(scene.current),
      factor: () => mode === 'material' ? globe.current?.getMorphFactor() : scene.current?.getMorphFactor(),
      morph: (flat: boolean) => mode === 'material'
        ? (flat ? globe.current?.morphToFlat(0) : globe.current?.morphToGlobe(0))
        : (flat ? scene.current?.morphToFlat(0) : scene.current?.morphToGlobe(0)),
      project: (lon: number, lat: number) => scene.current?.projectLonLat(lon, lat),
      pick: (x: number, y: number) => scene.current?.pickLonLat(x, y),
      sample: (lon: number, lat: number) => {
        if (!camera || !renderer || !globe.current) return null;
        const point = getMorphedPosition(lon, lat, globe.current.getMorphFactor()).project(camera);
        const gl = renderer.getContext();
        const pixel = new Uint8Array(4);
        gl.readPixels(
          Math.round((point.x / 2 + 0.5) * gl.drawingBufferWidth),
          Math.round((point.y / 2 + 0.5) * gl.drawingBufferHeight),
          1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel,
        );
        return Array.from(pixel);
      },
    };
    Object.assign(window, { globeSmoke: api });
  }, [mode]);

  if (mode === 'scene') {
    return <GlobeScene ref={scene} nations={[]} cam={{ x: 0, y: 0, zoom: 1 }}
      showTerritories={false} showUnits={false} dayNightBlend={night ? 1 : 0} vectorOnlyMode={vector} />;
  }
  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 40 }} dpr={1} gl={{ preserveDrawingBuffer: true }}>
      <Probe />
      <Suspense fallback={null}>
        <MorphingGlobe ref={globe} meshRef={surface} textureVariant={night ? 'night' : 'day'}
          customTextureUrl={texture} dayNightBlend={night ? 1 : 0} vectorOnlyMode={vector} />
      </Suspense>
    </Canvas>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
