import { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import type { TerritoryState } from '@/hooks/useConventionalWarfare';
import { Users, Shield, Swords } from 'lucide-react';

interface TerritoryMarkersProps {
  territories: TerritoryState[];
  playerId: string | null;
  latLonToVector: (lon: number, lat: number, radius: number) => THREE.Vector3;
  earthRadius: number;
  showLabels?: boolean;
}

export function TerritoryMarkers({
  territories,
  playerId,
  latLonToVector,
  earthRadius,
  showLabels = true,
}: TerritoryMarkersProps) {
  const markerData = useMemo(() => {
    return territories
      .filter(t => t.armies > 0) // Only show territories with armies
      .map(territory => {
        const isPlayerOwned = territory.controllingNationId === playerId;
        const position = latLonToVector(
          territory.anchorLon,
          territory.anchorLat,
          earthRadius + 0.08
        );

        // Determine color based on ownership
        const color = isPlayerOwned ? '#22d3ee' : territory.controllingNationId ? '#ef4444' : '#a1a1aa';

        // Scale based on army count (more armies = bigger marker)
        const scale = Math.min(0.8 + (territory.armies / 10) * 0.4, 1.5);

        return {
          territory,
          position,
          color,
          scale,
          isPlayerOwned,
        };
      });
  }, [territories, playerId, latLonToVector, earthRadius]);

  return (
    <group>
      {markerData.map(({ territory, position, color, scale, isPlayerOwned }) => (
        <group key={territory.id} position={position.toArray() as [number, number, number]}>
          {/* 3D Marker Sphere */}
          <mesh scale={[scale, scale, scale]}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.8}
            />
          </mesh>

          {/* HTML Label with troop count */}
          {showLabels && (
            <Html
              center
              distanceFactor={8}
              style={{
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              <div
                className="flex flex-col items-center gap-0.5"
                style={{
                  transform: 'translate(-50%, -120%)',
                }}
              >
                {/* Territory name - WCAG compliant: white text on dark backgrounds */}
                <div
                  className="whitespace-nowrap rounded px-2 py-0.5 text-[10px] font-bold"
                  style={{
                    backgroundColor: isPlayerOwned
                      ? 'rgba(14, 116, 144, 0.9)'  // Dark cyan for player
                      : territory.controllingNationId
                        ? 'rgba(153, 27, 27, 0.9)' // Dark red for enemies
                        : 'rgba(63, 63, 70, 0.9)', // Dark gray for neutral
                    color: '#fff',
                    // Subtle shadow instead of shadow-lg to prevent black clump artifacts
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  {territory.name}
                </div>

                {/* Troop count badge */}
                <div
                  className="flex items-center gap-1 rounded-full px-2 py-1"
                  style={{
                    backgroundColor: isPlayerOwned
                      ? 'rgba(6, 182, 212, 0.9)'
                      : territory.controllingNationId
                        ? 'rgba(220, 38, 38, 0.9)'
                        : 'rgba(113, 113, 122, 0.9)',
                    border: `2px solid ${color}`,
                    // Subtle shadow to prevent black clump artifacts
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <Users className="h-3 w-3 text-white" />
                  <span className="text-xs font-bold text-white">
                    {territory.armies}
                  </span>
                </div>

                {/* Contested territory indicator */}
                {territory.contestedBy && territory.contestedBy.length > 0 && (
                  <div
                    className="flex items-center gap-0.5 rounded px-1.5 py-0.5 animate-pulse"
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.9)',
                      border: '1px solid rgba(248, 113, 113, 0.8)',
                    }}
                  >
                    <Swords className="h-2.5 w-2.5 text-white" />
                    <span className="text-[8px] font-bold text-white">CONTESTED</span>
                  </div>
                )}

                {/* High conflict risk indicator */}
                {territory.conflictRisk > 50 && (!territory.contestedBy || territory.contestedBy.length === 0) && (
                  <div
                    className="flex items-center gap-0.5 rounded px-1.5 py-0.5"
                    style={{
                      backgroundColor: 'rgba(251, 146, 60, 0.9)',
                      border: '1px solid rgba(253, 186, 116, 0.8)',
                    }}
                  >
                    <Swords className="h-2 w-2 text-white" />
                    <span className="text-[8px] text-white">HIGH RISK</span>
                  </div>
                )}

                {/* Unit composition indicators */}
                {(territory.unitComposition.army > 0 ||
                  territory.unitComposition.navy > 0 ||
                  territory.unitComposition.air > 0) && (
                  <div className="flex gap-1 text-[8px]">
                    {territory.unitComposition.army > 0 && (
                      <div
                        className="flex items-center gap-0.5 rounded px-1"
                        style={{
                          backgroundColor: 'rgba(34, 197, 94, 0.8)',
                        }}
                      >
                        <Shield className="h-2 w-2 text-white" />
                        <span className="text-white">{territory.unitComposition.army}</span>
                      </div>
                    )}
                    {territory.unitComposition.navy > 0 && (
                      <div
                        className="flex items-center gap-0.5 rounded px-1"
                        style={{
                          backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        }}
                      >
                        <span className="text-white">⚓{territory.unitComposition.navy}</span>
                      </div>
                    )}
                    {territory.unitComposition.air > 0 && (
                      <div
                        className="flex items-center gap-0.5 rounded px-1"
                        style={{
                          backgroundColor: 'rgba(147, 51, 234, 0.8)',
                        }}
                      >
                        <span className="text-white">✈{territory.unitComposition.air}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Html>
          )}

          {/* Glow effect for player territories */}
          {isPlayerOwned && (
            <mesh scale={[scale * 1.5, scale * 1.5, scale * 1.5]}>
              <sphereGeometry args={[0.06, 16, 16]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={0.2}
              />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}
