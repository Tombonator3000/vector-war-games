import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { Globe2, Handshake, Radar, Factory, AlertTriangle } from 'lucide-react';
import type { MapMode } from '@/rendering/worldRenderer';

const MAP_MODE_ORDER: MapMode[] = ['standard', 'diplomatic', 'intel', 'resources', 'unrest'];

const MAP_MODE_ICONS: Record<MapMode, LucideIcon> = {
  standard: Globe2,
  diplomatic: Handshake,
  intel: Radar,
  resources: Factory,
  unrest: AlertTriangle,
};

const DEFAULT_DESCRIPTIONS: Record<MapMode, { label: string; description: string }> = {
  standard: {
    label: 'Standard',
    description: 'Viser klassiske nasjonsmarkører og DEFCON-gitter.',
  },
  diplomatic: {
    label: 'Diplomatisk',
    description: 'Fargekoder relasjoner basert på diplomatiske bånd.',
  },
  intel: {
    label: 'Etterretning',
    description: 'Visualiserer overvåkingsdekning og rekognoseringsnivå.',
  },
  resources: {
    label: 'Ressurser',
    description: 'Fremhever strategiske lagre og markedspress.',
  },
  unrest: {
    label: 'Uro',
    description: 'Avdekker politisk stabilitet, opinion og krisesoner.',
  },
};

const DEFAULT_HOTKEYS: Partial<Record<MapMode, string>> = {
  standard: 'Alt+1',
  diplomatic: 'Alt+2',
  intel: 'Alt+3',
  resources: 'Alt+4',
  unrest: 'Alt+5',
};

export interface MapModeBarProps {
  mode: MapMode;
  onModeChange: (mode: MapMode) => void;
  descriptions?: Record<MapMode, { label: string; description: string }>;
  hotkeys?: Partial<Record<MapMode, string>>;
  className?: string;
}

function MapModeBarComponent({
  mode,
  onModeChange,
  descriptions = DEFAULT_DESCRIPTIONS,
  hotkeys = DEFAULT_HOTKEYS,
  className,
}: MapModeBarProps) {
  return (
    <div className={cn('flex items-center gap-1.5 rounded-full bg-black/40 px-1.5 py-1 border border-cyan-500/30 pointer-events-auto', className)}>
      {MAP_MODE_ORDER.map((modeId) => {
        const Icon = MAP_MODE_ICONS[modeId];
        const isActive = mode === modeId;
        const description = descriptions[modeId] ?? DEFAULT_DESCRIPTIONS[modeId];
        const hotkey = hotkeys[modeId] ?? DEFAULT_HOTKEYS[modeId];
        const hotkeySegments = hotkey ? hotkey.split('+') : [];

        return (
          <Tooltip key={modeId} delayDuration={150}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-pressed={isActive}
                aria-label={description?.label ?? modeId}
                onClick={() => {
                  if (modeId !== mode) {
                    onModeChange(modeId);
                  }
                }}
                className={cn(
                  'h-8 w-8 rounded-full border border-cyan-500/40 bg-slate-900/80 text-cyan-200 hover:text-cyan-100 hover:bg-cyan-500/10 transition-all duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 focus-visible:ring-offset-0',
                  isActive && 'border-cyan-300 bg-cyan-500/20 text-cyan-50 shadow-[0_0_12px_rgba(34,211,238,0.65)]'
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">{description?.label ?? modeId}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-950/95 border border-cyan-500/40 text-cyan-100 max-w-xs">
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300">
                {description?.label ?? modeId}
              </div>
              {description?.description ? (
                <p className="mt-1 text-xs leading-relaxed text-cyan-100/90">
                  {description.description}
                </p>
              ) : null}
              {hotkeySegments.length ? (
                <div className="mt-2 text-[10px] font-mono text-cyan-400/80">
                  Hurtigtast:{' '}
                  {hotkeySegments.map((segment, index) => (
                    <span key={`${modeId}-${segment}-${index}`} className="inline-flex items-center">
                      <kbd className="mx-0.5 rounded border border-cyan-500/40 bg-black/60 px-1 py-0.5 text-[9px]">
                        {segment}
                      </kbd>
                      {index < hotkeySegments.length - 1 ? (
                        <span className="mx-0.5 text-cyan-500/70">+</span>
                      ) : null}
                    </span>
                  ))}
                </div>
              ) : null}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

export const MapModeBar = memo(MapModeBarComponent);
MapModeBar.displayName = 'MapModeBar';

