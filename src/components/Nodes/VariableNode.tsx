import { memo, useCallback } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { type ArduinoNodeData, type ArduinoType, TYPE_COLORS } from '../../models/types';
import { useNodeStore } from '../../store/useNodeStore';

const ARDUINO_TYPES: ArduinoType[] = [
  'int',
  'long',
  'float',
  'double',
  'bool',
  'byte',
  'char',
  'String',
  'uint8_t',
  'uint16_t',
  'uint32_t',
  'unsigned long',
];

type VariableNodeType = Node<ArduinoNodeData, 'variable'>;

function VariableNode({ id, data, selected }: NodeProps<VariableNodeType>) {
  const updateNodeData = useNodeStore((state) => state.updateNodeData);
  const removeNode = useNodeStore((state) => state.removeNode);

  const handleNameChange = useCallback(
    (value: string) => {
      // Sanitize variable name
      const sanitized = value.replace(/[^a-zA-Z0-9_]/g, '');
      updateNodeData(id, {
        variableName: sanitized,
        outputs: [
          {
            ...data.outputs[0],
            label: sanitized || 'var',
          },
        ],
      });
    },
    [id, data.outputs, updateNodeData]
  );

  const handleTypeChange = useCallback(
    (type: ArduinoType) => {
      updateNodeData(id, {
        variableType: type,
        outputs: [
          {
            ...data.outputs[0],
            type,
          },
        ],
      });
    },
    [id, data.outputs, updateNodeData]
  );

  const handleValueChange = useCallback(
    (value: string) => {
      updateNodeData(id, { initialValue: value });
    },
    [id, updateNodeData]
  );

  const handleGlobalToggle = useCallback(() => {
    updateNodeData(id, { isGlobal: !data.isGlobal });
  }, [id, data.isGlobal, updateNodeData]);

  const handleDelete = useCallback(() => {
    removeNode(id);
  }, [id, removeNode]);

  const varType = data.variableType || 'int';

  return (
    <div
      className={`bg-white rounded-lg shadow-sm min-w-[200px] ${
        selected ? 'ring-2 ring-orange-400' : 'border border-gray-200'
      }`}
    >
      {/* Header */}
      <div className="bg-orange-100 px-3 py-2.5 rounded-t-lg flex items-center gap-2 border-b border-orange-200">
        {/* Grip handle */}
        <div className="flex flex-col gap-0.5 opacity-40">
          <div className="flex gap-0.5">
            <span className="w-1 h-1 bg-orange-600 rounded-full"></span>
            <span className="w-1 h-1 bg-orange-600 rounded-full"></span>
          </div>
          <div className="flex gap-0.5">
            <span className="w-1 h-1 bg-orange-600 rounded-full"></span>
            <span className="w-1 h-1 bg-orange-600 rounded-full"></span>
          </div>
          <div className="flex gap-0.5">
            <span className="w-1 h-1 bg-orange-600 rounded-full"></span>
            <span className="w-1 h-1 bg-orange-600 rounded-full"></span>
          </div>
        </div>
        {/* Chevron */}
        <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        {/* Title */}
        <span className="text-orange-700 font-medium text-sm flex-1">Variable</span>
        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button className="p-1 text-orange-400 hover:text-orange-600 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button 
            onClick={handleDelete}
            className="p-1 text-orange-400 hover:text-red-500 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 space-y-3">
        {/* Variable name */}
        <div>
          <label className="text-gray-500 text-xs block mb-1">Name:</label>
          <input
            type="text"
            value={data.variableName || ''}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="myVariable"
            className="bg-white text-blue-600 text-sm px-2 py-1.5 rounded border border-gray-200 focus:border-orange-400 focus:outline-none w-full transition-colors"
          />
        </div>

        {/* Type selector */}
        <div>
          <label className="text-gray-500 text-xs block mb-1">Type:</label>
          <select
            value={varType}
            onChange={(e) => handleTypeChange(e.target.value as ArduinoType)}
            className="bg-white text-gray-700 text-sm px-2 py-1.5 rounded border border-gray-200 focus:border-orange-400 focus:outline-none w-full transition-colors"
          >
            {ARDUINO_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Initial value */}
        <div>
          <label className="text-gray-500 text-xs block mb-1">Value:</label>
          <input
            type="text"
            value={data.initialValue || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder="0"
            className="bg-white text-blue-600 text-sm px-2 py-1.5 rounded border border-gray-200 focus:border-orange-400 focus:outline-none w-full transition-colors"
          />
        </div>

        {/* Global toggle */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id={`global-${id}`}
            checked={data.isGlobal ?? true}
            onChange={handleGlobalToggle}
            className="mr-2 w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
          />
          <label htmlFor={`global-${id}`} className="text-gray-500 text-xs">
            Global variable
          </label>
        </div>
      </div>

      {/* Output handle */}
      <div className="flex justify-end pr-3 pb-3">
        <div className="flex items-center">
          <span className="text-gray-400 text-xs mr-2">
            {data.variableName || 'var'}
          </span>
          <Handle
            type="source"
            position={Position.Right}
            id="value"
            style={{
              background: TYPE_COLORS[varType],
              width: 8,
              height: 8,
              right: -4,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default memo(VariableNode);
