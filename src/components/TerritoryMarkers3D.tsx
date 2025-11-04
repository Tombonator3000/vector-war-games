import { useMemo, useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { TerritoryState } from '@/hooks/useConventionalWarfare';
import { Users, Target } from 'lucide-react';

interface TerritoryMarkers3DProps {
  territories: TerritoryState[];
  playerId: string;
  selectedTerritoryId: string | null;
  onTerritoryClick: (territoryId: string) => void;
  earthRadius?: number;
}

const MARKER_HEIGHT = 0.08;
const SELECTED_PULSE_SCALE = 1.3;

function latLonToVector3(lon: number, lat: number, radius: number) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

interface TerritoryMarkerProps {
  territory: TerritoryState;
  isPlayerOwned: boolean;
  isSelected: boolean;
  isNeighbor: boolean;
  onTerritoryClick: (territoryId: string) => void;
  earthRadius: number;
}

function TerritoryMarker({
  territory,
  isPlayerOwned,
  isSelected,
  isNeighbor,
  onTerritoryClick,
  earthRadius,
}: TerritoryMarkerProps) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  const position = useMemo(
    () => latLonToVector3(territory.anchorLon, territory.anchorLat, earthRadius + MARKER_HEIGHT),
    [territory.anchorLon, territory.anchorLat, earthRadius]
  );

  const color = useMemo(() => {
    if (isSelected) return '#fbbf24'; // yellow
    if (isNeighbor && !isPlayerOwned) return '#ef4444'; // red - can attack
    if (isNeighbor && isPlayerOwned) return '#06b6d4'; // cyan - can move
    if (isPlayerOwned) return '#22d3ee'; // cyan
    if (territory.controllingNationId) return '#f87171'; // light red
    return '#9ca3af'; // gray - neutral
  }, [isSelected, isNeighbor, isPlayerOwned, territory.controllingNationId]);

  const scale = useMemo(() => {
    let baseScale = 1.0;
    if (territory.strategicValue > 3) baseScale = 1.2;
    if (isSelected) return baseScale * SELECTED_PULSE_SCALE;
    if (hovered) return baseScale * 1.15;
    return baseScale;
  }, [territory.strategicValue, isSelected, hovered]);

  const emissiveIntensity = useMemo(() => {
    if (isSelected) return 1.2;
    if (isNeighbor) return 0.9;
    if (hovered) return 0.8;
    return 0.5;
  }, [isSelected, isNeighbor, hovered]);

  return (
    <group position={position.toArray() as [number, number, number]}>
      {/* Base territory marker - cylinder for land, torus for sea */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onTerritoryClick(territory.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        scale={[scale, scale, scale]}
      >
        {territory.type === 'sea' ? (
          <torusGeometry args={[0.12, 0.04, 8, 16]} />
        ) : (
          <cylinderGeometry args={[0.1, 0.12, 0.06, 16]} />
        )}
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Selection ring */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1.6, 1.6, 1.6]}>
          <ringGeometry args={[0.14, 0.18, 32]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.6} side={THREE.DoubleSide}>
            <primitive
              attach="userData"
              object={{ animate: true }}
            />
          </meshBasicMaterial>
        </mesh>
      )}

      {/* Neighbor indicator rings */}
      {isNeighbor && !isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1.4, 1.4, 1.4]}>
          <ringGeometry args={[0.12, 0.15, 32]} />
          <meshBasicMaterial
            color={isPlayerOwned ? '#06b6d4' : '#ef4444'}
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* HTML overlay for army count and info */}
      <Html
        center
        distanceFactor={15}
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <div className="flex flex-col items-center gap-1">
          {/* Army count - big and prominent like Risk pieces */}
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full border-2 shadow-lg ${
              isPlayerOwned
                ? 'border-cyan-400 bg-cyan-500/90 text-cyan-50'
                : territory.controllingNationId
                ? 'border-red-400 bg-red-500/90 text-red-50'
                : 'border-gray-400 bg-gray-600/90 text-gray-50'
            } ${isSelected ? 'ring-4 ring-yellow-400/50' : ''}`}
          >
            <span className="text-xl font-bold">{territory.armies}</span>
          </div>

          {/* Territory name */}
          <div
            className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider shadow-md ${
              isPlayerOwned
                ? 'bg-cyan-900/90 text-cyan-200'
                : territory.controllingNationId
                ? 'bg-red-900/90 text-red-200'
                : 'bg-gray-800/90 text-gray-300'
            }`}
          >
            {territory.name}
          </div>

          {/* Strategic value indicator */}
          {territory.strategicValue > 3 && (
            <div className="text-xs">⭐</div>
          )}

          {/* Hover info */}
          {hovered && (
            <div className="mt-1 rounded-md bg-slate-900/95 px-2 py-1 text-[9px] text-cyan-300 shadow-xl">
              <div>Value: {territory.strategicValue}</div>
              <div>Prod: +{territory.productionBonus}</div>
              {territory.unitComposition.army > 0 && <div>🪖 Army: {territory.unitComposition.army}</div>}
              {territory.unitComposition.navy > 0 && <div>⚓ Navy: {territory.unitComposition.navy}</div>}
              {territory.unitComposition.air > 0 && <div>✈️ Air: {territory.unitComposition.air}</div>}
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

export function TerritoryMarkers3D({
  territories,
  playerId,
  selectedTerritoryId,
  onTerritoryClick,
  earthRadius = 1.8,
}: TerritoryMarkers3DProps) {
  const selectedTerritory = useMemo(
    () => territories.find(t => t.id === selectedTerritoryId),
    [territories, selectedTerritoryId]
  );

  const isNeighbor = (territoryId: string) => {
    return selectedTerritory?.neighbors.includes(territoryId) ?? false;
  };

  return (
    <group>
      {territories.map(territory => {
        const isPlayerOwned = territory.controllingNationId === playerId;
        const isSelected = territory.id === selectedTerritoryId;
        const isNeighborTerritory = isNeighbor(territory.id);

        return (
          <TerritoryMarker
            key={territory.id}
            territory={territory}
            isPlayerOwned={isPlayerOwned}
            isSelected={isSelected}
            isNeighbor={isNeighborTerritory}
            onTerritoryClick={onTerritoryClick}
            earthRadius={earthRadius}
          />
        );
      })}
    </group>
  );
}
