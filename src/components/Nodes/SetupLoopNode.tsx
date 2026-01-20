import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { type ArduinoNodeData } from '../../models/types';

type SetupLoopNodeType = Node<ArduinoNodeData, 'setupLoop'>;

function SetupLoopNode({ data, selected }: NodeProps<SetupLoopNodeType>) {
  const isSetup = data.nodeType === 'setup';
  const headerBg = isSetup ? 'bg-emerald-100' : 'bg-violet-100';
  const headerBorder = isSetup ? 'border-emerald-200' : 'border-violet-200';
  const textColor = isSetup ? 'text-emerald-700' : 'text-violet-700';
  const dotColor = isSetup ? 'bg-emerald-600' : 'bg-violet-600';
  const ringColor = selected
    ? isSetup
      ? 'ring-2 ring-emerald-400'
      : 'ring-2 ring-violet-400'
    : 'border border-gray-200';

  return (
    <div className={`bg-white rounded-lg shadow-sm min-w-[220px] ${ringColor}`}>
      {/* Header */}
      <div className={`${headerBg} px-3 py-2.5 rounded-t-lg flex items-center gap-2 border-b ${headerBorder}`}>
        {/* Grip handle */}
        <div className="flex flex-col gap-0.5 opacity-40">
          <div className="flex gap-0.5">
            <span className={`w-1 h-1 ${dotColor} rounded-full`}></span>
            <span className={`w-1 h-1 ${dotColor} rounded-full`}></span>
          </div>
          <div className="flex gap-0.5">
            <span className={`w-1 h-1 ${dotColor} rounded-full`}></span>
            <span className={`w-1 h-1 ${dotColor} rounded-full`}></span>
          </div>
          <div className="flex gap-0.5">
            <span className={`w-1 h-1 ${dotColor} rounded-full`}></span>
            <span className={`w-1 h-1 ${dotColor} rounded-full`}></span>
          </div>
        </div>
        {/* Chevron */}
        <svg className={`w-4 h-4 ${textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        {/* Title */}
        <span className={`${textColor} font-medium text-sm flex-1`}>{data.label}</span>
        {/* Subtitle */}
        <span className={`${textColor} opacity-60 text-xs`}>
          {isSetup ? 'Runs once' : 'Loops forever'}
        </span>
      </div>

      {/* Body - drop zone hint */}
      <div className="bg-gray-50 mx-3 my-3 rounded border border-dashed border-gray-200 p-4 min-h-[80px] flex items-center justify-center">
        <span className="text-gray-400 text-sm text-center">
          Connect function nodes below
        </span>
      </div>

      {/* Execution flow output */}
      <div className="flex justify-end pr-3 pb-3">
        <div className="flex items-center">
          <span className="text-gray-400 text-xs mr-2">execute</span>
          <Handle
            type="source"
            position={Position.Right}
            id="exec-out"
            style={{
              background: '#fbbf24',
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

export default memo(SetupLoopNode);
