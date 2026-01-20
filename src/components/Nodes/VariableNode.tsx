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
      className={`bg-gray-800 rounded-lg shadow-lg border-2 min-w-[200px] ${
        selected ? 'border-yellow-500' : 'border-orange-600'
      }`}
    >
      {/* Header */}
      <div className="bg-orange-600 px-3 py-2 rounded-t-md flex justify-between items-center">
        <span className="text-white font-semibold text-sm">Variable</span>
        <button
          onClick={handleDelete}
          className="text-white/70 hover:text-white text-xs"
        >
          x
        </button>
      </div>

      {/* Body */}
      <div className="p-3 space-y-3">
        {/* Variable name */}
        <div>
          <label className="text-gray-400 text-xs block mb-1">Name</label>
          <input
            type="text"
            value={data.variableName || ''}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="myVariable"
            className="bg-gray-700 text-white text-sm px-2 py-1 rounded border border-gray-600 focus:border-orange-500 focus:outline-none w-full"
          />
        </div>

        {/* Type selector */}
        <div>
          <label className="text-gray-400 text-xs block mb-1">Type</label>
          <select
            value={varType}
            onChange={(e) => handleTypeChange(e.target.value as ArduinoType)}
            className="bg-gray-700 text-white text-sm px-2 py-1 rounded border border-gray-600 focus:border-orange-500 focus:outline-none w-full"
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
          <label className="text-gray-400 text-xs block mb-1">Initial Value</label>
          <input
            type="text"
            value={data.initialValue || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder="0"
            className="bg-gray-700 text-white text-sm px-2 py-1 rounded border border-gray-600 focus:border-orange-500 focus:outline-none w-full"
          />
        </div>

        {/* Global toggle */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id={`global-${id}`}
            checked={data.isGlobal ?? true}
            onChange={handleGlobalToggle}
            className="mr-2"
          />
          <label htmlFor={`global-${id}`} className="text-gray-400 text-xs">
            Global variable
          </label>
        </div>
      </div>

      {/* Output handle */}
      <div className="flex justify-end pr-2 pb-3">
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
              width: 10,
              height: 10,
              right: -5,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default memo(VariableNode);
