import { useMemo, useState } from 'react';
import { TerritoryState } from '@/hooks/useConventionalWarfare';
import { Users, Swords, ArrowRight, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RiskStyleMapProps {
  territories: TerritoryState[];
  playerId: string;
  selectedTerritoryId: string | null;
  onSelectTerritory: (territoryId: string) => void;
  onAttack?: (targetId: string) => void;
  onMove?: (targetId: string) => void;
  showActions?: boolean;
}

interface TerritoryPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Positions for each territory on the Risk-style map (in grid units)
const TERRITORY_POSITIONS: Record<string, TerritoryPosition> = {
  north_america: { x: 100, y: 120, width: 180, height: 140 },
  atlantic_corridor: { x: 320, y: 150, width: 140, height: 100 },
  western_europe: { x: 500, y: 140, width: 120, height: 100 },
  eastern_europe: { x: 650, y: 130, width: 140, height: 110 },
  russia: { x: 820, y: 110, width: 200, height: 150 },
  middle_east: { x: 680, y: 280, width: 140, height: 100 },
  central_asia: { x: 850, y: 240, width: 150, height: 120 },
  east_asia: { x: 1050, y: 160, width: 160, height: 140 },
  southeast_asia: { x: 1080, y: 340, width: 140, height: 100 },
  indian_ocean: { x: 880, y: 400, width: 160, height: 100 },
  africa: { x: 600, y: 420, width: 200, height: 160 },
  south_america: { x: 280, y: 380, width: 140, height: 180 },
  pacific_ocean: { x: 1260, y: 240, width: 160, height: 200 },
  arctic_circle: { x: 500, y: 40, width: 400, height: 60 },
  antarctic: { x: 400, y: 620, width: 500, height: 60 },
};

export function RiskStyleMap({
  territories,
  playerId,
  selectedTerritoryId,
  onSelectTerritory,
  onAttack,
  onMove,
  showActions = true,
}: RiskStyleMapProps) {
  const [hoveredTerritory, setHoveredTerritory] = useState<string | null>(null);

  const territoryMap = useMemo(() => {
    const map = new Map<string, TerritoryState>();
    territories.forEach(t => map.set(t.id, t));
    return map;
  }, [territories]);

  const selectedTerritory = selectedTerritoryId ? territoryMap.get(selectedTerritoryId) : null;

  const isNeighbor = (territoryId: string) => {
    return selectedTerritory?.neighbors.includes(territoryId) ?? false;
  };

  const getTerritoryColor = (territory: TerritoryState) => {
    const isSelected = territory.id === selectedTerritoryId;
    const isHovered = territory.id === hoveredTerritory;
    const isPlayerOwned = territory.controllingNationId === playerId;
    const isTargetable = selectedTerritory && isNeighbor(territory.id);

    if (isSelected) return 'fill-yellow-500/40 stroke-yellow-400';
    if (isTargetable && !isPlayerOwned) return 'fill-red-500/30 stroke-red-400 cursor-pointer animate-pulse';
    if (isTargetable && isPlayerOwned) return 'fill-cyan-500/30 stroke-cyan-400 cursor-pointer';
    if (isHovered) return isPlayerOwned ? 'fill-cyan-500/40 stroke-cyan-300' : 'fill-red-500/40 stroke-red-300';
    if (isPlayerOwned) return 'fill-cyan-500/20 stroke-cyan-500';
    if (territory.controllingNationId) return 'fill-red-500/20 stroke-red-500';
    return 'fill-gray-500/20 stroke-gray-500';
  };

  const handleTerritoryClick = (territory: TerritoryState) => {
    if (selectedTerritory && isNeighbor(territory.id)) {
      // Clicking a neighbor - trigger action
      if (territory.controllingNationId !== playerId && onAttack) {
        onAttack(territory.id);
      } else if (territory.controllingNationId === playerId && onMove) {
        onMove(territory.id);
      }
    } else {
      // Select this territory
      onSelectTerritory(territory.id);
    }
  };

  // Draw connection lines between neighbors
  const connectionLines = useMemo(() => {
    const lines: Array<{ from: TerritoryPosition; to: TerritoryPosition; key: string }> = [];
    territories.forEach(territory => {
      const fromPos = TERRITORY_POSITIONS[territory.id];
      if (!fromPos) return;

      territory.neighbors.forEach(neighborId => {
        const toPos = TERRITORY_POSITIONS[neighborId];
        if (!toPos) return;

        // Avoid duplicate lines
        const key = [territory.id, neighborId].sort().join('-');
        if (!lines.some(l => l.key === key)) {
          lines.push({ from: fromPos, to: toPos, key });
        }
      });
    });
    return lines;
  }, [territories]);

  return (
    <div className="relative w-full h-full bg-slate-950 rounded-lg border border-cyan-500/30 overflow-auto">
      <svg
        viewBox="0 0 1500 700"
        className="w-full h-full min-h-[600px]"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgb(15, 23, 42), rgb(2, 6, 23))' }}
      >
        {/* Grid pattern */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgb(30, 41, 59)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" opacity="0.3" />

        {/* Connection lines */}
        <g className="opacity-20">
          {connectionLines.map(({ from, to, key }) => (
            <line
              key={key}
              x1={from.x + from.width / 2}
              y1={from.y + from.height / 2}
              x2={to.x + to.width / 2}
              y2={to.y + to.height / 2}
              stroke="rgb(100, 116, 139)"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          ))}
        </g>

        {/* Highlight selected territory connections */}
        {selectedTerritory && (
          <g>
            {selectedTerritory.neighbors.map(neighborId => {
              const fromPos = TERRITORY_POSITIONS[selectedTerritory.id];
              const toPos = TERRITORY_POSITIONS[neighborId];
              if (!fromPos || !toPos) return null;

              return (
                <line
                  key={neighborId}
                  x1={fromPos.x + fromPos.width / 2}
                  y1={fromPos.y + fromPos.height / 2}
                  x2={toPos.x + toPos.width / 2}
                  y2={toPos.y + toPos.height / 2}
                  stroke="rgb(250, 204, 21)"
                  strokeWidth="3"
                  opacity="0.6"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="0"
                    to="20"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </line>
              );
            })}
          </g>
        )}

        {/* Territories */}
        {territories.map(territory => {
          const pos = TERRITORY_POSITIONS[territory.id];
          if (!pos) return null;

          const isPlayerOwned = territory.controllingNationId === playerId;
          const isSelected = territory.id === selectedTerritoryId;

          return (
            <g
              key={territory.id}
              onMouseEnter={() => setHoveredTerritory(territory.id)}
              onMouseLeave={() => setHoveredTerritory(null)}
              onClick={() => handleTerritoryClick(territory)}
              className="cursor-pointer transition-all"
            >
              {/* Territory shape */}
              <rect
                x={pos.x}
                y={pos.y}
                width={pos.width}
                height={pos.height}
                rx="8"
                className={getTerritoryColor(territory)}
                strokeWidth="2"
              />

              {/* Territory name */}
              <text
                x={pos.x + pos.width / 2}
                y={pos.y + 20}
                textAnchor="middle"
                className="text-xs font-bold uppercase tracking-wider pointer-events-none"
                fill={isPlayerOwned ? 'rgb(103, 232, 249)' : territory.controllingNationId ? 'rgb(248, 113, 113)' : 'rgb(156, 163, 175)'}
              >
                {territory.name}
              </text>

              {/* Army count display - BIG and prominent like Risk pieces */}
              <g transform={`translate(${pos.x + pos.width / 2}, ${pos.y + pos.height / 2 + 10})`}>
                {/* Circle background */}
                <circle
                  r="28"
                  className={isPlayerOwned ? 'fill-cyan-500/30 stroke-cyan-400' : 'fill-red-500/30 stroke-red-400'}
                  strokeWidth="2"
                />
                
                {/* Army icon */}
                <text
                  y="-8"
                  textAnchor="middle"
                  fontSize="16"
                  className="pointer-events-none"
                >
                  👥
                </text>

                {/* Army count */}
                <text
                  y="12"
                  textAnchor="middle"
                  className="text-2xl font-bold pointer-events-none"
                  fill={isPlayerOwned ? 'rgb(224, 242, 254)' : 'rgb(254, 226, 226)'}
                >
                  {territory.armies}
                </text>
              </g>

              {/* Strategic value indicator */}
              {territory.strategicValue > 3 && (
                <text
                  x={pos.x + pos.width - 10}
                  y={pos.y + 20}
                  textAnchor="end"
                  fontSize="16"
                  className="pointer-events-none"
                >
                  ⭐
                </text>
              )}

              {/* Selected indicator */}
              {isSelected && (
                <rect
                  x={pos.x - 4}
                  y={pos.y - 4}
                  width={pos.width + 8}
                  height={pos.height + 8}
                  rx="10"
                  fill="none"
                  stroke="rgb(250, 204, 21)"
                  strokeWidth="3"
                  className="pointer-events-none"
                >
                  <animate
                    attributeName="opacity"
                    values="1;0.5;1"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </rect>
              )}
            </g>
          );
        })}

        {/* Legend */}
        <g transform="translate(20, 20)">
          <rect width="200" height="120" rx="8" fill="rgb(15, 23, 42)" fillOpacity="0.9" stroke="rgb(51, 65, 85)" strokeWidth="1" />
          <text x="10" y="20" className="text-xs font-bold fill-cyan-300">LEGEND</text>
          
          <circle cx="20" cy="40" r="8" className="fill-cyan-500/40 stroke-cyan-400" strokeWidth="1" />
          <text x="35" y="45" className="text-xs fill-gray-300">Your Territory</text>
          
          <circle cx="20" cy="60" r="8" className="fill-red-500/40 stroke-red-400" strokeWidth="1" />
          <text x="35" y="65" className="text-xs fill-gray-300">Enemy Territory</text>
          
          <circle cx="20" cy="80" r="8" className="fill-yellow-500/40 stroke-yellow-400" strokeWidth="1" />
          <text x="35" y="85" className="text-xs fill-gray-300">Selected</text>
          
          <circle cx="20" cy="100" r="8" className="fill-gray-500/40 stroke-gray-500" strokeWidth="1" />
          <text x="35" y="105" className="text-xs fill-gray-300">Neutral</text>
        </g>

        {/* Instructions */}
        {selectedTerritory && (
          <g transform="translate(1250, 20)">
            <rect width="230" height="80" rx="8" fill="rgb(15, 23, 42)" fillOpacity="0.95" stroke="rgb(250, 204, 21)" strokeWidth="2" />
            <text x="10" y="20" className="text-xs font-bold fill-yellow-300">SELECTED</text>
            <text x="10" y="40" className="text-xs fill-gray-300">{selectedTerritory.name}</text>
            <text x="10" y="55" className="text-xs fill-cyan-300">{selectedTerritory.armies} armies</text>
            <text x="10" y="70" className="text-[10px] fill-gray-400">Click neighbor to attack/move</text>
          </g>
        )}
      </svg>
    </div>
  );
}
