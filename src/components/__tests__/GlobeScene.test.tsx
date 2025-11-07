import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('@react-three/fiber', () => {
  const Canvas = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-canvas">{children}</div>
  );

  const useLoader = (_loader: unknown, input: string[] | string) => {
    const THREE = require('three');
    const entries = Array.isArray(input) ? input : [input];
    return entries.map(() => new THREE.Texture());
  };

  const useThree = () => {
    const THREE = require('three');
    return {
      camera: {
        position: { set: () => {} },
        lookAt: () => {},
        updateProjectionMatrix: () => {},
      },
      size: { width: 1024, height: 512 },
      clock: {
        getElapsedTime: () => 0,
        start: () => {},
        stop: () => {},
      },
      gl: {
        domElement: document.createElement('canvas'),
        setPixelRatio: () => {},
        setSize: () => {},
        shadowMap: { enabled: false },
      },
      scene: new THREE.Scene(),
    };
  };

  const useFrame = () => {};

  return {
    Canvas,
    useLoader,
    useThree,
    useFrame,
  };
});

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
