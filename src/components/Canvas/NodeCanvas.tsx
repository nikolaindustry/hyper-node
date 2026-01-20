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
          animated: true,
        }}
        className="bg-gray-900"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#374151"
        />
        <Controls className="bg-gray-800 border-gray-600" />
        <MiniMap
          className="bg-gray-800 border-gray-600"
          nodeColor={(node) => {
            switch (node.type) {
              case 'setupLoop':
                return node.data?.nodeType === 'setup' ? '#15803d' : '#7e22ce';
              case 'function':
                return '#2563eb';
              case 'variable':
                return '#ea580c';
              default:
                return '#6b7280';
            }
          }}
        />
      </ReactFlow>
    </div>
  );
}
