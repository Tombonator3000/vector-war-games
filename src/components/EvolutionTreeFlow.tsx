import { useCallback, useMemo, useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wind, Skull, Shield, Syringe } from 'lucide-react';
import type {
  EvolutionNode,
  EvolutionCategory,
  PlagueState,
  PlagueTypeId,
} from '@/types/biowarfare';
import {
  TRANSMISSION_NODES,
  SYMPTOM_NODES,
  ABILITY_NODES,
  DEFENSE_NODES,
  getPlagueTypeById,
  canUnlockNode,
} from '@/lib/evolutionData';
import { EvolutionFlowNode } from './EvolutionFlowNode';
import { getLayoutedElements } from '@/lib/evolutionFlowLayout';

interface EvolutionTreeFlowProps {
  plagueState: PlagueState;
  onEvolve: (nodeId: string) => void;
  onDevolve: (nodeId: string) => void;
}

const nodeTypes = {
  evolutionNode: EvolutionFlowNode,
};

const CATEGORY_ICONS: Record<EvolutionCategory, any> = {
  transmission: Wind,
  symptom: Skull,
  ability: Shield,
  defense: Syringe,
};

const CATEGORY_LABELS: Record<EvolutionCategory, string> = {
  transmission: 'TRANSMISSION',
  symptom: 'SYMPTOMS',
  ability: 'ABILITIES',
  defense: 'DEFENSE',
};

const CATEGORY_COLORS = {
  transmission: '#06b6d4',
  symptom: '#ef4444',
  ability: '#a855f7',
  defense: '#22c55e',
};

/**
 * Convert evolution nodes to React Flow nodes with calculated states
 */
function createFlowNodes(
  evolutionNodes: EvolutionNode[],
  plagueState: PlagueState,
  onEvolve: (nodeId: string) => void,
  onDevolve: (nodeId: string) => void
): Node[] {
  return evolutionNodes.map((node) => {
    const unlocked = plagueState.unlockedNodes.has(node.id);
    const canUnlock = canUnlockNode(node.id, plagueState.unlockedNodes);

    // Calculate actual cost
    const plagueType = plagueState.selectedPlagueType
      ? getPlagueTypeById(plagueState.selectedPlagueType)
      : null;
    let actualCost = node.dnaCost;
    let disabled = false;

    if (plagueType && node.plagueTypeModifier) {
      const modifier = node.plagueTypeModifier[plagueType.id];
      if (modifier?.disabled) {
        disabled = true;
      }
      if (modifier?.dnaCostMultiplier) {
        actualCost = Math.ceil(actualCost * modifier.dnaCostMultiplier);
      }
    }

    if (plagueType) {
      if (node.category === 'transmission') {
        actualCost = Math.ceil(
          actualCost * plagueType.transmissionCostMultiplier
        );
      } else if (node.category === 'symptom') {
        actualCost = Math.ceil(actualCost * plagueType.symptomCostMultiplier);
      } else if (node.category === 'ability' || node.category === 'defense') {
        actualCost = Math.ceil(actualCost * plagueType.abilityCostMultiplier);
      }
    }

    const canAfford = plagueState.dnaPoints >= actualCost;

    return {
      id: node.id,
      type: 'evolutionNode',
      position: { x: 0, y: 0 }, // Will be set by layout algorithm
      data: {
        ...node,
        unlocked,
        canUnlock,
        canAfford,
        actualCost,
        disabled,
        dnaPoints: plagueState.dnaPoints,
        plagueTypeId: plagueState.selectedPlagueType,
        onEvolve: () => onEvolve(node.id),
        onDevolve: () => onDevolve(node.id),
      },
    };
  });
}

/**
 * Create edges from node prerequisites
 */
function createFlowEdges(
  evolutionNodes: EvolutionNode[],
  plagueState: PlagueState
): Edge[] {
  const edges: Edge[] = [];

  evolutionNodes.forEach((node) => {
    if (node.requires && node.requires.length > 0) {
      node.requires.forEach((reqId) => {
        const sourceUnlocked = plagueState.unlockedNodes.has(reqId);
        const targetCanUnlock = canUnlockNode(
          node.id,
          plagueState.unlockedNodes
        );
        const targetUnlocked = plagueState.unlockedNodes.has(node.id);

        const color = CATEGORY_COLORS[node.category];

        edges.push({
          id: `${reqId}-${node.id}`,
          source: reqId,
          target: node.id,
          type: ConnectionLineType.SmoothStep,
          animated: sourceUnlocked && targetCanUnlock && !targetUnlocked,
          style: {
            stroke: targetUnlocked
              ? color
              : targetCanUnlock
                ? color + 'aa'
                : color + '40',
            strokeWidth: targetUnlocked ? 3 : targetCanUnlock ? 2 : 1,
          },
          markerEnd: {
            type: 'arrowclosed',
            color: targetUnlocked
              ? color
              : targetCanUnlock
                ? color + 'aa'
                : color + '40',
          },
        });
      });
    }
  });

  return edges;
}

/**
 * Category flow panel - renders one category tree
 */
function CategoryFlowPanel({
  category,
  nodes: evolutionNodes,
  plagueState,
  onEvolve,
  onDevolve,
}: {
  category: EvolutionCategory;
  nodes: EvolutionNode[];
  plagueState: PlagueState;
  onEvolve: (nodeId: string) => void;
  onDevolve: (nodeId: string) => void;
}) {
  // Create flow nodes and edges
  const flowNodes = useMemo(
    () => createFlowNodes(evolutionNodes, plagueState, onEvolve, onDevolve),
    [evolutionNodes, plagueState, onEvolve, onDevolve]
  );

  const flowEdges = useMemo(
    () => createFlowEdges(evolutionNodes, plagueState),
    [evolutionNodes, plagueState]
  );

  // Apply automatic layout
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(flowNodes, flowEdges, 'LR'),
    [flowNodes, flowEdges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // Update nodes when plague state changes
  useMemo(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

  const categoryColor = CATEGORY_COLORS[category];

  return (
    <div className="w-full h-[600px] border border-cyan-500/30 rounded-lg overflow-hidden bg-gray-950/50">
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
        <Background
          color={categoryColor + '20'}
          gap={20}
          size={1}
          className="bg-gray-950"
        />
        <Controls
          className="bg-gray-900 border-cyan-500/50"
          style={{
            button: {
              backgroundColor: '#1f2937',
              color: '#06b6d4',
              borderColor: '#06b6d4',
            },
          }}
        />
        <MiniMap
          nodeColor={(node) => {
            if (node.data.unlocked) return categoryColor;
            if (node.data.canUnlock && node.data.canAfford)
              return categoryColor + '88';
            return '#4b5563';
          }}
          maskColor="rgba(0, 0, 0, 0.8)"
          className="bg-gray-900 border border-cyan-500/50"
        />
        <Panel position="top-right" className="bg-gray-900/90 p-2 rounded border border-cyan-500/30">
          <div className="text-[10px] text-cyan-300 space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded border-2" style={{ borderColor: categoryColor, background: categoryColor + '40' }} />
              <span>Unlocked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded border-2 border-gray-500 bg-gray-700" />
              <span>Locked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded border-2 animate-pulse" style={{ borderColor: categoryColor }} />
              <span>Available</span>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export function EvolutionTreeFlow({
  plagueState,
  onEvolve,
  onDevolve,
}: EvolutionTreeFlowProps) {
  const [activeTab, setActiveTab] = useState<EvolutionCategory>('transmission');

  return (
    <div className="w-full">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as EvolutionCategory)}
      >
        <TabsList className="grid w-full grid-cols-4 bg-black/60 border border-cyan-500/30">
          {(['transmission', 'symptom', 'ability', 'defense'] as EvolutionCategory[]).map(
            (category) => {
              const Icon = CATEGORY_ICONS[category];
              const activeCount = Array.from(plagueState.unlockedNodes).filter(
                (id) => {
                  const allNodes = [
                    ...TRANSMISSION_NODES,
                    ...SYMPTOM_NODES,
                    ...ABILITY_NODES,
                    ...DEFENSE_NODES,
                  ];
                  const node = allNodes.find((n) => n.id === id);
                  return node?.category === category;
                }
              ).length;

              const color = CATEGORY_COLORS[category];

              return (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="flex items-center gap-2 data-[state=active]:bg-cyan-500/20 data-[state=active]:border-cyan-400/60"
                >
                  <Icon className="h-4 w-4" />
                  <span className="uppercase tracking-wide text-xs">
                    {CATEGORY_LABELS[category]}
                  </span>
                  {activeCount > 0 && (
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded"
                      style={{
                        background: color + '30',
                        color: color,
                      }}
                    >
                      {activeCount}
                    </span>
                  )}
                </TabsTrigger>
              );
            }
          )}
        </TabsList>

        <TabsContent value="transmission" className="mt-4">
          <CategoryFlowPanel
            category="transmission"
            nodes={TRANSMISSION_NODES}
            plagueState={plagueState}
            onEvolve={onEvolve}
            onDevolve={onDevolve}
          />
        </TabsContent>

        <TabsContent value="symptom" className="mt-4">
          <CategoryFlowPanel
            category="symptom"
            nodes={SYMPTOM_NODES}
            plagueState={plagueState}
            onEvolve={onEvolve}
            onDevolve={onDevolve}
          />
        </TabsContent>

        <TabsContent value="ability" className="mt-4">
          <CategoryFlowPanel
            category="ability"
            nodes={ABILITY_NODES}
            plagueState={plagueState}
            onEvolve={onEvolve}
            onDevolve={onDevolve}
          />
        </TabsContent>

        <TabsContent value="defense" className="mt-4">
          <CategoryFlowPanel
            category="defense"
            nodes={DEFENSE_NODES}
            plagueState={plagueState}
            onEvolve={onEvolve}
            onDevolve={onDevolve}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
