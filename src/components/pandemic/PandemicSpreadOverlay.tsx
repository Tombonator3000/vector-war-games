import { useMemo } from 'react';
import { Biohazard } from 'lucide-react';
import type { MapModeOverlayData } from '@/components/GlobeScene';
import { computePandemicColor } from '@/lib/mapColorUtils';

const casualtyFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

type PandemicOverlay = NonNullable<MapModeOverlayData['pandemic']>;

interface PandemicSpreadOverlayProps {
  nations: Array<{
    id: string;
    name: string;
    lon: number;
    lat: number;
  }>;
  canvasWidth: number;
  canvasHeight: number;
  visible: boolean;
  pandemic: PandemicOverlay;
}

interface PandemicPoint {
  id: string;
  name: string;
  x: number;
  y: number;
  infection: number;
  normalized: number;
  heat: number;
  heatNormalized: number;
  casualties: number;
  color: string;
  outerRadius: number;
  middleRadius: number;
  innerRadius: number;
  progressRadius: number;
  circumference: number;
  isDetected: boolean;
}

export function PandemicSpreadOverlay({
  nations,
  canvasWidth,
  canvasHeight,
  visible,
  pandemic,
}: PandemicSpreadOverlayProps) {
  const overlayPoints = useMemo<PandemicPoint[]>(() => {
    if (!visible) return [];

    const infectionValues = Object.values(pandemic.infections ?? {})
      .filter(value => Number.isFinite(value))
      .map(value => Number(value));
    const maxInfection = infectionValues.length ? Math.max(...infectionValues, 1) : 0;

    if (maxInfection <= 0) {
      return [];
    }

    return nations
      .map(nation => {
        const infection = pandemic.infections?.[nation.id] ?? 0;
        if (infection <= 0) {
          return null;
        }

        const normalized = Math.max(0, infection) / maxInfection;
        const heat = pandemic.heat?.[nation.id] ?? infection;
        const heatNormalized = Math.min(1, Math.max(0, heat / 100));
        const casualties = pandemic.casualties?.[nation.id] ?? 0;
        const color = computePandemicColor(normalized);
        const outerRadius = 40 + normalized * 80;
        const middleRadius = outerRadius * (0.6 + normalized * 0.1);
        const innerRadius = 14 + normalized * 24;
        const progressRadius = innerRadius + 8;
        const circumference = 2 * Math.PI * progressRadius;
        const x = ((nation.lon + 180) / 360) * canvasWidth;
        const y = ((90 - nation.lat) / 180) * canvasHeight;
        const isDetected = Boolean(pandemic.detections?.[nation.id]);

        return {
          id: nation.id,
          name: nation.name,
          x,
          y,
          infection,
          normalized,
          heat,
          heatNormalized,
          casualties,
          color,
          outerRadius,
          middleRadius,
          innerRadius,
          progressRadius,
          circumference,
          isDetected,
        };
      })
      .filter((point): point is PandemicPoint => Boolean(point));
  }, [canvasWidth, canvasHeight, nations, pandemic, visible]);

  if (!visible) return null;

  const stageLabel = pandemic.stage?.toUpperCase?.() ?? 'UNKNOWN';
  const globalInfection = Math.max(0, Math.min(100, pandemic.globalInfection ?? 0));
  const vaccineProgress = Math.max(0, Math.min(100, pandemic.vaccineProgress ?? 0));
  const globalCasualties = pandemic.globalCasualties ?? 0;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={canvasWidth}
      height={canvasHeight}
      style={{ zIndex: 6 }}
    >
      {overlayPoints.map(point => {
        const animationDuration = `${Math.max(1.2, 3.2 - point.normalized * 1.5)}s`;
        const progressOffset = point.circumference * (1 - Math.min(point.normalized, 1));
        const casualtyLabel = point.casualties > 0 ? casualtyFormatter.format(point.casualties) : null;

        return (
          <g key={point.id}>
            <circle
              cx={point.x}
              cy={point.y}
              r={point.outerRadius}
              fill={point.color}
              opacity={0.18 + point.heatNormalized * 0.3}
              className="animate-ping"
              style={{ animationDuration }}
            />
            <circle
              cx={point.x}
              cy={point.y}
              r={point.middleRadius}
              fill={point.color}
              opacity={0.25 + point.heatNormalized * 0.35}
            />
            <circle
              cx={point.x}
              cy={point.y}
              r={point.innerRadius}
              fill={point.color}
              opacity={0.6}
            />
            <circle
              cx={point.x}
              cy={point.y}
              r={point.progressRadius}
              fill="none"
              stroke={point.color}
              strokeWidth={4}
              strokeOpacity={0.9}
              strokeDasharray={point.circumference}
              strokeDashoffset={progressOffset}
              strokeLinecap="round"
              transform={`rotate(-90, ${point.x}, ${point.y})`}
            />
            {point.isDetected && (
              <circle
                cx={point.x}
                cy={point.y}
                r={point.innerRadius + 12}
                fill="none"
                stroke="rgba(248, 113, 113, 0.85)"
                strokeWidth={2}
                strokeDasharray="8 4"
              />
            )}
            <text
              x={point.x}
              y={point.y - (point.innerRadius + 20)}
              textAnchor="middle"
              className="text-[11px] font-semibold fill-rose-100"
              style={{ fontSize: '11px' }}
            >
              {point.name}
            </text>
            <text
              x={point.x}
              y={point.y + point.innerRadius + 18}
              textAnchor="middle"
              className="text-[10px] font-mono fill-rose-200"
              style={{ fontSize: '10px' }}
            >
              {infectionLabel(point.infection)}
            </text>
            {casualtyLabel ? (
              <text
                x={point.x}
                y={point.y + point.innerRadius + 32}
                textAnchor="middle"
                className="text-[10px] font-mono fill-rose-300"
                style={{ fontSize: '10px' }}
              >
                {`Casualties: ${casualtyLabel}`}
              </text>
            ) : null}
            {point.isDetected ? (
              <text
                x={point.x}
                y={point.y}
                textAnchor="middle"
                className="text-[12px] font-bold fill-yellow-200"
                style={{ fontSize: '12px' }}
              >
                ☣
              </text>
            ) : null}
          </g>
        );
      })}

      <g transform={`translate(${canvasWidth - 220}, 20)`}>
        <rect
          x={0}
          y={0}
          width={200}
          height={130}
          fill="rgba(15, 23, 42, 0.92)"
          stroke="rgba(248, 113, 113, 0.45)"
          strokeWidth={1}
          rx={6}
        />
        <g transform="translate(14, 18)">
          <Biohazard className="h-4 w-4 text-rose-300" />
        </g>
        <text
          x={40}
          y={24}
          className="text-[12px] font-semibold fill-rose-200"
          style={{ fontSize: '12px' }}
        >
          Pandemic Status
        </text>
        <text
          x={16}
          y={50}
          className="text-[11px] font-mono fill-rose-100"
          style={{ fontSize: '11px' }}
        >
          {`Stage: ${stageLabel}`}
        </text>
        <text
          x={16}
          y={68}
          className="text-[11px] font-mono fill-rose-100"
          style={{ fontSize: '11px' }}
        >
          {`Global Infection: ${globalInfection.toFixed(1)}%`}
        </text>
        <text
          x={16}
          y={86}
          className="text-[11px] font-mono fill-rose-100"
          style={{ fontSize: '11px' }}
        >
          {`Casualties: ${casualtyFormatter.format(globalCasualties)}`}
        </text>
        <text
          x={16}
          y={104}
          className="text-[11px] font-mono fill-rose-100"
          style={{ fontSize: '11px' }}
        >
          {`Vaccine Progress: ${vaccineProgress.toFixed(1)}%`}
        </text>
        <g transform="translate(16, 112)">
          <circle cx={6} cy={10} r={6} fill="rgba(248, 113, 113, 0.5)" />
          <text
            x={20}
            y={14}
            className="text-[10px] fill-rose-100"
            style={{ fontSize: '10px' }}
          >
            Detected bio-weapon signature
          </text>
        </g>
      </g>
    </svg>
  );
}

function infectionLabel(value: number): string {
  if (!Number.isFinite(value)) return '0%';
  if (value >= 100) return '100%';
  if (value >= 10) return `${value.toFixed(0)}%`;
  return `${value.toFixed(1)}%`;
}

export default PandemicSpreadOverlay;
