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
      className={`bg-white rounded-lg shadow-sm min-w-[220px] ${
        selected ? 'ring-2 ring-blue-400' : 'border border-gray-200'
      }`}
    >
      {/* Execution flow input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="exec-in"
        style={{
          background: '#fbbf24',
          width: 10,
          height: 10,
          left: -5,
          top: 20,
        }}
      />

      {/* Header */}
      <div className="bg-indigo-100 px-3 py-2.5 rounded-t-lg flex items-center gap-2 border-b border-indigo-200">
        {/* Grip handle */}
        <div className="flex flex-col gap-0.5 opacity-40">
          <div className="flex gap-0.5">
            <span className="w-1 h-1 bg-indigo-600 rounded-full"></span>
            <span className="w-1 h-1 bg-indigo-600 rounded-full"></span>
          </div>
          <div className="flex gap-0.5">
            <span className="w-1 h-1 bg-indigo-600 rounded-full"></span>
            <span className="w-1 h-1 bg-indigo-600 rounded-full"></span>
          </div>
          <div className="flex gap-0.5">
            <span className="w-1 h-1 bg-indigo-600 rounded-full"></span>
            <span className="w-1 h-1 bg-indigo-600 rounded-full"></span>
          </div>
        </div>
        {/* Chevron */}
        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        {/* Function name */}
        <span className="text-indigo-700 font-medium text-sm flex-1 truncate">
          {isMethod ? data.functionName : `${data.functionName}()`}
        </span>
        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button className="p-1 text-indigo-400 hover:text-indigo-600 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </button>
          <button className="p-1 text-indigo-400 hover:text-indigo-600 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button 
            onClick={handleDelete}
            className="p-1 text-indigo-400 hover:text-red-500 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        {/* Inputs */}
        {data.inputs.map((input) => (
          <div key={input.id} className="flex items-center mb-3 relative">
            <Handle
              type="target"
              position={Position.Left}
              id={input.id}
              style={{
                background: TYPE_COLORS[input.type],
                width: 8,
                height: 8,
                left: -4,
              }}
            />
            <div className="flex flex-col flex-1 ml-1">
              <label className="text-gray-500 text-xs mb-1">
                {input.label}:
              </label>
              {!input.connected && (
                <input
                  type="text"
                  value={input.value || ''}
                  onChange={(e) => handleInputChange(input.id, e.target.value)}
                  placeholder={input.type === 'String' ? '"value"' : '0'}
                  className="bg-white text-blue-600 text-sm px-2 py-1.5 rounded border border-gray-200 focus:border-blue-400 focus:outline-none w-full transition-colors"
                />
              )}
              {input.connected && (
                <span className="text-green-500 text-xs">Connected</span>
              )}
            </div>
          </div>
        ))}

        {/* Outputs */}
        {data.outputs.map((output) => (
          <div key={output.id} className="flex items-center justify-end mb-2 relative">
            <span className="text-gray-500 text-xs mr-2">
              {output.label}
              <span className="text-gray-400 ml-1">({output.type})</span>
            </span>
            <Handle
              type="source"
              position={Position.Right}
              id={output.id}
              style={{
                background: TYPE_COLORS[output.type],
                width: 8,
                height: 8,
                right: -4,
              }}
            />
          </div>
        ))}

        {/* No inputs/outputs message */}
        {data.inputs.length === 0 && data.outputs.length === 0 && (
          <div className="text-gray-400 text-xs text-center py-2">
            No parameters
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 pb-3 flex justify-between items-center">
        <span className="text-xs text-gray-400">
          {data.library}
        </span>
      </div>

      {/* Execution flow output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="exec-out"
        style={{
          background: '#fbbf24',
          width: 10,
          height: 10,
          right: -5,
          bottom: 14,
          top: 'auto',
        }}
      />
    </div>
  );
}

export default memo(FunctionNode);
