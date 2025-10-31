import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Check, Lock, Zap, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EvolutionNode, PlagueTypeId } from '@/types/biowarfare';
import { getPlagueTypeById } from '@/lib/evolutionData';

interface EvolutionNodeData extends EvolutionNode {
  unlocked: boolean;
  canUnlock: boolean;
  canAfford: boolean;
  actualCost: number;
  disabled: boolean;
  dnaPoints: number;
  plagueTypeId: PlagueTypeId | null;
  onEvolve: () => void;
  onDevolve: () => void;
}

const CATEGORY_COLORS = {
  transmission: {
    border: '#06b6d4', // cyan-500
    bg: 'rgba(6, 182, 212, 0.1)',
    glow: 'rgba(6, 182, 212, 0.3)',
    text: '#67e8f9', // cyan-300
  },
  symptom: {
    border: '#ef4444', // red-500
    bg: 'rgba(239, 68, 68, 0.1)',
    glow: 'rgba(239, 68, 68, 0.3)',
    text: '#fca5a5', // red-300
  },
  ability: {
    border: '#a855f7', // purple-500
    bg: 'rgba(168, 85, 247, 0.1)',
    glow: 'rgba(168, 85, 247, 0.3)',
    text: '#d8b4fe', // purple-300
  },
  defense: {
    border: '#22c55e', // emerald-500
    bg: 'rgba(34, 197, 94, 0.1)',
    glow: 'rgba(34, 197, 94, 0.3)',
    text: '#86efac', // emerald-300
  },
};

export const EvolutionFlowNode = memo(({ data }: NodeProps<EvolutionNodeData>) => {
  const colors = CATEGORY_COLORS[data.category];
  const isAvailable = data.canUnlock && data.canAfford && !data.disabled;

  return (
    <div className="evolution-flow-node relative">
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
      {isAvailable && !data.unlocked && (
        <div
          className="absolute -inset-1 blur-md rounded-lg animate-pulse"
          style={{ background: colors.glow }}
        />
      )}

      {/* Main card */}
      <div
        className={`
          relative w-56 rounded-lg border-2 transition-all
          ${data.unlocked
            ? 'bg-gray-900/95 shadow-lg'
            : isAvailable
              ? 'bg-gray-900/90 hover:scale-105 cursor-pointer'
              : 'bg-gray-900/70 opacity-60'
          }
        `}
        style={{
          borderColor: data.unlocked
            ? colors.border
            : isAvailable
              ? colors.border
              : 'rgba(75, 85, 99, 0.3)',
          boxShadow: data.unlocked
            ? `0 0 20px ${colors.glow}`
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
          <h4
            className="text-xs font-bold uppercase tracking-wider truncate flex-1"
            style={{ color: colors.text }}
          >
            {data.name}
          </h4>

          {/* Status Icon */}
          <div className="ml-2">
            {data.unlocked ? (
              <Check className="h-4 w-4 text-green-400" />
            ) : !data.canUnlock ? (
              <Lock className="h-4 w-4 text-gray-500" />
            ) : data.disabled ? (
              <Lock className="h-4 w-4 text-red-500" />
            ) : null}
          </div>
        </div>

        {/* Body */}
        <div className="p-3 space-y-2">
          {/* Cost */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 uppercase">Cost</span>
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-300 tabular-nums">
                {data.actualCost}
              </span>
            </div>
          </div>

          {/* Effects - Compact Icons */}
          {(data.effects.infectivity ||
            data.effects.severity ||
            data.effects.lethality ||
            data.effects.cureResistance ||
            data.defenseEffects) && (
            <div className="flex flex-wrap gap-1">
              {data.effects.infectivity && (
                <div
                  className="text-[9px] px-1.5 py-0.5 rounded border"
                  style={{
                    background: 'rgba(6, 182, 212, 0.15)',
                    borderColor: 'rgba(6, 182, 212, 0.4)',
                    color: '#67e8f9',
                  }}
                >
                  INF {data.effects.infectivity >= 0 ? '+' : ''}
                  {data.effects.infectivity}
                </div>
              )}
              {data.effects.severity && (
                <div
                  className="text-[9px] px-1.5 py-0.5 rounded border"
                  style={{
                    background: 'rgba(249, 115, 22, 0.15)',
                    borderColor: 'rgba(249, 115, 22, 0.4)',
                    color: '#fdba74',
                  }}
                >
                  SEV {data.effects.severity >= 0 ? '+' : ''}
                  {data.effects.severity}
                </div>
              )}
              {data.effects.lethality && (
                <div
                  className="text-[9px] px-1.5 py-0.5 rounded border"
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    borderColor: 'rgba(239, 68, 68, 0.4)',
                    color: '#fca5a5',
                  }}
                >
                  LETH {data.effects.lethality >= 0 ? '+' : ''}
                  {data.effects.lethality}
                </div>
              )}
              {data.effects.cureResistance && (
                <div
                  className="text-[9px] px-1.5 py-0.5 rounded border"
                  style={{
                    background: 'rgba(168, 85, 247, 0.15)',
                    borderColor: 'rgba(168, 85, 247, 0.4)',
                    color: '#d8b4fe',
                  }}
                >
                  CURE +{data.effects.cureResistance}
                </div>
              )}
              {data.defenseEffects?.vaccineProgress && (
                <div
                  className="text-[9px] px-1.5 py-0.5 rounded border"
                  style={{
                    background: 'rgba(34, 197, 94, 0.15)',
                    borderColor: 'rgba(34, 197, 94, 0.4)',
                    color: '#bbf7d0',
                  }}
                >
                  VAX +{data.defenseEffects.vaccineProgress}
                </div>
              )}
              {data.defenseEffects?.radiationMitigation && (
                <div
                  className="text-[9px] px-1.5 py-0.5 rounded border"
                  style={{
                    background: 'rgba(190, 242, 100, 0.15)',
                    borderColor: 'rgba(163, 230, 53, 0.4)',
                    color: '#bef264',
                  }}
                >
                  RAD -{Math.round(data.defenseEffects.radiationMitigation * 100)}%
                </div>
              )}
            </div>
          )}

          {/* Visibility Warning */}
          {data.increasesVisibility && (
            <div className="flex items-center gap-1 text-[9px] text-yellow-400/90">
              <AlertTriangle className="h-3 w-3" />
              <span>Increases visibility</span>
            </div>
          )}

          {/* Action Button */}
          {data.unlocked ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={data.onDevolve}
              className="w-full h-7 text-[10px] border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
            >
              Devolve (50%)
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={data.onEvolve}
              disabled={!isAvailable}
              className="w-full h-7 text-[10px] bg-emerald-500/80 hover:bg-emerald-400 text-black font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: isAvailable
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : undefined,
              }}
            >
              {data.disabled
                ? 'Unavailable'
                : !data.canUnlock
                  ? 'Locked'
                  : !data.canAfford
                    ? `Need ${data.actualCost - data.dnaPoints}`
                    : 'EVOLVE'}
            </Button>
          )}
        </div>

        {/* Description tooltip on hover */}
        <div className="hidden group-hover:block absolute bottom-full left-0 mb-2 w-64 p-2 bg-gray-950 border border-cyan-500/50 rounded text-[10px] text-cyan-200 z-50 shadow-2xl">
          <p className="mb-1">{data.description}</p>
          <p className="text-purple-300/70 italic text-[9px]">{data.flavor}</p>
        </div>
      </div>
    </div>
  );
});

EvolutionFlowNode.displayName = 'EvolutionFlowNode';
