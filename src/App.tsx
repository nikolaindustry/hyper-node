import { ReactFlowProvider } from '@xyflow/react';
import NodeCanvas from './components/Canvas/NodeCanvas';
import NodePalette from './components/Panels/NodePalette';
import CodePreview from './components/Panels/CodePreview';
import LibraryManager from './components/Panels/LibraryManager';

function App() {
  return (
    <ReactFlowProvider>
      <div className="h-screen w-screen flex flex-col bg-gray-900">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-white font-bold text-xl">Arduino Node Editor</h1>
            <span className="text-gray-500 text-sm">Visual Arduino Programming</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <span>Drag nodes from the palette</span>
            <span className="text-gray-600">|</span>
            <span>Connect to generate code</span>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar - Node Palette */}
          <NodePalette />

          {/* Center - Canvas */}
          <NodeCanvas />

          {/* Right sidebar - Code Preview */}
          <CodePreview />
        </div>

        {/* Library Manager Modal */}
        <LibraryManager />
      </div>
    </ReactFlowProvider>
  );
}

export default App
