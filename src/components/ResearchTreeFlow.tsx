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
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ShieldAlert,
  Brain,
  Factory,
  DollarSign,
  Users,
  Satellite,
  Eye,
  Shield,
  Zap,
} from 'lucide-react';
import type { Nation } from '@/types/game';
import type { ResearchNode, ResearchCategory } from '@/lib/researchData';
import {
  NUCLEAR_RESEARCH,
  CYBER_RESEARCH,
  CONVENTIONAL_RESEARCH,
  ECONOMY_RESEARCH,
  CULTURE_RESEARCH,
  SPACE_RESEARCH,
  INTELLIGENCE_RESEARCH,
  CATEGORY_COLORS,
  CATEGORY_NAMES,
  canResearch,
} from '@/lib/researchData';
import { ResearchFlowNode } from './ResearchFlowNode';
import { TechDetailsDialog } from './TechDetailsDialog';
import { getLayoutedElements } from '@/lib/evolutionFlowLayout';

interface ResearchTreeFlowProps {
  nation: Nation;
  onStartResearch: (nodeId: string) => void;
  onCancelResearch?: (nodeId: string) => void;
  currentResearch?: {
    projectId: string;
    progress: number;
  };
}

const nodeTypes = {
  researchNode: ResearchFlowNode,
};

const CATEGORY_ICONS: Record<ResearchCategory, any> = {
  nuclear: ShieldAlert,
  cyber: Brain,
  conventional: Factory,
  economy: DollarSign,
  culture: Users,
  space: Satellite,
  intelligence: Eye,
  defense: Shield,
  delivery: Zap,
};

// Map categories to their research arrays
const CATEGORY_RESEARCH_MAP: Record<ResearchCategory, ResearchNode[]> = {
  nuclear: [...NUCLEAR_RESEARCH.filter(n => n.category === 'nuclear'),
           ...NUCLEAR_RESEARCH.filter(n => n.category === 'delivery'),
           ...NUCLEAR_RESEARCH.filter(n => n.category === 'defense')],
  cyber: CYBER_RESEARCH,
  conventional: CONVENTIONAL_RESEARCH,
  economy: ECONOMY_RESEARCH,
  culture: CULTURE_RESEARCH,
  space: SPACE_RESEARCH,
  intelligence: INTELLIGENCE_RESEARCH,
  defense: [], // Combined with nuclear
  delivery: [], // Combined with nuclear
};

/**
 * Convert research nodes to React Flow nodes with calculated states
 */
function createFlowNodes(
  researchNodes: ResearchNode[],
  nation: Nation,
  currentResearch: ResearchTreeFlowProps['currentResearch'],
  onStartResearch: (nodeId: string) => void,
  onCancelResearch?: (nodeId: string) => void
): Node[] {
  const researched = new Set(Object.keys(nation.researched || {}));

  return researchNodes.map((node) => {
    const isResearched = researched.has(node.id);
    const isResearching = currentResearch?.projectId === node.id;
    const canResearchNode = canResearch(node.id, researched);
    const canAfford =
      nation.production >= (node.cost.production || 0) &&
      nation.intel >= (node.cost.intel || 0) &&
      nation.uranium >= (node.cost.uranium || 0);

    return {
      id: node.id,
      type: 'researchNode',
      position: { x: 0, y: 0 }, // Will be set by layout algorithm
      data: {
        ...node,
        researched: isResearched,
        canResearch: canResearchNode,
        canAfford,
        isResearching,
        researchProgress: isResearching ? currentResearch?.progress : undefined,
        onStartResearch: () => onStartResearch(node.id),
        onCancelResearch: onCancelResearch ? () => onCancelResearch(node.id) : undefined,
        playerProduction: nation.production,
        playerIntel: nation.intel,
        playerUranium: nation.uranium,
      },
    };
  });
}

/**
 * Create edges from node prerequisites
 */
function createFlowEdges(
  researchNodes: ResearchNode[],
  nation: Nation,
  currentResearch: ResearchTreeFlowProps['currentResearch']
): Edge[] {
  const edges: Edge[] = [];
  const researched = new Set(Object.keys(nation.researched || {}));

  researchNodes.forEach((node) => {
    if (node.prerequisites && node.prerequisites.length > 0) {
      node.prerequisites.forEach((reqId) => {
        const sourceResearched = researched.has(reqId);
        const targetCanResearch = canResearch(node.id, researched);
        const targetResearched = researched.has(node.id);
        const targetIsResearching = currentResearch?.projectId === node.id;

        const color = CATEGORY_COLORS[node.category];

        edges.push({
          id: `${reqId}-${node.id}`,
          source: reqId,
          target: node.id,
          type: ConnectionLineType.SmoothStep,
          animated: sourceResearched && targetCanResearch && !targetResearched && !targetIsResearching,
          style: {
            stroke: targetResearched || targetIsResearching
              ? color
              : targetCanResearch
                ? color + 'AA'
                : color + '40',
            strokeWidth: targetResearched || targetIsResearching ? 3 : targetCanResearch ? 2 : 1,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: targetResearched || targetIsResearching
              ? color
              : targetCanResearch
                ? color + 'AA'
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
  nodes: researchNodes,
  nation,
  currentResearch,
  onStartResearch,
  onCancelResearch,
  onNodeClick,
}: {
  category: ResearchCategory;
  nodes: ResearchNode[];
  nation: Nation;
  currentResearch: ResearchTreeFlowProps['currentResearch'];
  onStartResearch: (nodeId: string) => void;
  onCancelResearch?: (nodeId: string) => void;
  onNodeClick: (nodeId: string) => void;
}) {
  // Create flow nodes and edges
  const flowNodes = useMemo(
    () => {
      const researched = new Set(Object.keys(nation.researched || {}));
      return researchNodes.map((node) => {
        const isResearched = researched.has(node.id);
        const isResearching = currentResearch?.projectId === node.id;
        const canResearchNode = canResearch(node.id, researched);
        const canAfford =
          nation.production >= (node.cost.production || 0) &&
          nation.intel >= (node.cost.intel || 0) &&
          nation.uranium >= (node.cost.uranium || 0);

        return {
          id: node.id,
          type: 'researchNode',
          position: { x: 0, y: 0 },
          data: {
            ...node,
            researched: isResearched,
            canResearch: canResearchNode,
            canAfford,
            isResearching,
            researchProgress: isResearching ? currentResearch?.progress : undefined,
            onStartResearch: () => onNodeClick(node.id),
            onCancelResearch: onCancelResearch ? () => onCancelResearch(node.id) : undefined,
            playerProduction: nation.production,
            playerIntel: nation.intel,
            playerUranium: nation.uranium,
          },
        };
      });
    },
    [researchNodes, nation, currentResearch, onNodeClick, onCancelResearch]
  );

  const flowEdges = useMemo(
    () => createFlowEdges(researchNodes, nation, currentResearch),
    [researchNodes, nation, currentResearch]
  );

  // Apply automatic layout
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(flowNodes, flowEdges, 'LR'),
    [flowNodes, flowEdges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // Update nodes when state changes
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
        <Controls className="bg-gray-900 border-cyan-500/50" />
        <MiniMap
          nodeColor={(node) => {
            if (node.data.researched) return categoryColor;
            if (node.data.isResearching) return '#f59e0b'; // amber
            if (node.data.canResearch && node.data.canAfford) return categoryColor + '88';
            return '#4b5563';
          }}
          maskColor="rgba(0, 0, 0, 0.8)"
          className="bg-gray-900 border border-cyan-500/50"
        />
        <Panel position="top-right" className="bg-gray-900/90 p-2 rounded border border-cyan-500/30">
          <div className="text-[10px] text-cyan-300 space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded border-2" style={{ borderColor: categoryColor, background: categoryColor + '40' }} />
              <span>Researched</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded border-2 border-amber-500 bg-amber-500/40" />
              <span>In Progress</span>
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

export function ResearchTreeFlow({
  nation,
  onStartResearch,
  onCancelResearch,
  currentResearch,
}: ResearchTreeFlowProps) {
  const [activeTab, setActiveTab] = useState<ResearchCategory>('nuclear');
  const [selectedTech, setSelectedTech] = useState<string | null>(null);

  // Calculate research counts per category
  const researched = new Set(Object.keys(nation.researched || {}));

  const getCategoryStats = (category: ResearchCategory) => {
    const nodes = CATEGORY_RESEARCH_MAP[category];
    const researchedCount = nodes.filter((n) => researched.has(n.id)).length;
    const totalCount = nodes.length;
    return { researchedCount, totalCount };
  };

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedTech(nodeId);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setSelectedTech(null);
  }, []);

  const handleStartResearch = useCallback(() => {
    if (selectedTech) {
      onStartResearch(selectedTech);
      setSelectedTech(null);
    }
  }, [selectedTech, onStartResearch]);

  const handleCancelResearch = useCallback(() => {
    if (selectedTech && onCancelResearch) {
      onCancelResearch(selectedTech);
      setSelectedTech(null);
    }
  }, [selectedTech, onCancelResearch]);

  // Get selected tech data
  const selectedTechNode = useMemo(() => {
    if (!selectedTech) return null;
    
    const allNodes = displayCategories.flatMap(cat => CATEGORY_RESEARCH_MAP[cat]);
    const node = allNodes.find(n => n.id === selectedTech);
    if (!node) return null;

    const isResearched = researched.has(node.id);
    const isResearching = currentResearch?.projectId === node.id;
    const canResearchNode = canResearch(node.id, researched);
    const canAfford =
      nation.production >= (node.cost.production || 0) &&
      nation.intel >= (node.cost.intel || 0) &&
      nation.uranium >= (node.cost.uranium || 0);

    return {
      ...node,
      researched: isResearched,
      canResearch: canResearchNode,
      canAfford,
      isResearching,
      researchProgress: isResearching ? currentResearch?.progress : undefined,
      playerProduction: nation.production,
      playerIntel: nation.intel,
      playerUranium: nation.uranium,
    };
  }, [selectedTech, nation, currentResearch, researched]);

  // Categories to display (excluding empty ones)
  const displayCategories: ResearchCategory[] = [
    'nuclear',
    'cyber',
    'conventional',
    'economy',
    'culture',
    'space',
    'intelligence',
  ];

  return (
    <div className="w-full">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as ResearchCategory)}
      >
        <TabsList className="grid w-full grid-cols-7 bg-black/60 border border-cyan-500/30">
          {displayCategories.map((category) => {
            const Icon = CATEGORY_ICONS[category];
            const { researchedCount, totalCount } = getCategoryStats(category);
            const color = CATEGORY_COLORS[category];

            return (
              <TabsTrigger
                key={category}
                value={category}
                className="flex flex-col items-center gap-1 data-[state=active]:bg-cyan-500/20 data-[state=active]:border-cyan-400/60 p-2"
              >
                <Icon className="h-4 w-4" style={{ color }} />
                <span className="uppercase tracking-wide text-[9px]">
                  {CATEGORY_NAMES[category].split(' ')[0]}
                </span>
                {researchedCount > 0 && (
                  <span
                    className="text-[8px] px-1.5 py-0.5 rounded"
                    style={{
                      background: color + '30',
                      color: color,
                    }}
                  >
                    {researchedCount}/{totalCount}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {displayCategories.map((category) => (
          <TabsContent key={category} value={category} className="mt-4">
            <div className="mb-2">
              <h3
                className="text-lg font-bold uppercase tracking-wider"
                style={{ color: CATEGORY_COLORS[category] }}
              >
                {CATEGORY_NAMES[category]}
              </h3>
            </div>
            <CategoryFlowPanel
              category={category}
              nodes={CATEGORY_RESEARCH_MAP[category]}
              nation={nation}
              currentResearch={currentResearch}
              onStartResearch={onStartResearch}
              onCancelResearch={onCancelResearch}
              onNodeClick={handleNodeClick}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Tech Details Dialog */}
      <TechDetailsDialog
        isOpen={selectedTech !== null}
        onClose={handleCloseDialog}
        tech={selectedTechNode}
        onStartResearch={handleStartResearch}
        onCancelResearch={handleCancelResearch}
      />
    </div>
  );
}
