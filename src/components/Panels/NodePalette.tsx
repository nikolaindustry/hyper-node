import { useState, useCallback, useMemo } from 'react';
import { useLibraryStore } from '../../store/useLibraryStore';
import { useNodeStore } from '../../store/useNodeStore';
import { type FunctionDef, type ArduinoNodeData, type NodePort } from '../../models/types';
import { type Node } from '@xyflow/react';

// Extended function definition with library info for node creation
interface FunctionWithLibrary extends FunctionDef {
  libraryName: string;
  includeStatement: string;
}

export default function NodePalette() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['Digital I/O', 'Analog I/O', 'Time'])
  );

  const libraries = useLibraryStore((state) => state.libraries);
  const activeLibraries = useLibraryStore((state) => state.activeLibraries);
  const toggleLibrary = useLibraryStore((state) => state.toggleLibrary);
  const addNode = useNodeStore((state) => state.addNode);
  const nodes = useNodeStore((state) => state.nodes);

  // Compute functions by category using useMemo to avoid infinite loops
  const functionsByCategory = useMemo(() => {
    const byCategory: Record<string, FunctionWithLibrary[]> = {};

    libraries
      .filter((lib) => activeLibraries.includes(lib.name))
      .forEach((lib) => {
        // Add standalone functions with library info
        lib.functions.forEach((fn) => {
          const category = fn.category || lib.displayName;
          if (!byCategory[category]) {
            byCategory[category] = [];
          }
          byCategory[category].push({
            ...fn,
            libraryName: lib.name,
            includeStatement: lib.includeStatement,
          });
        });

        // Add class methods with library info
        lib.classes.forEach((cls) => {
          cls.methods.forEach((method) => {
            const category = method.category || cls.name;
            if (!byCategory[category]) {
              byCategory[category] = [];
            }
            byCategory[category].push({
              ...method,
              libraryName: lib.name,
              includeStatement: lib.includeStatement,
            });
          });
        });
      });

    return byCategory;
  }, [libraries, activeLibraries]);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const createFunctionNode = useCallback(
    (fn: FunctionWithLibrary) => {
      const inputs: NodePort[] = fn.parameters.map((param, index) => ({
        id: `input-${index}`,
        label: param.name,
        type: param.type,
        value: param.defaultValue,
      }));

      const outputs: NodePort[] =
        fn.returnType !== 'void'
          ? [{ id: 'output', label: 'result', type: fn.returnType }]
          : [];

      const functionName = fn.isMethod
        ? `${fn.className}.${fn.name}`
        : fn.name;

      // Find a good position for the new node
      const existingCount = nodes.length;
      const newNode: Node<ArduinoNodeData> = {
        id: `${fn.name}-${Date.now()}`,
        type: 'function',
        position: {
          x: 400 + (existingCount % 3) * 50,
          y: 100 + Math.floor(existingCount / 3) * 150,
        },
        data: {
          label: functionName,
          nodeType: 'function',
          library: fn.libraryName,
          functionName,
          inputs,
          outputs,
          includeStatement: fn.includeStatement,
        },
      };

      addNode(newNode);
    },
    [addNode, nodes.length]
  );

  const createVariableNode = useCallback(() => {
    const existingCount = nodes.length;
    const newNode: Node<ArduinoNodeData> = {
      id: `var-${Date.now()}`,
      type: 'variable',
      position: {
        x: 400 + (existingCount % 3) * 50,
        y: 100 + Math.floor(existingCount / 3) * 150,
      },
      data: {
        label: 'Variable',
        nodeType: 'variable',
        library: 'Arduino',
        functionName: '',
        inputs: [],
        outputs: [{ id: 'value', label: 'var', type: 'int' }],
        variableName: '',
        variableType: 'int',
        initialValue: '0',
        isGlobal: true,
      },
    };

    addNode(newNode);
  }, [addNode, nodes.length]);

  // Filter functions by search term
  const filteredCategories = Object.entries(functionsByCategory).reduce(
    (acc, [category, functions]) => {
      if (!searchTerm) {
        acc[category] = functions;
        return acc;
      }

      const filtered = functions.filter(
        (fn) =>
          fn.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          fn.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (filtered.length > 0) {
        acc[category] = filtered;
      }

      return acc;
    },
    {} as Record<string, FunctionWithLibrary[]>
  );

  return (
    <div className="w-64 bg-white border-r border-gray-100 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="text-gray-900 font-semibold">Arduino Node</span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-500 text-sm">flow</span>
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search..."
          className="w-full bg-white text-gray-900 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-400 focus:outline-none transition-colors"
        />
      </div>

      {/* Basic Nodes section */}
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-gray-500 text-xs font-medium mb-3">Basic Nodes</h3>
        <div className="space-y-2">
          <button
            onClick={createVariableNode}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all"
          >
            <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            Variable
          </button>
        </div>
      </div>

      {/* Libraries section */}
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-gray-500 text-xs font-medium mb-3">Libraries</h3>
        <div className="space-y-1.5">
          {libraries.map((lib) => (
            <label
              key={lib.name}
              className="flex items-center text-sm text-gray-600 cursor-pointer hover:text-gray-900 transition-colors"
            >
              <input
                type="checkbox"
                checked={activeLibraries.includes(lib.name)}
                onChange={() => toggleLibrary(lib.name)}
                disabled={lib.isCore}
                className="mr-2.5 w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-400"
              />
              {lib.displayName}
              {lib.isCore && (
                <span className="text-gray-400 text-xs ml-1">(core)</span>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Functions list */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-gray-500 text-xs font-medium mb-3">Functions</h3>
        {Object.entries(filteredCategories).map(([category, functions]) => (
          <div key={category} className="mb-3">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center gap-2 py-2 text-gray-700 text-sm font-medium transition-colors"
            >
              <svg 
                className={`w-4 h-4 text-gray-400 transition-transform ${expandedCategories.has(category) ? 'rotate-90' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {category}
            </button>

            {expandedCategories.has(category) && (
              <div className="ml-2 mt-1 space-y-1">
                {functions.map((fn, index) => (
                  <button
                    key={`${fn.name}-${index}`}
                    onClick={() => createFunctionNode(fn)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:text-gray-900 transition-all group"
                    title={fn.description}
                  >
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    <span className="flex-1 text-left truncate">
                      {fn.isMethod ? `${fn.className}.` : ''}
                      {fn.name}()
                    </span>
                    <span className="text-xs text-gray-400 group-hover:text-gray-500">
                      {fn.returnType}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {Object.keys(filteredCategories).length === 0 && (
          <div className="text-gray-400 text-sm text-center py-8">
            No functions found
          </div>
        )}
      </div>
    </div>
  );
}
