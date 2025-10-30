import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Check, Lock, Zap, Factory, Brain, ShieldAlert, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
}

const CATEGORY_ICONS: Record<ResearchCategory, any> = {
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

  // Format cost display
  const costParts: string[] = [];
  if (data.cost.production) costParts.push(`${data.cost.production} Prod`);
  if (data.cost.intel) costParts.push(`${data.cost.intel} Intel`);
  if (data.cost.uranium) costParts.push(`${data.cost.uranium} U`);
  const costText = costParts.join(' • ');

  return (
    <div className="research-flow-node relative">
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: colors.border,
          width: 8,
          height: 8,
          border: '2px solid rgba(0, 0, 0, 0.8)',
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: colors.border,
          width: 8,
          height: 8,
          border: '2px solid rgba(0, 0, 0, 0.8)',
        }}
      />

      {/* Glow effect when available */}
      {isAvailable && (
        <div
          className="absolute -inset-1 blur-md rounded-lg animate-pulse"
          style={{ background: colors.glow }}
        />
      )}

      {/* Main card */}
      <div
        className={`
          relative w-64 rounded-lg border-2 transition-all
          ${data.researched
            ? 'bg-gray-900/95 shadow-lg'
            : data.isResearching
              ? 'bg-gray-900/95 border-amber-500 shadow-lg'
              : isAvailable
                ? 'bg-gray-900/90 hover:scale-105 cursor-pointer'
                : 'bg-gray-900/70 opacity-60'
          }
        `}
        style={{
          borderColor: data.researched
            ? colors.border
            : data.isResearching
              ? '#f59e0b'
              : isAvailable
                ? colors.border
                : 'rgba(75, 85, 99, 0.3)',
          boxShadow: data.researched
            ? `0 0 20px ${colors.glow}`
            : data.isResearching
              ? '0 0 20px rgba(245, 158, 11, 0.5)'
              : isAvailable
                ? `0 0 10px ${colors.glow}`
                : 'none',
        }}
      >
        {/* Header */}
        <div
          className="px-3 py-2 border-b flex items-center justify-between"
          style={{
            borderColor: colors.border + '40',
            background: colors.bg,
          }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Icon className="h-4 w-4 flex-shrink-0" style={{ color: colors.text }} />
            <h4
              className="text-xs font-bold uppercase tracking-wider truncate"
              style={{ color: colors.text }}
              title={data.name}
            >
              {data.name}
            </h4>
          </div>

          {/* Status Icon */}
          <div className="ml-2 flex-shrink-0">
            {data.researched ? (
              <Check className="h-4 w-4 text-green-400" />
            ) : data.isResearching ? (
              <Clock className="h-4 w-4 text-amber-400 animate-spin" />
            ) : !data.canResearch ? (
              <Lock className="h-4 w-4 text-gray-500" />
            ) : null}
          </div>
        </div>

        {/* Body */}
        <div className="p-3 space-y-2">
          {/* Description */}
          <p className="text-[10px] text-gray-300 leading-relaxed line-clamp-2">
            {data.description}
          </p>

          {/* Research Time */}
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-400 uppercase">Research Time</span>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-cyan-400" />
              <span className="text-cyan-300 font-bold tabular-nums">
                {data.turns} {data.turns === 1 ? 'turn' : 'turns'}
              </span>
            </div>
          </div>

          {/* Research Progress Bar (if currently researching) */}
          {data.isResearching && data.researchProgress !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[9px]">
                <span className="text-amber-300">Researching...</span>
                <span className="text-amber-200">
                  {Math.round((data.researchProgress / data.turns) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded h-1.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                  style={{ width: `${(data.researchProgress / data.turns) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Cost Display */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-gray-400 uppercase">Cost</span>
            <div className="flex flex-wrap gap-1.5">
              {data.cost.production && (
                <div
                  className={`text-[9px] px-2 py-0.5 rounded border ${
                    data.playerProduction >= data.cost.production
                      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                      : 'border-red-500/40 bg-red-500/15 text-red-300'
                  }`}
                >
                  <Factory className="inline h-2.5 w-2.5 mr-1" />
                  {data.cost.production}
                </div>
              )}
              {data.cost.intel && (
                <div
                  className={`text-[9px] px-2 py-0.5 rounded border ${
                    data.playerIntel >= data.cost.intel
                      ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300'
                      : 'border-red-500/40 bg-red-500/15 text-red-300'
                  }`}
                >
                  <Brain className="inline h-2.5 w-2.5 mr-1" />
                  {data.cost.intel}
                </div>
              )}
              {data.cost.uranium && (
                <div
                  className={`text-[9px] px-2 py-0.5 rounded border ${
                    data.playerUranium >= data.cost.uranium
                      ? 'border-green-500/40 bg-green-500/15 text-green-300'
                      : 'border-red-500/40 bg-red-500/15 text-red-300'
                  }`}
                >
                  <ShieldAlert className="inline h-2.5 w-2.5 mr-1" />
                  {data.cost.uranium} U
                </div>
              )}
            </div>
          </div>

          {/* Yield info (for nuclear warheads) */}
          {data.yield && (
            <div className="flex items-center gap-1 text-[9px] text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/30">
              <Zap className="h-3 w-3" />
              <span className="font-bold">{data.yield}MT Warhead</span>
            </div>
          )}

          {/* Action Button */}
          {data.researched ? (
            <div className="w-full h-7 flex items-center justify-center text-[10px] border border-green-500/30 text-green-300 bg-green-500/10 rounded">
              <Check className="h-3 w-3 mr-1" />
              RESEARCHED
            </div>
          ) : data.isResearching ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={data.onCancelResearch}
              className="w-full h-7 text-[10px] border border-amber-500/50 text-amber-300 hover:bg-amber-500/20"
            >
              Cancel Research
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={data.onStartResearch}
              disabled={!isAvailable}
              className="w-full h-7 text-[10px] font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: isAvailable
                  ? `linear-gradient(135deg, ${colors.border} 0%, ${colors.border}CC 100%)`
                  : undefined,
                color: isAvailable ? '#000' : undefined,
              }}
            >
              {!data.canResearch
                ? 'LOCKED'
                : !data.canAfford
                  ? 'INSUFFICIENT RESOURCES'
                  : 'START RESEARCH'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

ResearchFlowNode.displayName = 'ResearchFlowNode';
