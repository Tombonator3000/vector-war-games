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

      {/* Compact card - click to see details */}
      <div
        className={`
          relative w-36 rounded border-2 transition-all cursor-pointer
          ${data.researched
            ? 'bg-gray-900/95 opacity-75'
            : data.isResearching
              ? 'bg-gray-900/95 border-amber-500'
              : isAvailable
                ? 'bg-gray-900/90 hover:scale-105'
                : 'bg-gray-900/60 opacity-50'
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
        }}
        onClick={data.onStartResearch}
        title="Click for details"
      >
        {/* Compact header */}
        <div
          className="px-2 py-1.5 border-b flex items-center justify-between"
          style={{
            borderColor: colors.border + '40',
            background: colors.bg,
          }}
        >
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <Icon className="h-3 w-3 flex-shrink-0" style={{ color: colors.text }} />
            <h4
              className="text-[10px] font-bold truncate"
              style={{ color: colors.text }}
              title={data.name}
            >
              {data.name}
            </h4>
          </div>

          {/* Status Icon */}
          <div className="ml-1 flex-shrink-0">
            {data.researched ? (
              <Check className="h-3 w-3 text-green-400" />
            ) : data.isResearching ? (
              <Clock className="h-3 w-3 text-amber-400" />
            ) : !data.canResearch ? (
              <Lock className="h-3 w-3 text-gray-500" />
            ) : null}
          </div>
        </div>

        {/* Compact body - just turns */}
        <div className="px-2 py-1.5 text-center">
          <div className="text-[9px] text-gray-400">{data.turns}T</div>
          
          {/* Progress bar if researching */}
          {data.isResearching && data.researchProgress !== undefined && (
            <div className="mt-1 w-full bg-gray-700 rounded-full h-1 overflow-hidden">
              <div
                className="h-full bg-amber-500"
                style={{ width: `${(data.researchProgress / data.turns) * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ResearchFlowNode.displayName = 'ResearchFlowNode';
