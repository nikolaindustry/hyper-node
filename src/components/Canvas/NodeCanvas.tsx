import { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type NodeTypes,
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useNodeStore } from '../../store/useNodeStore';
import FunctionNode from '../Nodes/FunctionNode';
import SetupLoopNode from '../Nodes/SetupLoopNode';
import VariableNode from '../Nodes/VariableNode';

const nodeTypes: NodeTypes = {
  function: FunctionNode,
  setupLoop: SetupLoopNode,
  variable: VariableNode,
};

export default function NodeCanvas() {
  const nodes = useNodeStore((state) => state.nodes);
  const edges = useNodeStore((state) => state.edges);
  const onNodesChange = useNodeStore((state) => state.onNodesChange);
  const onEdgesChange = useNodeStore((state) => state.onEdgesChange);
  const onConnect = useNodeStore((state) => state.onConnect);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div className="flex-1 h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: '#94a3b8', strokeWidth: 2 },
        }}
        className="bg-white"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#e2e8f0"
        />
        <Controls className="bg-white border-gray-200" />
        <MiniMap
          className="bg-white border-gray-200"
          nodeColor={(node) => {
            switch (node.type) {
              case 'setupLoop':
                return node.data?.nodeType === 'setup' ? '#d1fae5' : '#ede9fe';
              case 'function':
                return '#e0e7ff';
              case 'variable':
                return '#ffedd5';
              default:
                return '#f3f4f6';
            }
          }}
        />
      </ReactFlow>
    </div>
  );
}
