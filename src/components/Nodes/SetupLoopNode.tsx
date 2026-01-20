import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { type ArduinoNodeData } from '../../models/types';

type SetupLoopNodeType = Node<ArduinoNodeData, 'setupLoop'>;

function SetupLoopNode({ data, selected }: NodeProps<SetupLoopNodeType>) {
  const isSetup = data.nodeType === 'setup';
  const bgColor = isSetup ? 'bg-green-700' : 'bg-purple-700';
  const borderColor = selected
    ? 'border-yellow-400'
    : isSetup
    ? 'border-green-500'
    : 'border-purple-500';

  return (
    <div
      className={`${bgColor} rounded-lg shadow-lg border-2 ${borderColor} min-w-[200px]`}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <span className="text-white font-bold text-lg">{data.label}</span>
        <span className="text-white/60 text-xs">
          {isSetup ? 'Runs once' : 'Loops forever'}
        </span>
      </div>

      {/* Body - drop zone hint */}
      <div className="bg-black/20 mx-2 mb-2 rounded p-4 min-h-[100px] flex items-center justify-center">
        <span className="text-white/40 text-sm text-center">
          Connect function nodes below
        </span>
      </div>

      {/* Execution flow output */}
      <div className="flex justify-end pr-2 pb-2">
        <div className="flex items-center">
          <span className="text-white/60 text-xs mr-2">execute</span>
          <Handle
            type="source"
            position={Position.Right}
            id="exec-out"
            style={{
              background: '#fbbf24',
              width: 12,
              height: 12,
              right: -6,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default memo(SetupLoopNode);
