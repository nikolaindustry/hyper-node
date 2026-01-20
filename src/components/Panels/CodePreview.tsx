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
          <div key={index} className="flex">
            <span className="text-gray-600 select-none w-8 text-right pr-3">
              {index + 1}
            </span>
            <span className="text-gray-500">{line}</span>
          </div>
        );
      }

      // Check for preprocessor
      if (remaining.trim().startsWith('#')) {
        return (
          <div key={index} className="flex">
            <span className="text-gray-600 select-none w-8 text-right pr-3">
              {index + 1}
            </span>
            <span className="text-cyan-400">{line}</span>
          </div>
        );
      }

      // Tokenize the line
      const keywords = ['void', 'int', 'long', 'float', 'double', 'bool', 'boolean', 'byte', 'char', 'String', 'uint8_t', 'uint16_t', 'uint32_t', 'unsigned', 'const', 'if', 'else', 'for', 'while', 'return', 'true', 'false', 'HIGH', 'LOW', 'INPUT', 'OUTPUT', 'INPUT_PULLUP'];
      const tokenRegex = /(\s+)|(\b\w+\b)|([{}();,=])|(".*?")/g;
      
      let match;
      while ((match = tokenRegex.exec(remaining)) !== null) {
        const token = match[0];
        if (keywords.includes(token)) {
          tokens.push(<span key={keyIdx++} className="text-purple-400">{token}</span>);
        } else if (/^\d+\.?\d*$/.test(token)) {
          tokens.push(<span key={keyIdx++} className="text-orange-400">{token}</span>);
        } else if (token.startsWith('"')) {
          tokens.push(<span key={keyIdx++} className="text-green-400">{token}</span>);
        } else if (/^\w+$/.test(token) && remaining.charAt(tokenRegex.lastIndex) === '(') {
          tokens.push(<span key={keyIdx++} className="text-blue-400">{token}</span>);
        } else {
          tokens.push(<span key={keyIdx++}>{token}</span>);
        }
      }

      return (
        <div key={index} className="flex">
          <span className="text-gray-600 select-none w-8 text-right pr-3">
            {index + 1}
          </span>
          <span>{tokens.length > 0 ? tokens : line}</span>
        </div>
      );
    });
  }, [generatedCode]);

  return (
    <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-white font-bold text-lg">Generated Code</h2>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1.5 rounded transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleDownload}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded transition-colors"
          >
            Download .ino
          </button>
        </div>
      </div>

      {/* Code display */}
      <div className="flex-1 overflow-auto p-3">
        <pre className="text-sm font-mono text-gray-300 leading-relaxed">
          {highlightedCode}
        </pre>
      </div>

      {/* Footer info */}
      <div className="p-3 border-t border-gray-700 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>{nodes.length} nodes</span>
          <span>{edges.length} connections</span>
          <span>{generatedCode.split('\n').length} lines</span>
        </div>
      </div>
    </div>
  );
}
