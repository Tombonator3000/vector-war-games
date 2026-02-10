import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('@react-three/fiber', () => {
  const THREE = require('three');
  const stableCamera = new THREE.PerspectiveCamera();
  stableCamera.position.set(0, 0, 5);
  const stableScene = new THREE.Scene();
  const stableGl = {
    domElement: document.createElement('canvas'),
    setPixelRatio: () => {},
    setSize: () => {},
    shadowMap: { enabled: false },
  };
  const stableSize = { width: 1024, height: 512 };
  const stableClock = {
    getElapsedTime: () => 0,
    start: () => {},
    stop: () => {},
  };
  const stableResult = {
    camera: stableCamera,
    size: stableSize,
    clock: stableClock,
    gl: stableGl,
    scene: stableScene,
  };

  const Canvas = (_props: { children: React.ReactNode; [k: string]: unknown }) => (
    <div data-testid="mock-canvas" />
  );

  const useLoader = (_loader: unknown, input: string[] | string) => {
    const entries = Array.isArray(input) ? input : [input];
    return entries.map(() => new THREE.Texture());
  };

  const useThree = () => stableResult;

  const useFrame = () => {};

  return {
    Canvas,
    useLoader,
    useThree,
    useFrame,
  };
});

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
}));

vi.mock('@/components/MorphingGlobe', () => {
  const ReactActual = require('react');
  return {
    MorphingGlobe: ReactActual.forwardRef(() => null),
    getMorphedPosition: (lon: number, lat: number) => ({ x: lon, y: lat, z: 0 }),
    MORPHING_FLAT_WIDTH: 36,
    MORPHING_FLAT_HEIGHT: 18,
  };
});

vi.mock('@/components/WeatherClouds', () => ({
  WeatherClouds: () => null,
}));

vi.mock('@/components/TerritoryMarkers', () => ({
  TerritoryMarkers: () => null,
}));

vi.mock('@/lib/territoryPolygons', () => ({
  loadTerritoryData: vi.fn(async () => ({ type: 'FeatureCollection', features: [] })),
  createTerritoryBoundaries: vi.fn(() => []),
}));

vi.mock('@/lib/missileTrajectories', () => ({
  createMissileTrajectory: vi.fn(() => ({
    id: 'test',
    points: [],
    progress: 0,
    done: false,
  })),
  updateMissileAnimation: vi.fn(() => false),
  updateMissileTrajectoryPositions: vi.fn(),
  createExplosion: vi.fn(() => ({
    id: 'exp-test',
    position: { x: 0, y: 0, z: 0 },
    progress: 0,
    done: false,
  })),
  animateExplosion: vi.fn(() => false),
}));

vi.mock('@/lib/unitModels', () => ({
  createUnitBillboard: vi.fn(() => null),
  disposeUnitVisualization: vi.fn(),
}));

vi.mock('@/lib/renderingUtils', () => ({
  resolvePublicAssetPath: vi.fn((path: string) => path),
}));

import GlobeScene, { type GlobeSceneHandle } from '../GlobeScene';

describe('GlobeScene imperative handle', () => {
  beforeEach(() => {
    const gradientStub = { addColorStop: () => {} };
    const contextStub = {
      createRadialGradient: () => gradientStub,
      fillStyle: '',
      fillRect: () => {},
      strokeStyle: '',
      lineWidth: 1,
      beginPath: () => {},
      arc: () => {},
      stroke: () => {},
      clearRect: () => {},
      drawImage: () => {},
    } as unknown as CanvasRenderingContext2D;

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(contextStub);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exposes missile and explosion helpers through the ref handle', async () => {
    const ref = React.createRef<GlobeSceneHandle>();

    render(
      <GlobeScene
        ref={ref}
        cam={{ x: 0, y: 0, zoom: 1 }}
        nations={[]}
        showTerritories={false}
        showUnits={false}
      />,
    );

    await waitFor(() => {
      expect(ref.current?.overlayCanvas).toBeInstanceOf(HTMLCanvasElement);
    });

    const handle = ref.current!;
    expect(typeof handle.fireMissile).toBe('function');
    expect(typeof handle.addExplosion).toBe('function');
    expect(typeof handle.clearMissiles).toBe('function');
    expect(typeof handle.clearExplosions).toBe('function');
    expect(typeof handle.projectLonLat).toBe('function');
    expect(typeof handle.pickLonLat).toBe('function');
  });
});
