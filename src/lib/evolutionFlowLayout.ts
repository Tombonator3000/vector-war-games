import dagre from 'dagre';
import { Node, Edge, Position } from 'reactflow';

const nodeWidth = 220;
const nodeHeight = 160;

/**
 * Automatically layout nodes using dagre algorithm
 * Creates a left-to-right hierarchical layout based on dependencies
 */
export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'LR'
) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 120, // Horizontal spacing between nodes
    ranksep: 190, // Vertical spacing between ranks (levels)
    edgesep: 50,
    marginx: 50,
    marginy: 50,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? Position.Left : Position.Top;
    node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

    // Shift the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return node;
  });

  return { nodes, edges };
}

/**
 * Create initial node positions in a simple grid
 * Used as fallback if dagre layout fails
 */
export function getGridLayout(nodes: Node[], columns: number = 4) {
  return nodes.map((node, index) => ({
    ...node,
    position: {
      x: (index % columns) * (nodeWidth + 50),
      y: Math.floor(index / columns) * (nodeHeight + 50),
    },
  }));
}

/**
 * Separate nodes by category for multi-tree layout
 */
export function layoutByCategory(
  nodes: Node[],
  edges: Edge[],
  categories: string[]
) {
  const layouts: Record<string, { nodes: Node[]; edges: Edge[] }> = {};

  categories.forEach((category, categoryIndex) => {
    // Filter nodes for this category
    const categoryNodes = nodes.filter(
      (node) => node.data.category === category
    );

    // Filter edges that connect nodes within this category
    const categoryNodeIds = new Set(categoryNodes.map((n) => n.id));
    const categoryEdges = edges.filter(
      (edge) =>
        categoryNodeIds.has(edge.source) && categoryNodeIds.has(edge.target)
    );

    // Layout this category
    const { nodes: layoutedNodes } = getLayoutedElements(
      categoryNodes,
      categoryEdges,
      'LR'
    );

    // Offset each category vertically
    const offsetY = categoryIndex * 600;
    layoutedNodes.forEach((node) => {
      node.position.y += offsetY;
    });

    layouts[category] = {
      nodes: layoutedNodes,
      edges: categoryEdges,
    };
  });

  // Combine all layouts
  const allNodes: Node[] = [];
  const allEdges: Edge[] = [];

  Object.values(layouts).forEach((layout) => {
    allNodes.push(...layout.nodes);
    allEdges.push(...layout.edges);
  });

  return { nodes: allNodes, edges: allEdges };
}
