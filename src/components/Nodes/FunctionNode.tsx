import { memo, useCallback } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { type ArduinoNodeData, TYPE_COLORS } from '../../models/types';
import { useNodeStore } from '../../store/useNodeStore';

type FunctionNodeType = Node<ArduinoNodeData, 'function'>;

function FunctionNode({ id, data, selected }: NodeProps<FunctionNodeType>) {
  const updateNodeData = useNodeStore((state) => state.updateNodeData);
  const removeNode = useNodeStore((state) => state.removeNode);

  const handleInputChange = useCallback(
    (inputId: string, value: string) => {
      updateNodeData(id, {
        inputs: data.inputs.map((input) =>
          input.id === inputId ? { ...input, value } : input
        ),
      });
    },
    [id, data.inputs, updateNodeData]
  );

  const handleDelete = useCallback(() => {
    removeNode(id);
  }, [id, removeNode]);

  const isMethod = data.functionName.includes('.');

  return (
    <div
      className={`bg-gray-800 rounded-lg shadow-lg border-2 min-w-[180px] ${
        selected ? 'border-blue-500' : 'border-gray-600'
      }`}
    >
      {/* Execution flow input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="exec-in"
        style={{
          background: '#fbbf24',
          width: 12,
          height: 12,
          left: -6,
          top: 20,
        }}
      />

      {/* Header */}
      <div className="bg-blue-600 px-3 py-2 rounded-t-md flex justify-between items-center">
        <span className="text-white font-semibold text-sm truncate">
          {isMethod ? data.functionName : `${data.functionName}()`}
        </span>
        <button
          onClick={handleDelete}
          className="text-white/70 hover:text-white text-xs ml-2"
        >
          x
        </button>
      </div>

      {/* Body */}
      <div className="p-2">
        {/* Inputs */}
        {data.inputs.map((input) => (
          <div key={input.id} className="flex items-center mb-2 relative">
            <Handle
              type="target"
              position={Position.Left}
              id={input.id}
              style={{
                background: TYPE_COLORS[input.type],
                width: 10,
                height: 10,
                left: -5,
              }}
            />
            <div className="flex flex-col flex-1 ml-2">
              <label className="text-gray-400 text-xs mb-1">
                {input.label}
                <span className="text-gray-500 ml-1">({input.type})</span>
              </label>
              {!input.connected && (
                <input
                  type="text"
                  value={input.value || ''}
                  onChange={(e) => handleInputChange(input.id, e.target.value)}
                  placeholder={input.type === 'String' ? '"value"' : '0'}
                  className="bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none w-full"
                />
              )}
              {input.connected && (
                <span className="text-green-400 text-xs">Connected</span>
              )}
            </div>
          </div>
        ))}

        {/* Outputs */}
        {data.outputs.map((output) => (
          <div key={output.id} className="flex items-center justify-end mb-2 relative">
            <span className="text-gray-400 text-xs mr-2">
              {output.label}
              <span className="text-gray-500 ml-1">({output.type})</span>
            </span>
            <Handle
              type="source"
              position={Position.Right}
              id={output.id}
              style={{
                background: TYPE_COLORS[output.type],
                width: 10,
                height: 10,
                right: -5,
              }}
            />
          </div>
        ))}

        {/* No inputs/outputs message */}
        {data.inputs.length === 0 && data.outputs.length === 0 && (
          <div className="text-gray-500 text-xs text-center py-1">
            No parameters
          </div>
        )}
      </div>

      {/* Footer with library badge and exec output */}
      <div className="px-2 pb-2 flex justify-between items-center">
        <span className="text-xs text-gray-500 bg-gray-700 px-2 py-0.5 rounded">
          {data.library}
        </span>
        <span className="text-xs text-yellow-500">exec</span>
      </div>

      {/* Execution flow output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="exec-out"
        style={{
          background: '#fbbf24',
          width: 12,
          height: 12,
          right: -6,
          bottom: 12,
          top: 'auto',
        }}
      />
    </div>
  );
}

export default memo(FunctionNode);
