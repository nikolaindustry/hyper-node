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
    <div className="w-72 bg-gray-800 border-r border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-gray-700">
        <h2 className="text-white font-bold text-lg mb-2">Node Palette</h2>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search functions..."
          className="w-full bg-gray-700 text-white text-sm px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Library toggles */}
      <div className="p-3 border-b border-gray-700">
        <h3 className="text-gray-400 text-xs font-semibold mb-2 uppercase">
          Libraries
        </h3>
        <div className="space-y-1">
          {libraries.map((lib) => (
            <label
              key={lib.name}
              className="flex items-center text-sm text-gray-300 cursor-pointer hover:text-white"
            >
              <input
                type="checkbox"
                checked={activeLibraries.includes(lib.name)}
                onChange={() => toggleLibrary(lib.name)}
                disabled={lib.isCore}
                className="mr-2"
              />
              {lib.displayName}
              {lib.isCore && (
                <span className="text-gray-500 text-xs ml-1">(core)</span>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="p-3 border-b border-gray-700">
        <h3 className="text-gray-400 text-xs font-semibold mb-2 uppercase">
          Create
        </h3>
        <button
          onClick={createVariableNode}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white text-sm px-3 py-2 rounded transition-colors"
        >
          + Variable
        </button>
      </div>

      {/* Function list */}
      <div className="flex-1 overflow-y-auto p-2">
        {Object.entries(filteredCategories).map(([category, functions]) => (
          <div key={category} className="mb-2">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between px-2 py-1.5 text-gray-300 hover:bg-gray-700 rounded text-sm font-medium"
            >
              <span>{category}</span>
              <span className="text-gray-500">
                {expandedCategories.has(category) ? '−' : '+'}
              </span>
            </button>

            {expandedCategories.has(category) && (
              <div className="ml-2 mt-1 space-y-1">
                {functions.map((fn, index) => (
                  <button
                    key={`${fn.name}-${index}`}
                    onClick={() => createFunctionNode(fn)}
                    className="w-full text-left px-2 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors group"
                    title={fn.description}
                  >
                    <div className="flex items-center justify-between">
                      <span>
                        {fn.isMethod ? `${fn.className}.` : ''}
                        {fn.name}()
                      </span>
                      <span className="text-xs text-gray-600 group-hover:text-gray-400">
                        {fn.returnType}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {Object.keys(filteredCategories).length === 0 && (
          <div className="text-gray-500 text-sm text-center py-4">
            No functions found
          </div>
        )}
      </div>
    </div>
  );
}
