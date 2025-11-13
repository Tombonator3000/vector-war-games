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

interface InfectionDot {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  delay: number;
}

interface PandemicPoint {
  id: string;
  name: string;
  centerX: number;
  centerY: number;
  infection: number;
  normalized: number;
  casualties: number;
  color: string;
  isDetected: boolean;
  baseRadius: number;
  glowRadius: number;
  dots: InfectionDot[];
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
        const casualties = pandemic.casualties?.[nation.id] ?? 0;
        const color = computePandemicColor(normalized);
        const centerX = ((nation.lon + 180) / 360) * canvasWidth;
        const centerY = ((90 - nation.lat) / 180) * canvasHeight;
        const isDetected = Boolean(pandemic.detections?.[nation.id]);

        // Generate infection dots based on infection level
        // More infected = more dots
        const maxDots = 200; // Maximum dots per country
        const numDots = Math.floor(normalized * maxDots);
        const spreadRadius = 30 + normalized * 50; // Area size based on infection

        const dots: InfectionDot[] = [];

        // Use deterministic random seed based on nation ID for consistency
        const seed = nation.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        let random = seed;

        // Simple seeded random number generator
        const seededRandom = () => {
          random = (random * 9301 + 49297) % 233280;
          return random / 233280;
        };

        for (let i = 0; i < numDots; i++) {
          // Random position within spread radius using polar coordinates
          const angle = seededRandom() * Math.PI * 2;
          const distance = Math.sqrt(seededRandom()) * spreadRadius;
          const dotX = centerX + Math.cos(angle) * distance;
          const dotY = centerY + Math.sin(angle) * distance;

          // Dot size varies slightly
          const dotRadius = 2 + seededRandom() * 2;

          // Color variation - from orange to deep red based on severity
          const hue = 0; // Red hue
          const saturation = 80 + normalized * 20;
          const lightness = 60 - normalized * 30; // Darker as more severe
          const dotColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

          // Stagger animation delay
          const delay = numDots ? (i / numDots) * 2 : 0;

          dots.push({
            id: `${nation.id}-dot-${i}`,
            x: dotX,
            y: dotY,
            radius: dotRadius,
            color: dotColor,
            delay,
          });
        }

        const baseRadius = 10 + normalized * 18;
        const glowRadius = baseRadius * 1.6;

        return {
          id: nation.id,
          name: nation.name,
          centerX,
          centerY,
          infection,
          normalized,
          casualties,
          color,
          isDetected,
          baseRadius,
          glowRadius,
          dots,
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
        const casualtyLabel = point.casualties > 0 ? casualtyFormatter.format(point.casualties) : null;

        return (
          <g key={point.id}>
            <circle
              cx={point.centerX}
              cy={point.centerY}
              r={point.glowRadius}
              fill={point.color}
              opacity={0.18 + point.normalized * 0.25}
              className="animate-ping"
              style={{ animationDuration: `${Math.max(1.2, 3.2 - point.normalized * 1.5)}s` }}
            />
            <circle
              cx={point.centerX}
              cy={point.centerY}
              r={point.baseRadius}
              fill={point.color}
              opacity={0.65}
            />
            {point.dots.map(dot => (
              <circle
                key={dot.id}
                cx={dot.x}
                cy={dot.y}
                r={dot.radius}
                fill={dot.color}
                className="animate-pulse"
                style={{ animationDelay: `${dot.delay}s` }}
              />
            ))}
            {point.isDetected && (
              <circle
                cx={point.centerX}
                cy={point.centerY}
                r={point.baseRadius + 12}
                fill="none"
                stroke="rgba(248, 113, 113, 0.85)"
                strokeWidth={2}
                strokeDasharray="8 4"
              />
            )}
            <text
              x={point.centerX}
              y={point.centerY - (point.baseRadius + 20)}
              textAnchor="middle"
              className="text-[11px] font-semibold fill-rose-100"
              style={{ fontSize: '11px' }}
            >
              {point.name}
            </text>
            <text
              x={point.centerX}
              y={point.centerY + point.baseRadius + 18}
              textAnchor="middle"
              className="text-[10px] font-mono fill-rose-200"
              style={{ fontSize: '10px' }}
            >
              {infectionLabel(point.infection)}
            </text>
            {casualtyLabel ? (
              <text
                x={point.centerX}
                y={point.centerY + point.baseRadius + 32}
                textAnchor="middle"
                className="text-[10px] font-mono fill-rose-300"
                style={{ fontSize: '10px' }}
              >
                {`Casualties: ${casualtyLabel}`}
              </text>
            ) : null}
            {point.isDetected ? (
              <text
                x={point.centerX}
                y={point.centerY}
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
