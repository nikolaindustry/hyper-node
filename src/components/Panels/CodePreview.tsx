import { useMemo, useCallback, useState } from 'react';
import { useNodeStore } from '../../store/useNodeStore';
import { generateArduinoCode } from '../../generator/CodeGenerator';

export default function CodePreview() {
  const nodes = useNodeStore((state) => state.nodes);
  const edges = useNodeStore((state) => state.edges);
  const [copied, setCopied] = useState(false);

  const generatedCode = useMemo(() => {
    return generateArduinoCode(nodes, edges);
  }, [nodes, edges]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [generatedCode]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sketch.ino';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [generatedCode]);

  // Simple syntax highlighting using React elements
  const highlightedCode = useMemo(() => {
    return generatedCode.split('\n').map((line, index) => {
      const tokens: React.ReactNode[] = [];
      let remaining = line;
      let keyIdx = 0;

      // Check for comment first
      if (remaining.trim().startsWith('//')) {
        return (
          <div key={index} className="flex hover:bg-gray-100 transition-colors">
            <span className="text-gray-400 select-none w-8 text-right pr-3">
              {index + 1}
            </span>
            <span className="text-slate-500">{line}</span>
          </div>
        );
      }

      // Check for preprocessor
      if (remaining.trim().startsWith('#')) {
        return (
          <div key={index} className="flex hover:bg-gray-100 transition-colors">
            <span className="text-gray-400 select-none w-8 text-right pr-3">
              {index + 1}
            </span>
            <span className="text-purple-600">{line}</span>
          </div>
        );
      }

      // Tokenize the line
      const keywords = ['void', 'int', 'long', 'float', 'double', 'bool', 'boolean', 'byte', 'char', 'String', 'uint8_t', 'uint16_t', 'uint32_t', 'unsigned', 'const', 'if', 'else', 'for', 'while', 'return', 'true', 'false', 'HIGH', 'LOW', 'INPUT', 'OUTPUT', 'INPUT_PULLUP'];
      const tokenRegex = /(\s+)|(\b\w+\b)|([{}();,=.])|(".*?")/g;
      
      let match;
      while ((match = tokenRegex.exec(remaining)) !== null) {
        const token = match[0];
        if (keywords.includes(token)) {
          tokens.push(<span key={keyIdx++} className="text-purple-600">{token}</span>);
        } else if (/^\d+\.?\d*$/.test(token)) {
          tokens.push(<span key={keyIdx++} className="text-orange-600">{token}</span>);
        } else if (token.startsWith('"')) {
          tokens.push(<span key={keyIdx++} className="text-green-600">{token}</span>);
        } else if (/^\w+$/.test(token) && remaining.charAt(tokenRegex.lastIndex) === '(') {
          tokens.push(<span key={keyIdx++} className="text-blue-600">{token}</span>);
        } else {
          tokens.push(<span key={keyIdx++}>{token}</span>);
        }
      }

      return (
        <div key={index} className="flex hover:bg-gray-100 transition-colors">
          <span className="text-gray-400 select-none w-8 text-right pr-3">
            {index + 1}
          </span>
          <span>{tokens.length > 0 ? tokens : line}</span>
        </div>
      );
    });
  }, [generatedCode]);

  return (
    <div className="w-80 bg-white border-l border-gray-100 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          <span className="text-gray-700 font-medium">Code Preview</span>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={handleCopy}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Copy code"
          >
            {copied ? (
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Download .ino"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Code display */}
      <div className="flex-1 overflow-auto p-4">
        <pre className="text-xs font-mono text-gray-700 leading-relaxed">
          {highlightedCode}
        </pre>
      </div>

      {/* Footer info */}
      <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
        <div className="flex justify-between">
          <span>{nodes.length} nodes</span>
          <span>{edges.length} connections</span>
          <span>{generatedCode.split('\n').length} lines</span>
        </div>
      </div>
    </div>
  );
}
