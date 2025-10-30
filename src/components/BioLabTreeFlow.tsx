import { useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Handle, Position, NodeProps } from 'reactflow';
import { memo } from 'react';
import { Check, Lock, Factory, ShieldAlert, Clock, Beaker, Skull } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BioLabFacility, BioLabTier, BioLabTierDefinition } from '@/types/bioLab';
import { BIO_LAB_TIERS } from '@/types/bioLab';
import { getLayoutedElements } from '@/lib/evolutionFlowLayout';

interface BioLabNodeData extends BioLabTierDefinition {
  isActive: boolean;
  canBuild: boolean;
  canAfford: boolean;
  isBuilding: boolean;
  buildProgress?: number;
  onStartConstruction: () => void;
  onCancelConstruction?: () => void;
  playerProduction: number;
  playerUranium: number;
}

const BioLabFlowNode = memo(({ data }: NodeProps<BioLabNodeData>) => {
  const isAvailable = data.canBuild && data.canAfford && !data.isActive && !data.isBuilding;
  const color = '#a855f7'; // purple for bio-warfare
  const colors = {
    border: color,
    bg: `${color}1A`,
    glow: `${color}4D`,
    text: color,
  };

  return (
    <div className="biolab-flow-node relative">
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

      {isAvailable && (
        <div
          className="absolute -inset-1 blur-md rounded-lg animate-pulse"
          style={{ background: colors.glow }}
        />
      )}

      <div
        className={`
          relative w-72 rounded-lg border-2 transition-all
          ${data.isActive
            ? 'bg-gray-900/95 shadow-lg'
            : data.isBuilding
              ? 'bg-gray-900/95 border-amber-500 shadow-lg'
              : isAvailable
                ? 'bg-gray-900/90 hover:scale-105 cursor-pointer'
                : 'bg-gray-900/70 opacity-60'
          }
        `}
        style={{
          borderColor: data.isActive
            ? colors.border
            : data.isBuilding
              ? '#f59e0b'
              : isAvailable
                ? colors.border
                : 'rgba(75, 85, 99, 0.3)',
          boxShadow: data.isActive
            ? `0 0 20px ${colors.glow}`
            : data.isBuilding
              ? '0 0 20px rgba(245, 158, 11, 0.5)'
              : isAvailable
                ? `0 0 10px ${colors.glow}`
                : 'none',
        }}
      >
        <div
          className="px-3 py-2 border-b flex items-center justify-between"
          style={{
            borderColor: colors.border + '40',
            background: colors.bg,
          }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {data.tier >= 3 ? (
              <Skull className="h-4 w-4 flex-shrink-0" style={{ color: colors.text }} />
            ) : (
              <Beaker className="h-4 w-4 flex-shrink-0" style={{ color: colors.text }} />
            )}
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                  TIER {data.tier}
                </span>
              </div>
              <h4
                className="text-xs font-bold uppercase tracking-wider truncate"
                style={{ color: colors.text }}
                title={data.name}
              >
                {data.name}
              </h4>
            </div>
          </div>

          <div className="ml-2 flex-shrink-0">
            {data.isActive ? (
              <Check className="h-4 w-4 text-green-400" />
            ) : data.isBuilding ? (
              <Clock className="h-4 w-4 text-amber-400 animate-spin" />
            ) : !data.canBuild ? (
              <Lock className="h-4 w-4 text-gray-500" />
            ) : null}
          </div>
        </div>

        <div className="p-3 space-y-2">
          <p className="text-[10px] text-gray-300 leading-relaxed line-clamp-2">
            {data.description}
          </p>

          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-400 uppercase">Construction Time</span>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-cyan-400" />
              <span className="text-cyan-300 font-bold tabular-nums">
                {data.constructionTurns} {data.constructionTurns === 1 ? 'turn' : 'turns'}
              </span>
            </div>
          </div>

          {data.isBuilding && data.buildProgress !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[9px]">
                <span className="text-amber-300">Constructing...</span>
                <span className="text-amber-200">
                  {Math.round((data.buildProgress / data.constructionTurns) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded h-1.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                  style={{ width: `${(data.buildProgress / data.constructionTurns) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-gray-400 uppercase">Cost</span>
            <div className="flex flex-wrap gap-1.5">
              {data.productionCost > 0 && (
                <div
                  className={`text-[9px] px-2 py-0.5 rounded border ${
                    data.playerProduction >= data.productionCost
                      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                      : 'border-red-500/40 bg-red-500/15 text-red-300'
                  }`}
                >
                  <Factory className="inline h-2.5 w-2.5 mr-1" />
                  {data.productionCost}
                </div>
              )}
              {data.uraniumCost > 0 && (
                <div
                  className={`text-[9px] px-2 py-0.5 rounded border ${
                    data.playerUranium >= data.uraniumCost
                      ? 'border-green-500/40 bg-green-500/15 text-green-300'
                      : 'border-red-500/40 bg-red-500/15 text-red-300'
                  }`}
                >
                  <ShieldAlert className="inline h-2.5 w-2.5 mr-1" />
                  {data.uraniumCost} U
                </div>
              )}
            </div>
          </div>

          {/* Unlocks */}
          {data.unlocks.length > 0 && (
            <div className="space-y-1">
              <span className="text-[9px] text-gray-400 uppercase">Unlocks</span>
              <ul className="text-[9px] text-purple-300 space-y-0.5">
                {data.unlocks.slice(0, 3).map((unlock, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-purple-500 flex-shrink-0">•</span>
                    <span className="line-clamp-1">{unlock}</span>
                  </li>
                ))}
                {data.unlocks.length > 3 && (
                  <li className="text-purple-400/70 italic">+{data.unlocks.length - 3} more...</li>
                )}
              </ul>
            </div>
          )}

          {data.isActive ? (
            <div className="w-full h-7 flex items-center justify-center text-[10px] border border-green-500/30 text-green-300 bg-green-500/10 rounded">
              <Check className="h-3 w-3 mr-1" />
              ACTIVE
            </div>
          ) : data.isBuilding ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={data.onCancelConstruction}
              className="w-full h-7 text-[10px] border border-amber-500/50 text-amber-300 hover:bg-amber-500/20"
            >
              Cancel Construction
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={data.onStartConstruction}
              disabled={!isAvailable}
              className="w-full h-7 text-[10px] font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: isAvailable
                  ? 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)'
                  : undefined,
                color: isAvailable ? '#000' : undefined,
              }}
            >
              {!data.canBuild
                ? 'LOCKED'
                : !data.canAfford
                  ? 'INSUFFICIENT RESOURCES'
                  : 'START CONSTRUCTION'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

BioLabFlowNode.displayName = 'BioLabFlowNode';

const nodeTypes = {
  biolabNode: BioLabFlowNode,
};

interface BioLabTreeFlowProps {
  facility: BioLabFacility;
  playerProduction: number;
  playerUranium: number;
  onStartConstruction: (tier: BioLabTier) => void;
  onCancelConstruction?: () => void;
}

export function BioLabTreeFlow({
  facility,
  playerProduction,
  playerUranium,
  onStartConstruction,
  onCancelConstruction,
}: BioLabTreeFlowProps) {
  // Create nodes for each tier (excluding tier 0)
  const flowNodes = useMemo(() => {
    const nodes: Node[] = [];

    for (let tier = 1; tier <= 4; tier++) {
      const tierDef = BIO_LAB_TIERS[tier];
      const isActive = facility.tier >= tier && !facility.underConstruction;
      const isBuilding = facility.underConstruction && facility.targetTier === tier;
      const canBuild = facility.tier === tier - 1 && !facility.underConstruction;
      const canAfford =
        playerProduction >= tierDef.productionCost &&
        playerUranium >= tierDef.uraniumCost;

      nodes.push({
        id: `biolab_tier_${tier}`,
        type: 'biolabNode',
        position: { x: 0, y: 0 },
        data: {
          ...tierDef,
          isActive,
          canBuild,
          canAfford,
          isBuilding,
          buildProgress: isBuilding ? facility.constructionProgress : undefined,
          onStartConstruction: () => onStartConstruction(tier as BioLabTier),
          onCancelConstruction,
          playerProduction,
          playerUranium,
        },
      });
    }

    return nodes;
  }, [facility, playerProduction, playerUranium, onStartConstruction, onCancelConstruction]);

  // Create edges - linear progression
  const flowEdges = useMemo(() => {
    const edges: Edge[] = [];
    const color = '#a855f7';

    for (let tier = 2; tier <= 4; tier++) {
      const source = `biolab_tier_${tier - 1}`;
      const target = `biolab_tier_${tier}`;
      const sourceActive = facility.tier >= tier - 1;
      const targetActive = facility.tier >= tier;
      const targetIsBuilding = facility.underConstruction && facility.targetTier === tier;

      edges.push({
        id: `${source}-${target}`,
        source,
        target,
        type: ConnectionLineType.SmoothStep,
        animated: sourceActive && !targetActive && !targetIsBuilding,
        style: {
          stroke: targetActive || targetIsBuilding ? color : sourceActive ? color + 'AA' : color + '40',
          strokeWidth: targetActive || targetIsBuilding ? 3 : sourceActive ? 2 : 1,
        },
        markerEnd: {
          type: 'arrowclosed',
          color: targetActive || targetIsBuilding ? color : sourceActive ? color + 'AA' : color + '40',
        },
      });
    }

    return edges;
  }, [facility]);

  // Apply layout
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(flowNodes, flowEdges, 'LR'),
    [flowNodes, flowEdges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  useMemo(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

  const color = '#a855f7';

  return (
    <div className="w-full">
      <div className="mb-2">
        <h3 className="text-lg font-bold uppercase tracking-wider text-purple-400">
          BIO-LAB INFRASTRUCTURE
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          Upgrade your bio-warfare capabilities through advanced research facilities
        </p>
      </div>
      <div className="w-full h-[600px] border border-purple-500/30 rounded-lg overflow-hidden bg-gray-950/50">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          connectionLineType={ConnectionLineType.SmoothStep}
          fitView
          fitViewOptions={{
            padding: 0.2,
            minZoom: 0.5,
            maxZoom: 1.5,
          }}
          minZoom={0.3}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color={color + '20'} gap={20} size={1} className="bg-gray-950" />
          <Controls
            className="bg-gray-900 border-purple-500/50"
            style={{
              button: {
                backgroundColor: '#1f2937',
                color: '#a855f7',
                borderColor: '#a855f7',
              },
            }}
          />
          <MiniMap
            nodeColor={(node) => {
              if (node.data.isActive) return color;
              if (node.data.isBuilding) return '#f59e0b';
              if (node.data.canBuild && node.data.canAfford) return color + '88';
              return '#4b5563';
            }}
            maskColor="rgba(0, 0, 0, 0.8)"
            className="bg-gray-900 border border-purple-500/50"
          />
          <Panel position="top-right" className="bg-gray-900/90 p-2 rounded border border-purple-500/30">
            <div className="text-[10px] text-purple-300 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded border-2 border-purple-500 bg-purple-500/40" />
                <span>Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded border-2 border-amber-500 bg-amber-500/40" />
                <span>Constructing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded border-2 border-gray-500 bg-gray-700" />
                <span>Locked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded border-2 border-purple-500 animate-pulse" />
                <span>Available</span>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}
