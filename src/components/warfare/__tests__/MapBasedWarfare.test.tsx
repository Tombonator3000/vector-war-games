import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render, waitFor, screen, act } from '@testing-library/react';
import type { TerritoryState } from '@/hooks/useConventionalWarfare';
import type { DragEndEvent, DragMoveEvent, DragStartEvent } from '@dnd-kit/core';

const globalAny = globalThis as Record<string, unknown>;
if (typeof globalAny.HTMLElement === 'undefined') {
  globalAny.HTMLElement = class {};
}

type MapBasedWarfareComponent = typeof import('../MapBasedWarfare').default;
let MapBasedWarfare: MapBasedWarfareComponent;

const latestDndHandlers: {
  current: {
    onDragStart?: (event: DragStartEvent) => void;
    onDragMove?: (event: DragMoveEvent) => void;
    onDragEnd?: (event: DragEndEvent) => void;
    onDragCancel?: (event: DragEndEvent) => void;
  };
} = { current: {} };

vi.mock('@dnd-kit/core', () => {
  const React = require('react');
  return {
    DndContext: ({ children, ...props }: any) => {
      latestDndHandlers.current = props;
      return <div data-testid="mock-dnd-context">{children}</div>;
    },
    DragOverlay: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    useDroppable: () => ({ setNodeRef: () => {}, isOver: false }),
    useDraggable: ({ id }: { id: string; data: unknown }) => {
      return {
        attributes: { 'data-draggable-id': id },
        listeners: {},
        setNodeRef: () => {},
        transform: null,
        isDragging: false,
      };
    },
    PointerSensor: function PointerSensor() {},
    KeyboardSensor: function KeyboardSensor() {},
    useSensor: (_sensor: unknown, config?: unknown) => ({ sensor: _sensor, config }),
    useSensors: (...args: unknown[]) => args,
  };
});

describe('MapBasedWarfare', () => {
  beforeAll(async () => {
    // jsdom does not implement pointer capture APIs
    Element.prototype.setPointerCapture = vi.fn();
    Element.prototype.releasePointerCapture = vi.fn();
    if (typeof window !== 'undefined' && !(globalThis as any).HTMLElement) {
      (globalThis as any).HTMLElement = window.HTMLElement;
    }
    if (typeof (globalThis as any).HTMLElement === 'undefined') {
      vi.stubGlobal('HTMLElement', class {});
    }
    const module = await import('../MapBasedWarfare');
    MapBasedWarfare = module.default;
  });

  const baseTerritory = (overrides: Partial<TerritoryState>): TerritoryState => ({
    id: 'alpha',
    name: 'Alpha',
    region: 'Test',
    type: 'land',
    anchorLat: 0,
    anchorLon: 0,
    controllingNationId: 'player',
    contestedBy: [],
    strategicValue: 1,
    productionBonus: 0,
    instabilityModifier: 0,
    conflictRisk: 0,
    neighbors: [],
    armies: 5,
    unitComposition: { army: 5, navy: 0, air: 0 },
    ...overrides,
  });

  const projector = (lon: number, lat: number) => ({
    x: 200 + lon * 5,
    y: 200 + lat * 5,
    visible: true,
  });

  it('dispatches move callbacks when dragging between friendly territories', async () => {
    const handleMove = vi.fn();
    const territories: TerritoryState[] = [
      baseTerritory({ id: 'alpha', name: 'Alpha', anchorLon: 0, anchorLat: 0, neighbors: ['bravo'] }),
      baseTerritory({
        id: 'bravo',
        name: 'Bravo',
        anchorLon: 10,
        anchorLat: 5,
        neighbors: ['alpha'],
      }),
    ];

    render(
      <MapBasedWarfare
        territories={territories}
        playerId="player"
        projector={projector}
        onAttack={vi.fn()}
        onMove={handleMove}
        onProxyEngagement={vi.fn()}
      />,
    );

    expect(screen.getAllByTestId('warfare-token-alpha').length).toBeGreaterThan(0);

    act(() => {
      latestDndHandlers.current.onDragStart?.({
        active: { id: 'alpha' },
      } as DragStartEvent);
    });

    act(() => {
      latestDndHandlers.current.onDragMove?.({
        active: { id: 'alpha' },
        over: { id: 'bravo' },
      } as DragMoveEvent);
    });

    act(() => {
      latestDndHandlers.current.onDragEnd?.({
        active: { id: 'alpha' },
        over: { id: 'bravo' },
      } as DragEndEvent);
    });

    await waitFor(() => {
      expect(handleMove).toHaveBeenCalledWith('alpha', 'bravo', expect.any(Number));
    });
  });

  it('dispatches attack callbacks when dropping on enemy territory', async () => {
    const handleAttack = vi.fn();
    const territories: TerritoryState[] = [
      baseTerritory({ id: 'alpha', name: 'Alpha', anchorLon: 0, anchorLat: 0, neighbors: ['charlie'] }),
      baseTerritory({
        id: 'charlie',
        name: 'Charlie',
        anchorLon: 15,
        anchorLat: -8,
        neighbors: ['alpha'],
        controllingNationId: 'opponent',
        armies: 2,
        unitComposition: { army: 2, navy: 0, air: 0 },
      }),
    ];

    render(
      <MapBasedWarfare
        territories={territories}
        playerId="player"
        projector={projector}
        onAttack={handleAttack}
        onMove={vi.fn()}
        onProxyEngagement={vi.fn()}
      />,
    );

    expect(screen.getAllByTestId('warfare-token-alpha').length).toBeGreaterThan(0);

    act(() => {
      latestDndHandlers.current.onDragStart?.({
        active: { id: 'alpha' },
      } as DragStartEvent);
    });

    act(() => {
      latestDndHandlers.current.onDragMove?.({
        active: { id: 'alpha' },
        over: { id: 'charlie' },
      } as DragMoveEvent);
    });

    act(() => {
      latestDndHandlers.current.onDragEnd?.({
        active: { id: 'alpha' },
        over: { id: 'charlie' },
      } as DragEndEvent);
    });

    await waitFor(() => {
      expect(handleAttack).toHaveBeenCalledWith('alpha', 'charlie', expect.any(Number));
    });
  });
});
