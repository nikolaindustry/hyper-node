import { create } from 'zustand';
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  type Connection,
  addEdge,
} from '@xyflow/react';
import { type ArduinoNodeData, isTypeCompatible } from '../models/types';

// Initial setup and loop nodes
const initialNodes: Node<ArduinoNodeData>[] = [
  {
    id: 'setup',
    type: 'setupLoop',
    position: { x: 100, y: 100 },
    data: {
      label: 'setup()',
      nodeType: 'setup',
      library: 'Arduino',
      functionName: 'setup',
      inputs: [],
      outputs: [],
    },
  },
  {
    id: 'loop',
    type: 'setupLoop',
    position: { x: 100, y: 400 },
    data: {
      label: 'loop()',
      nodeType: 'loop',
      library: 'Arduino',
      functionName: 'loop',
      inputs: [],
      outputs: [],
    },
  },
];

interface NodeState {
  nodes: Node<ArduinoNodeData>[];
  edges: Edge[];
  onNodesChange: OnNodesChange<Node<ArduinoNodeData>>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (node: Node<ArduinoNodeData>) => void;
  updateNodeData: (nodeId: string, data: Partial<ArduinoNodeData>) => void;
  removeNode: (nodeId: string) => void;
  setNodes: (nodes: Node<ArduinoNodeData>[]) => void;
  setEdges: (edges: Edge[]) => void;
  getNodeById: (nodeId: string) => Node<ArduinoNodeData> | undefined;
  getConnectedInputValue: (nodeId: string, inputId: string) => string | undefined;
}

export const useNodeStore = create<NodeState>((set, get) => ({
  nodes: initialNodes,
  edges: [],

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection: Connection) => {
    const { nodes } = get();
    const sourceNode = nodes.find((n) => n.id === connection.source);
    const targetNode = nodes.find((n) => n.id === connection.target);

    if (!sourceNode || !targetNode) return;

    // Check if this is an execution flow connection
    const isExecConnection = 
      connection.sourceHandle === 'exec-out' && 
      connection.targetHandle === 'exec-in';

    if (isExecConnection) {
      // Allow execution flow connections without type checking
      set({
        edges: addEdge(
          {
            ...connection,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#fbbf24', strokeWidth: 2 },
          },
          get().edges
        ),
      });
      return;
    }

    // For data connections, validate type compatibility
    const sourcePort = sourceNode.data.outputs.find(
      (p) => p.id === connection.sourceHandle
    );
    const targetPort = targetNode.data.inputs.find(
      (p) => p.id === connection.targetHandle
    );

    if (!sourcePort || !targetPort) return;

    // Check type compatibility
    if (!isTypeCompatible(sourcePort.type, targetPort.type)) {
      console.warn(
        `Type mismatch: ${sourcePort.type} cannot connect to ${targetPort.type}`
      );
      return;
    }

    // Mark the target port as connected
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === targetNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              inputs: node.data.inputs.map((input) =>
                input.id === connection.targetHandle
                  ? { ...input, connected: true }
                  : input
              ),
            },
          };
        }
        return node;
      }),
      edges: addEdge(
        {
          ...connection,
          type: 'smoothstep',
          animated: true,
        },
        get().edges
      ),
    });
  },

  addNode: (node) => {
    set({
      nodes: [...get().nodes, node],
    });
  },

  updateNodeData: (nodeId, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node
      ),
    });
  },

  removeNode: (nodeId) => {
    // Don't allow removing setup or loop nodes
    if (nodeId === 'setup' || nodeId === 'loop') return;

    set({
      nodes: get().nodes.filter((node) => node.id !== nodeId),
      edges: get().edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
    });
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  getNodeById: (nodeId) => {
    return get().nodes.find((node) => node.id === nodeId);
  },

  getConnectedInputValue: (nodeId, inputId) => {
    const { edges, nodes } = get();
    const edge = edges.find(
      (e) => e.target === nodeId && e.targetHandle === inputId
    );
    if (!edge) return undefined;

    const sourceNode = nodes.find((n) => n.id === edge.source);
    if (!sourceNode) return undefined;

    // For now, return a reference to the source node's output
    // This will be resolved during code generation
    return `__ref:${edge.source}:${edge.sourceHandle}`;
  },
}));
