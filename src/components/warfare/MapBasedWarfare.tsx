import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragMoveEvent,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  type KeyboardCoordinateGetter,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import { keyboardCoordinates } from '@dnd-kit/modifiers';
import type { TerritoryState } from '@/hooks/useConventionalWarfare';
import { Button } from '@/components/ui/button';

export interface ProjectedPoint {
  x: number;
  y: number;
  visible: boolean;
}

interface MapBasedWarfareProps {
  territories: TerritoryState[];
  playerId: string;
  projector?: (lon: number, lat: number) => ProjectedPoint;
  onAttack: (fromTerritoryId: string, toTerritoryId: string, armies: number) => void;
  onMove: (fromTerritoryId: string, toTerritoryId: string, armies: number) => void;
  onProxyEngagement: (territoryId: string, opposingId: string) => void;
  availableReinforcements?: number;
  onPlaceReinforcements?: (territoryId: string, count: number) => void;
  onHoverChange?: (territoryId: string | null) => void;
  onSelectionChange?: (territoryId: string | null) => void;
  onDragStateChange?: (state: { sourceId: string | null; targetId: string | null; armies: number }) => void;
  className?: string;
}

interface TerritoryMarkerProps {
  territory: TerritoryState;
  isPlayerOwned: boolean;
  position: ProjectedPoint;
  armiesToSend: number;
  isActive: boolean;
  isNeighborHighlight: boolean;
  projectorUnavailable: boolean;
  availableReinforcements?: number;
  onPlaceReinforcements?: (territoryId: string, count: number) => void;
  onProxyEngagement: (territoryId: string, opposingId: string) => void;
}

interface DragPreview {
  sourceId: string;
  armies: number;
  name: string;
}

function TerritoryDropZone({
  territory,
  position,
  isActive,
  isNeighbor,
}: {
  territory: TerritoryState;
  position: ProjectedPoint;
  isActive: boolean;
  isNeighbor: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: territory.id,
    data: { territoryId: territory.id },
  });

  if (!position.visible) {
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      data-testid={`warfare-drop-${territory.id}`}
      className={
        'pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 rounded-full border transition-colors duration-150'
      }
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isNeighbor ? 78 : 64,
        height: isNeighbor ? 78 : 64,
        borderColor: isOver ? 'rgba(56,189,248,0.9)' : isNeighbor ? 'rgba(56,189,248,0.45)' : 'rgba(148,163,184,0.25)',
        backgroundColor: isOver ? 'rgba(59,130,246,0.18)' : 'rgba(15,23,42,0.35)',
        boxShadow: isNeighbor || isOver ? '0 0 18px rgba(56,189,248,0.35)' : 'none',
      }}
    >
      <div className="pointer-events-none flex h-full w-full items-center justify-center">
        <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-200/80">
          {territory.name}
        </span>
      </div>
      {isActive && (
        <div className="absolute inset-0 animate-ping rounded-full border border-cyan-400/40" />
      )}
    </div>
  );
}

function TerritoryMarker({
  territory,
  isPlayerOwned,
  position,
  armiesToSend,
  isActive,
  isNeighborHighlight,
  projectorUnavailable,
  availableReinforcements,
  onPlaceReinforcements,
  onProxyEngagement,
}: TerritoryMarkerProps) {
  const disabled = !isPlayerOwned || territory.armies <= 1;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: territory.id,
    data: {
      territoryId: territory.id,
      armies: armiesToSend,
      ownerId: territory.controllingNationId,
      name: territory.name,
    },
    disabled,
  });

  if (!position.visible) {
    return null;
  }

  const translateX = transform ? transform.x : 0;
  const translateY = transform ? transform.y : 0;

  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: `translate(${translateX - 24}px, ${translateY - 24}px)`,
      }}
    >
      <button
        type="button"
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        data-testid={`warfare-token-${territory.id}`}
        className={`pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border-2 text-sm font-bold shadow-lg transition ${
          disabled
            ? 'cursor-not-allowed border-slate-600 bg-slate-800/80 text-slate-300'
            : isDragging
            ? 'cursor-grabbing border-yellow-400 bg-yellow-500/30 text-yellow-100'
            : isActive
            ? 'border-cyan-300 bg-cyan-500/30 text-cyan-100'
            : 'border-cyan-500/70 bg-cyan-500/20 text-cyan-50'
        }`}
        aria-label={`${territory.name} armies ${territory.armies}`}
      >
        {territory.armies}
      </button>
      {isPlayerOwned && availableReinforcements && availableReinforcements > 0 && onPlaceReinforcements && (
        <Button
          size="icon"
          variant="secondary"
          className="pointer-events-auto mt-1 h-6 w-6 border border-green-400/50 bg-green-500/20 text-green-200 hover:bg-green-500/30"
          onClick={() => onPlaceReinforcements(territory.id, Math.min(availableReinforcements, 3))}
        >
          +
        </Button>
      )}
      {!isPlayerOwned && territory.controllingNationId && (
        <Button
          size="sm"
          variant="outline"
          className="pointer-events-auto mt-2 h-7 border-purple-500/40 bg-purple-500/10 px-2 text-[10px] uppercase tracking-widest text-purple-100 hover:bg-purple-500/20"
          onClick={() => onProxyEngagement(territory.id, territory.controllingNationId!)}
        >
          Proxy Ops
        </Button>
      )}
      {projectorUnavailable && (
        <div className="mt-1 rounded bg-yellow-500/20 px-2 py-1 text-[10px] text-yellow-200">
          Projection offline
        </div>
      )}
      {isNeighborHighlight && !isPlayerOwned && (
        <div className="mt-1 text-[10px] text-red-200">Attack drop zone</div>
      )}
    </div>
  );
}

export function MapBasedWarfare({
  territories,
  playerId,
  projector,
  onAttack,
  onMove,
  onProxyEngagement,
  availableReinforcements,
  onPlaceReinforcements,
  onHoverChange,
  onSelectionChange,
  onDragStateChange,
  className,
}: MapBasedWarfareProps) {
  const territoryMap = useMemo(() => {
    const map = new Map<string, TerritoryState>();
    territories.forEach(territory => {
      map.set(territory.id, territory);
    });
    return map;
  }, [territories]);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const node = rootRef.current;
    if (!node) {
      return;
    }

    const updateSize = () => {
      const next = { width: node.clientWidth, height: node.clientHeight };
      setContainerSize(prev =>
        prev.width === next.width && prev.height === next.height ? prev : next,
      );
    };

    updateSize();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => {
      updateSize();
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  const projectedPositions = useMemo(() => {
    const map = new Map<string, ProjectedPoint>();
    const total = territories.length;
    const columns = Math.max(1, Math.ceil(Math.sqrt(total || 1)));
    const rows = Math.max(1, Math.ceil(total / columns));
    let projectorFailed = false;

    territories.forEach((territory, index) => {
      let point: ProjectedPoint | null = null;

      if (projector) {
        try {
          const projected = projector(territory.anchorLon, territory.anchorLat);
          if (
            projected &&
            typeof projected.x === 'number' &&
            Number.isFinite(projected.x) &&
            typeof projected.y === 'number' &&
            Number.isFinite(projected.y)
          ) {
            point = projected;
          } else {
            projectorFailed = true;
          }
        } catch (error) {
          projectorFailed = true;
        }
      }

      if (!point) {
        if (containerSize.width > 0 && containerSize.height > 0) {
          const col = index % columns;
          const row = Math.floor(index / columns);
          point = {
            x: ((col + 0.5) / columns) * containerSize.width,
            y: ((row + 0.5) / rows) * containerSize.height,
            visible: true,
          };
        } else {
          point = { x: 0, y: 0, visible: false };
        }
      }

      map.set(territory.id, point);
    });

    return { map, projectorFailed };
  }, [containerSize.height, containerSize.width, projector, territories]);

  const [activeDrag, setActiveDrag] = useState<DragPreview | null>(null);
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null);
  const [activeTargetId, setActiveTargetId] = useState<string | null>(null);
  const [projectorOffline, setProjectorOffline] = useState(false);

  useEffect(() => {
    setProjectorOffline(projectedPositions.projectorFailed);
  }, [projectedPositions.projectorFailed]);

  const keyboardCycleRef = useRef<Map<string, number>>(new Map());

  const keyboardCoordinateGetter = useCallback<KeyboardCoordinateGetter>(
    (event, { currentCoordinates, context }) => {
      const activeId = context?.active?.id;
      if (!activeId) {
        return currentCoordinates;
      }

      const sourceId = String(activeId);

      if (event.code === 'Escape' || event.code === 'Space') {
        keyboardCycleRef.current.delete(sourceId);
        return currentCoordinates;
      }

      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
        return currentCoordinates;
      }

      event.preventDefault();

      const neighbors = territoryMap.get(sourceId)?.neighbors ?? [];
      if (neighbors.length === 0) {
        return currentCoordinates;
      }

      const cycleIndex = keyboardCycleRef.current.get(sourceId) ?? -1;
      const nextIndex = (cycleIndex + 1) % neighbors.length;
      keyboardCycleRef.current.set(sourceId, nextIndex);
      const targetId = neighbors[nextIndex];
      const point = projectedPositions.map.get(targetId);
      if (!point || !point.visible) {
        return currentCoordinates;
      }

      return {
        x: point.x,
        y: point.y,
      };
    },
    [projectedPositions.map, territoryMap],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: keyboardCoordinateGetter ?? keyboardCoordinates,
    }),
  );

  const computeArmiesToSend = useCallback(
    (territory: TerritoryState) => {
      const available = Math.max(0, territory.armies - 1);
      if (available <= 0) {
        return 0;
      }
      return available;
    },
    [],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const sourceId = event.active.id as string;
      const sourceTerritory = territoryMap.get(sourceId);
      if (!sourceTerritory) {
        return;
      }
      const armies = computeArmiesToSend(sourceTerritory);
      setActiveSourceId(sourceId);
      setActiveDrag({
        sourceId,
        armies,
        name: sourceTerritory.name,
      });
      onSelectionChange?.(sourceId);
      onDragStateChange?.({ sourceId, targetId: null, armies });
    },
    [computeArmiesToSend, onDragStateChange, onSelectionChange, territoryMap],
  );

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      const overId = (event.over?.id as string) ?? null;
      setActiveTargetId(overId);
      onHoverChange?.(overId);
      if (activeSourceId) {
        onDragStateChange?.({ sourceId: activeSourceId, targetId: overId, armies: activeDrag?.armies ?? 0 });
      }
    },
    [activeDrag?.armies, activeSourceId, onDragStateChange, onHoverChange],
  );

  const finalizeInteraction = useCallback(() => {
    setActiveDrag(null);
    setActiveSourceId(null);
    setActiveTargetId(null);
    onHoverChange?.(null);
    onSelectionChange?.(null);
    onDragStateChange?.({ sourceId: null, targetId: null, armies: 0 });
  }, [onDragStateChange, onHoverChange, onSelectionChange]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const sourceId = event.active.id as string;
      const targetId = (event.over?.id as string) ?? null;
      if (!targetId || targetId === sourceId) {
        finalizeInteraction();
        return;
      }
      const source = territoryMap.get(sourceId);
      const target = territoryMap.get(targetId);
      if (!source || !target) {
        finalizeInteraction();
        return;
      }
      if (!source.neighbors.includes(target.id)) {
        finalizeInteraction();
        return;
      }
      const armies = computeArmiesToSend(source);
      if (armies <= 0) {
        finalizeInteraction();
        return;
      }
      if (target.controllingNationId === playerId) {
        onMove(source.id, target.id, armies);
      } else {
        onAttack(source.id, target.id, armies);
      }
      finalizeInteraction();
    },
    [computeArmiesToSend, finalizeInteraction, onAttack, onMove, playerId, territoryMap],
  );

  const handleDragCancel = useCallback(() => {
    finalizeInteraction();
  }, [finalizeInteraction]);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div ref={rootRef} className={`pointer-events-none absolute inset-0 ${className ?? ''}`}>
        {territories.map(territory => {
          const position = projectedPositions.map.get(territory.id) ?? { x: 0, y: 0, visible: false };
          return (
            <TerritoryDropZone
              key={`drop-${territory.id}`}
              territory={territory}
              position={position}
              isActive={activeTargetId === territory.id}
              isNeighbor={
                !!activeSourceId &&
                territoryMap.get(activeSourceId)?.neighbors.includes(territory.id) === true
              }
            />
          );
        })}

        {territories.map(territory => {
          const position = projectedPositions.map.get(territory.id) ?? { x: 0, y: 0, visible: false };
          const isPlayerOwned = territory.controllingNationId === playerId;
          const armiesToSend = computeArmiesToSend(territory);
          const isSource = activeSourceId === territory.id;
          const isNeighborHighlight = !!activeSourceId &&
            territoryMap.get(activeSourceId)?.neighbors.includes(territory.id) === true;

          return (
            <TerritoryMarker
              key={`marker-${territory.id}`}
              territory={territory}
              isPlayerOwned={isPlayerOwned}
              position={position}
              armiesToSend={armiesToSend}
              isActive={isSource}
              isNeighborHighlight={isNeighborHighlight && !isSource}
              projectorUnavailable={projectorOffline}
              availableReinforcements={availableReinforcements}
              onPlaceReinforcements={onPlaceReinforcements}
              onProxyEngagement={onProxyEngagement}
            />
          );
        })}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeDrag ? (
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-cyan-300 bg-cyan-500/20 text-sm font-semibold text-cyan-100 shadow-lg">
            {activeDrag.armies}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default MapBasedWarfare;
