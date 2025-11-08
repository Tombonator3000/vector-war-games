import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import type { LucideIcon } from 'lucide-react';
import { Check, Lock, Zap, Factory, Brain, ShieldAlert, Clock, Sparkles } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ResearchNode, ResearchCategory } from '@/lib/researchData';
import { CATEGORY_COLORS } from '@/lib/researchData';

interface ResearchNodeData extends ResearchNode {
  researched: boolean;
  canResearch: boolean;
  canAfford: boolean;
  isResearching: boolean;
  researchProgress?: number;
  onStartResearch: () => void;
  onCancelResearch?: () => void;
  playerProduction: number;
  playerIntel: number;
  playerUranium: number;
  prerequisiteNames: string[];
  leadsTo: string[];
}

const CATEGORY_ICONS: Record<ResearchCategory, LucideIcon> = {
  nuclear: ShieldAlert,
  cyber: Brain,
  conventional: Factory,
  economy: Factory,
  culture: Brain,
  space: Zap,
  intelligence: Brain,
  defense: ShieldAlert,
  delivery: Zap,
};

function getCategoryColors(category: ResearchCategory) {
  const baseColor = CATEGORY_COLORS[category];
  return {
    border: baseColor,
    bg: `${baseColor}1A`, // 10% opacity
    glow: `${baseColor}4D`, // 30% opacity
    text: baseColor,
  };
}

export const ResearchFlowNode = memo(({ data }: NodeProps<ResearchNodeData>) => {
  const colors = getCategoryColors(data.category);
  const isAvailable = data.canResearch && data.canAfford && !data.researched && !data.isResearching;
  const Icon = CATEGORY_ICONS[data.category];

  const renderCostBadge = (value: number | undefined, IconComponent: LucideIcon, colorClass: string) => {
    if (!value) return null;
    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[8px] tracking-wide ${colorClass}`}
      >
        <IconComponent className="h-3 w-3" />
        {value}
      </span>
    );
  };

  return (
    <div className="research-flow-node relative">
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: colors.border,
          width: 6,
          height: 6,
          border: '2px solid rgba(0, 0, 0, 0.8)',
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: colors.border,
          width: 6,
          height: 6,
          border: '2px solid rgba(0, 0, 0, 0.8)',
        }}
      />

      {/* Compact card with tooltip */}
      <TooltipProvider delayDuration={120}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`
                relative w-44 rounded-lg border-2 transition-all cursor-pointer shadow-lg shadow-black/40
                ${data.researched
                  ? 'bg-gray-900/95 opacity-80'
                  : data.isResearching
                    ? 'bg-gray-900/95 border-amber-500'
                    : isAvailable
                      ? 'bg-gray-900/90 hover:scale-105'
                      : 'bg-gray-900/60 opacity-60'
                }
              `}
              style={{
                borderColor: data.researched
                  ? colors.border
                  : data.isResearching
                    ? '#f59e0b'
                    : isAvailable
                      ? colors.border
                      : 'rgba(75, 85, 99, 0.4)',
              }}
              onClick={data.onStartResearch}
            >
              {/* Glow ring */}
              {isAvailable && (
                <div
                  className="absolute -inset-0.5 rounded-lg blur-sm"
                  style={{ background: colors.glow }}
                />
              )}

              <div className="relative z-10">
                {/* Compact header */}
                <div
                  className="px-2 py-1.5 border-b flex items-center justify-between"
                  style={{
                    borderColor: colors.border + '40',
                    background: colors.bg,
                  }}
                >
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: colors.text }} />
                    <h4
                      className="text-[10px] font-bold uppercase tracking-wide truncate"
                      style={{ color: colors.text }}
                    >
                      {data.name}
                    </h4>
                  </div>

                  {/* Status Icon */}
                  <div className="ml-1 flex-shrink-0">
                    {data.researched ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : data.isResearching ? (
                      <Clock className="h-3 w-3 text-amber-400" />
                    ) : !data.canResearch ? (
                      <Lock className="h-3 w-3 text-gray-500" />
                    ) : null}
                  </div>
                </div>

                {/* Compact body */}
                <div className="px-2 py-2 space-y-1.5 text-center">
                  <div className="text-[10px] text-gray-300 tracking-wide">{data.turns} Turns</div>

                  <div className="flex flex-wrap items-center justify-center gap-1">
                    {renderCostBadge(
                      data.cost.production,
                      Factory,
                      data.playerProduction >= (data.cost.production || 0)
                        ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10'
                        : 'border-red-500/40 text-red-300 bg-red-500/10'
                    )}
                    {renderCostBadge(
                      data.cost.intel,
                      Brain,
                      data.playerIntel >= (data.cost.intel || 0)
                        ? 'border-cyan-500/40 text-cyan-300 bg-cyan-500/10'
                        : 'border-red-500/40 text-red-300 bg-red-500/10'
                    )}
                    {renderCostBadge(
                      data.cost.uranium,
                      ShieldAlert,
                      data.playerUranium >= (data.cost.uranium || 0)
                        ? 'border-green-500/40 text-green-300 bg-green-500/10'
                        : 'border-red-500/40 text-red-300 bg-red-500/10'
                    )}
                    {renderCostBadge(
                      data.cost.rare_earths,
                      Sparkles,
                      'border-purple-500/40 text-purple-300 bg-purple-500/10'
                    )}
                  </div>

                  {/* Progress bar if researching */}
                  {data.isResearching && data.researchProgress !== undefined && (
                    <div className="mt-1 w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
                        style={{ width: `${(data.researchProgress / data.turns) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-md bg-slate-950/95 border border-cyan-500/40 text-cyan-50 shadow-lg">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="text-sm font-semibold tracking-wide text-cyan-200 uppercase">
                  {data.name}
                </div>
                <p className="text-sm leading-relaxed text-slate-200">{data.description}</p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="font-semibold text-cyan-300 uppercase">Research Cost</div>
                <ul className="space-y-1">
                  {data.cost.production && (
                    <li className="flex items-center gap-2">
                      <Factory className="h-4 w-4 text-emerald-300" />
                      <span>{data.cost.production} Production</span>
                    </li>
                  )}
                  {data.cost.intel && (
                    <li className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-cyan-300" />
                      <span>{data.cost.intel} Intel</span>
                    </li>
                  )}
                  {data.cost.uranium && (
                    <li className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-green-300" />
                      <span>{data.cost.uranium} Uranium</span>
                    </li>
                  )}
                  {data.cost.rare_earths && (
                    <li className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-300" />
                      <span>{data.cost.rare_earths} Rare Earths</span>
                    </li>
                  )}
                  {!data.cost.production && !data.cost.intel && !data.cost.uranium && !data.cost.rare_earths && (
                    <li className="text-slate-400">No resource cost</li>
                  )}
                </ul>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="font-semibold text-cyan-300 uppercase">Prerequisites</div>
                {data.prerequisiteNames.length > 0 ? (
                  <ul className="list-disc list-inside space-y-0.5">
                    {data.prerequisiteNames.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-slate-400">None</div>
                )}
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="font-semibold text-cyan-300 uppercase">Leads To</div>
                {data.leadsTo.length > 0 ? (
                  <ul className="list-disc list-inside space-y-0.5">
                    {data.leadsTo.slice(0, 4).map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                    {data.leadsTo.length > 4 && (
                      <li className="italic text-slate-400">+{data.leadsTo.length - 4} more</li>
                    )}
                  </ul>
                ) : (
                  <div className="text-slate-400">Final technology</div>
                )}
              </div>

              {data.isResearching && data.researchProgress !== undefined && (
                <div className="text-xs text-amber-300 font-medium">
                  In progress: Turn {data.researchProgress} / {data.turns}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
});

ResearchFlowNode.displayName = 'ResearchFlowNode';
