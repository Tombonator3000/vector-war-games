import { useCallback, useEffect, useMemo, useState } from 'react';
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
  FlaskConical,
} from 'lucide-react';
import type { Nation } from '@/types/game';
import type { ResearchNode, ResearchCategory } from '@/lib/researchData';
import type { BioLabFacility, BioLabTier } from '@/types/bioLab';
import type { LucideIcon } from 'lucide-react';
import {
  NUCLEAR_RESEARCH,
  CYBER_RESEARCH,
  CONVENTIONAL_RESEARCH,
  ECONOMY_RESEARCH,
  CULTURE_RESEARCH,
  SPACE_RESEARCH,
  INTELLIGENCE_RESEARCH,
  CATEGORY_COLORS,
  RESEARCH_LOOKUP,
  canResearch,
} from '@/lib/researchData';
import { ResearchFlowNode } from './ResearchFlowNode';
import { TechDetailsDialog } from './TechDetailsDialog';
import { getLayoutedElements } from '@/lib/evolutionFlowLayout';
import { BioLabTreeFlow } from './BioLabTreeFlow';

interface ResearchTreeFlowProps {
  nation: Nation;
  onStartResearch: (nodeId: string) => void;
  onCancelResearch?: (nodeId: string) => void;
  currentResearch?: {
    projectId: string;
    progress: number;
  };
  bioLabFacility?: BioLabFacility;
  onStartBioLabConstruction?: (tier: BioLabTier) => void;
  onCancelBioLabConstruction?: () => void;
}

const nodeTypes = {
  researchNode: ResearchFlowNode,
};

type DisplayCategory = ResearchCategory | 'biolab';

const BASE_CATEGORY_ORDER: ResearchCategory[] = [
  'nuclear',
  'cyber',
  'conventional',
  'economy',
  'culture',
  'space',
  'intelligence',
];

type FlowNodeData = ResearchNode & {
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
};

const DISPLAY_CATEGORY_CONFIG: Record<DisplayCategory, {
  icon: LucideIcon;
  color: string;
  label: string;
  description: string;
}> = {
  nuclear: {
    icon: ShieldAlert,
    color: CATEGORY_COLORS.nuclear,
    label: 'Nuclear Arsenal',
    description: 'Escalate your strategic deterrent with heavier warheads and delivery systems.',
  },
  cyber: {
    icon: Brain,
    color: CATEGORY_COLORS.cyber,
    label: 'Cyber Warfare',
    description: 'Enhance offensive and defensive cyber capabilities to disrupt enemy infrastructure.',
  },
  conventional: {
    icon: Factory,
    color: CATEGORY_COLORS.conventional,
    label: 'Conventional Forces',
    description: 'Modernize armies, navies, and air forces for decisive battlefield superiority.',
  },
  economy: {
    icon: DollarSign,
    color: CATEGORY_COLORS.economy,
    label: 'Economy & Production',
    description: 'Boost industrial throughput and wartime logistics to fuel your war machine.',
  },
  culture: {
    icon: Users,
    color: CATEGORY_COLORS.culture,
    label: 'Culture & Diplomacy',
    description: 'Project soft power, sway global opinion, and secure diplomatic leverage.',
  },
  space: {
    icon: Satellite,
    color: CATEGORY_COLORS.space,
    label: 'Space Program',
    description: 'Launch orbital infrastructure to gain intel, defense, and strategic dominance.',
  },
  intelligence: {
    icon: Eye,
    color: CATEGORY_COLORS.intelligence,
    label: 'Intelligence Ops',
    description: 'Expand espionage networks to infiltrate, destabilize, and reveal adversaries.',
  },
  biolab: {
    icon: FlaskConical,
    color: '#a855f7',
    label: 'Bio-Lab Infrastructure',
    description: 'Upgrade clandestine research facilities to unlock advanced pathogen programs.',
  },
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

const RESEARCH_DEPENDENTS: Record<string, string[]> = (() => {
  const map: Record<string, string[]> = {};

  Object.values(CATEGORY_RESEARCH_MAP).forEach((nodes) => {
    nodes.forEach((node) => {
      (node.prerequisites || []).forEach((req) => {
        if (!map[req]) {
          map[req] = [];
        }
        if (!map[req].includes(node.id)) {
          map[req].push(node.id);
        }
      });
    });
  });

  return map;
})();

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
  dependentsMap,
  config,
}: {
  category: ResearchCategory;
  nodes: ResearchNode[];
  nation: Nation;
  currentResearch: ResearchTreeFlowProps['currentResearch'];
  onStartResearch: (nodeId: string) => void;
  onCancelResearch?: (nodeId: string) => void;
  onNodeClick: (nodeId: string) => void;
  dependentsMap: Record<string, string[]>;
  config: typeof DISPLAY_CATEGORY_CONFIG[DisplayCategory];
}) {
  const flowNodes = useMemo(() => {
    const researched = new Set(Object.keys(nation.researched || {}));

    return researchNodes.map((node) => {
      const isResearched = researched.has(node.id);
      const isResearching = currentResearch?.projectId === node.id;
      const canResearchNode = canResearch(node.id, researched);
      const canAfford =
        nation.production >= (node.cost.production || 0) &&
        nation.intel >= (node.cost.intel || 0) &&
        nation.uranium >= (node.cost.uranium || 0);

      const prerequisiteNames = (node.prerequisites || []).map((id) => RESEARCH_LOOKUP[id]?.name ?? id);
      const leadsTo = (dependentsMap[node.id] || []).map((id) => RESEARCH_LOOKUP[id]?.name ?? id);

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
          prerequisiteNames,
          leadsTo,
        },
      } as Node<FlowNodeData>;
    });
  }, [researchNodes, nation, currentResearch, onNodeClick, onCancelResearch, dependentsMap]);

  const flowEdges = useMemo(
    () => createFlowEdges(researchNodes, nation, currentResearch),
    [researchNodes, nation, currentResearch]
  );

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(flowNodes, flowEdges, 'LR'),
    [flowNodes, flowEdges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

  const stats = useMemo(() => {
    const dataNodes = flowNodes.map((node) => node.data as FlowNodeData);
    const totalCount = dataNodes.length;
    const researchedCount = dataNodes.filter((n) => n.researched).length;
    const availableCount = dataNodes.filter((n) => n.canResearch && !n.researched).length;
    const inProgress = dataNodes.some((n) => n.isResearching);
    return { totalCount, researchedCount, availableCount, inProgress };
  }, [flowNodes]);

  const categoryColor = config.color;
  const Icon = config.icon;

  return (
    <div
      className="w-full h-[680px] border rounded-xl overflow-hidden shadow-[0_0_35px_rgba(8,145,178,0.1)]"
      style={{
        borderColor: categoryColor + '55',
        background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(2,6,23,0.92) 100%)',
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        fitViewOptions={{
          padding: 0.25,
          minZoom: 0.5,
          maxZoom: 1.5,
        }}
        minZoom={0.35}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          color={categoryColor + '25'}
          gap={24}
          size={1}
          className="bg-slate-950"
        />
        <Controls className="bg-slate-900/90 border border-cyan-500/40" />
        <MiniMap
          nodeColor={(node) => {
            if (node.data.researched) return categoryColor;
            if (node.data.isResearching) return '#f59e0b';
            if (node.data.canResearch && node.data.canAfford) return categoryColor + '88';
            return '#334155';
          }}
          maskColor="rgba(2, 6, 23, 0.85)"
          className="bg-slate-900/90 border border-cyan-500/40"
        />
        <Panel position="top-left" className="bg-slate-900/90 p-3 rounded-lg border border-cyan-500/30 max-w-sm">
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ background: categoryColor + '22', border: `1px solid ${categoryColor}` }}
            >
              <Icon className="h-5 w-5" style={{ color: categoryColor }} />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wide text-cyan-200">
                {config.label}
              </div>
              <p className="text-[10px] leading-snug text-slate-300">
                {config.description}
              </p>
              <div className="text-[10px] text-cyan-300/80 font-semibold">
                {stats.researchedCount}/{stats.totalCount} researched • {stats.availableCount} available
                {stats.inProgress && <span className="text-amber-300"> • Research in progress</span>}
              </div>
            </div>
          </div>
        </Panel>
        <Panel position="top-right" className="bg-slate-900/90 p-2 rounded-lg border border-cyan-500/30">
          <div className="text-[10px] text-cyan-200 space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded border-2" style={{ borderColor: categoryColor, background: categoryColor + '40' }} />
              <span>Researched</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded border-2 border-amber-500 bg-amber-500/40" />
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded border-2 border-gray-600 bg-slate-700" />
              <span>Locked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded border-2 animate-pulse" style={{ borderColor: categoryColor }} />
              <span>Available</span>
            </div>
          </div>
        </Panel>
        <Panel position="bottom-left" className="bg-slate-900/85 px-3 py-1.5 rounded border border-cyan-500/30 text-[9px] text-cyan-200">
          Hover any technology to preview its unlocks and downstream path.
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
  bioLabFacility,
  onStartBioLabConstruction,
  onCancelBioLabConstruction,
}: ResearchTreeFlowProps) {
  const [activeTab, setActiveTab] = useState<DisplayCategory>('nuclear');
  const [selectedTech, setSelectedTech] = useState<string | null>(null);

  const researchCategories = useMemo(() => BASE_CATEGORY_ORDER.filter((category) => CATEGORY_RESEARCH_MAP[category].length > 0), []);

  const displayCategories = useMemo(() => {
    const categories: DisplayCategory[] = [...researchCategories];
    if (bioLabFacility && onStartBioLabConstruction) {
      categories.push('biolab');
    }
    return categories;
  }, [researchCategories, bioLabFacility, onStartBioLabConstruction]);

  useEffect(() => {
    if (displayCategories.length > 0 && !displayCategories.includes(activeTab)) {
      setActiveTab(displayCategories[0]);
    }
  }, [displayCategories, activeTab]);

  const researched = new Set(Object.keys(nation.researched || {}));

  const getCategoryStats = useCallback((category: DisplayCategory) => {
    if (category === 'biolab') {
      return {
        researchedCount: bioLabFacility?.tier ?? 0,
        totalCount: 4,
      };
    }

    const nodes = CATEGORY_RESEARCH_MAP[category];
    const researchedCount = nodes.filter((n) => researched.has(n.id)).length;
    const totalCount = nodes.length;
    return { researchedCount, totalCount };
  }, [bioLabFacility?.tier, researched]);

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

  const selectedTechNode = useMemo(() => {
    if (!selectedTech) return null;

    const allNodes = researchCategories.flatMap((cat) => CATEGORY_RESEARCH_MAP[cat]);
    const node = allNodes.find((n) => n.id === selectedTech);
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
  }, [selectedTech, researchCategories, researched, currentResearch, nation]);

  return (
    <div className="w-full space-y-3">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as DisplayCategory)}
      >
        <TabsList
          className="grid w-full bg-black/60 border border-cyan-500/30 h-auto p-1 rounded"
          style={{ gridTemplateColumns: `repeat(${displayCategories.length}, minmax(0, 1fr))` }}
        >
          {displayCategories.map((category) => {
            const config = DISPLAY_CATEGORY_CONFIG[category];
            const Icon = config.icon;
            const { researchedCount, totalCount } = getCategoryStats(category);
            const isBioLab = category === 'biolab';

            return (
              <TabsTrigger
                key={category}
                value={category}
                className="flex items-center justify-center gap-1.5 px-2 py-1.5 h-auto data-[state=active]:bg-cyan-500/20 data-[state=active]:border-cyan-400/70 border border-transparent rounded"
              >
                <Icon className="h-5 w-5 shrink-0" style={{ color: config.color }} />
                <div className="flex flex-col items-start min-w-0">
                  <span className="uppercase tracking-wide text-[10px] font-bold leading-none truncate text-cyan-100">
                    {config.label.split(' ')[0]}
                  </span>
                  {totalCount > 0 && (
                    <span
                      className="text-[9px] leading-none mt-0.5"
                      style={{ color: config.color }}
                    >
                      {isBioLab ? `Tier ${researchedCount}` : `${researchedCount}/${totalCount}`}
                    </span>
                  )}
                </div>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {displayCategories.map((category) => (
          <TabsContent key={category} value={category} className="mt-3">
            {category === 'biolab' ? (
              bioLabFacility && onStartBioLabConstruction ? (
                <BioLabTreeFlow
                  facility={bioLabFacility}
                  playerProduction={nation.production}
                  playerUranium={nation.uranium}
                  onStartConstruction={onStartBioLabConstruction}
                  onCancelConstruction={onCancelBioLabConstruction}
                />
              ) : (
                <div className="text-sm text-gray-400">Bio-Lab program unavailable.</div>
              )
            ) : (
              <CategoryFlowPanel
                category={category}
                nodes={CATEGORY_RESEARCH_MAP[category]}
                nation={nation}
                currentResearch={currentResearch}
                onStartResearch={onStartResearch}
                onCancelResearch={onCancelResearch}
                onNodeClick={handleNodeClick}
                dependentsMap={RESEARCH_DEPENDENTS}
                config={DISPLAY_CATEGORY_CONFIG[category]}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>

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
