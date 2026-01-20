import { ReactFlowProvider } from '@xyflow/react';
import NodeCanvas from './components/Canvas/NodeCanvas';
import NodePalette from './components/Panels/NodePalette';
import CodePreview from './components/Panels/CodePreview';
import LibraryManager from './components/Panels/LibraryManager';

function App() {
  return (
    <ReactFlowProvider>
      <div className="h-screen w-screen flex flex-col bg-white">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              <span className="text-gray-900 font-semibold">ARDUINO NODE</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-500 text-sm">flow</span>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Export Code
            </button>
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
