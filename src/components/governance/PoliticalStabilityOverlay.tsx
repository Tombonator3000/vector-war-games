import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';

interface PoliticalStabilityOverlayProps {
  nations: Array<{
    id: string;
    name: string;
    lon: number;
    lat: number;
    morale: number;
    publicOpinion: number;
    instability: number;
  }>;
  canvasWidth: number;
  canvasHeight: number;
  visible: boolean;
}

export function PoliticalStabilityOverlay({ 
  nations, 
  canvasWidth, 
  canvasHeight,
  visible 
}: PoliticalStabilityOverlayProps) {
  const overlayData = useMemo(() => {
    return nations.map(nation => {
      const x = ((nation.lon + 180) / 360) * canvasWidth;
      const y = ((90 - nation.lat) / 180) * canvasHeight;
      
      const stability = (nation.morale + nation.publicOpinion) / 2;
      const isCrisis = stability < 35 || nation.instability > 75;
      const isUnstable = stability < 55 || nation.instability > 55;
      
      return {
        id: nation.id,
        name: nation.name,
        x,
        y,
        stability,
        isCrisis,
        isUnstable,
        color: getStabilityColor(stability, nation.instability)
      };
    });
  }, [nations, canvasWidth, canvasHeight]);

  if (!visible) return null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={canvasWidth}
      height={canvasHeight}
      style={{ zIndex: 15 }}
    >
      {/* Heat map circles */}
      {overlayData.map(data => (
        <g key={data.id}>
          {/* Outer glow */}
          <circle
            cx={data.x}
            cy={data.y}
            r={60}
            fill={data.color}
            opacity={0.15}
            className="animate-pulse"
          />
          {/* Middle ring */}
          <circle
            cx={data.x}
            cy={data.y}
            r={40}
            fill={data.color}
            opacity={0.25}
          />
          {/* Inner core */}
          <circle
            cx={data.x}
            cy={data.y}
            r={20}
            fill={data.color}
            opacity={0.4}
            stroke={data.color}
            strokeWidth={2}
            strokeOpacity={0.6}
          />
          
          {/* Crisis marker */}
          {data.isCrisis && (
            <g transform={`translate(${data.x},${data.y - 30})`}>
              <circle
                r={12}
                fill="rgb(239, 68, 68)"
                opacity={0.8}
                className="animate-pulse"
              />
              <text
                x={0}
                y={4}
                textAnchor="middle"
                className="text-[10px] fill-white font-bold pointer-events-auto"
                style={{ fontSize: '10px' }}
              >
                ⚠
              </text>
            </g>
          )}
        </g>
      ))}

      {/* Legend */}
      <g transform={`translate(${canvasWidth - 180}, 20)`}>
        <rect
          x={0}
          y={0}
          width={160}
          height={90}
          fill="rgb(15, 23, 42)"
          fillOpacity={0.9}
          stroke="rgb(34, 211, 238)"
          strokeOpacity={0.3}
          rx={4}
        />
        <text
          x={10}
          y={20}
          className="text-xs fill-cyan-300 font-semibold"
          style={{ fontSize: '12px' }}
        >
          Political Stability
        </text>
        
        <LegendItem x={10} y={35} color="rgb(34, 197, 94)" label="Stable (70%+)" />
        <LegendItem x={10} y={55} color="rgb(234, 179, 8)" label="Unstable (40-70%)" />
        <LegendItem x={10} y={75} color="rgb(239, 68, 68)" label="Crisis (&lt;40%)" />
      </g>
    </svg>
  );
}

interface LegendItemProps {
  x: number;
  y: number;
  color: string;
  label: string;
}

function LegendItem({ x, y, color, label }: LegendItemProps) {
  return (
    <g>
      <circle cx={x + 5} cy={y} r={5} fill={color} opacity={0.7} />
      <text
        x={x + 15}
        y={y + 4}
        className="text-xs fill-cyan-200"
        style={{ fontSize: '10px' }}
      >
        {label}
      </text>
    </g>
  );
}

function getStabilityColor(stability: number, instability: number): string {
  if (stability < 35 || instability > 75) {
    return 'rgb(239, 68, 68)'; // Red for crisis
  } else if (stability < 55 || instability > 55) {
    return 'rgb(234, 179, 8)'; // Yellow for unstable
  } else {
    return 'rgb(34, 197, 94)'; // Green for stable
  }
}
