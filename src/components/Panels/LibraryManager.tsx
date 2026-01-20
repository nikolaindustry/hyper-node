import { useState, useCallback, useRef } from 'react';
import { useLibraryStore } from '../../store/useLibraryStore';
import { parseHeaderFile, type ParseResult } from '../../parser/HeaderParser';

export default function LibraryManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const libraries = useLibraryStore((state) => state.libraries);
  const addLibrary = useLibraryStore((state) => state.addLibrary);
  const removeLibrary = useLibraryStore((state) => state.removeLibrary);
  const activeLibraries = useLibraryStore((state) => state.activeLibraries);
  const toggleLibrary = useLibraryStore((state) => state.toggleLibrary);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsLoading(true);
      setParseResult(null);

      try {
        const content = await file.text();
        const result = parseHeaderFile(content, file.name);
        setParseResult(result);

        if (result.success && result.library) {
          addLibrary(result.library);
        }
      } catch (error) {
        setParseResult({
          success: false,
          errors: [`Failed to read file: ${error}`],
          warnings: [],
        });
      } finally {
        setIsLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [addLibrary]
  );

  const handleRemoveLibrary = useCallback(
    (name: string) => {
      if (confirm(`Remove library "${name}"?`)) {
        removeLibrary(name);
      }
    },
    [removeLibrary]
  );

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors z-50"
      >
        Manage Libraries
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-white font-bold text-xl">Library Manager</h2>
          <button
            onClick={() => {
              setIsOpen(false);
              setParseResult(null);
            }}
            className="text-gray-400 hover:text-white text-2xl"
          >
            x
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Upload section */}
          <div className="mb-6">
            <h3 className="text-white font-semibold mb-3">
              Import Arduino Library
            </h3>
            <p className="text-gray-400 text-sm mb-3">
              Upload a .h header file to parse and import library functions as
              nodes.
            </p>
            <div className="flex gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".h,.hpp"
                onChange={handleFileUpload}
                className="hidden"
                id="header-upload"
              />
              <label
                htmlFor="header-upload"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded cursor-pointer transition-colors"
              >
                {isLoading ? 'Parsing...' : 'Upload .h File'}
              </label>
            </div>

            {/* Parse result */}
            {parseResult && (
              <div className="mt-4">
                {parseResult.success ? (
                  <div className="bg-green-900/30 border border-green-700 rounded p-3">
                    <p className="text-green-400 font-medium">
                      Successfully imported: {parseResult.library?.name}
                    </p>
                    <p className="text-green-400/70 text-sm mt-1">
                      {parseResult.library?.functions.length || 0} functions,{' '}
                      {parseResult.library?.classes.length || 0} classes,{' '}
                      {parseResult.library?.constants.length || 0} constants
                    </p>
                    {parseResult.warnings.length > 0 && (
                      <div className="mt-2">
                        <p className="text-yellow-400 text-sm">Warnings:</p>
                        <ul className="text-yellow-400/70 text-xs mt-1">
                          {parseResult.warnings.map((w, i) => (
                            <li key={i}>- {w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-red-900/30 border border-red-700 rounded p-3">
                    <p className="text-red-400 font-medium">Parse failed</p>
                    <ul className="text-red-400/70 text-sm mt-1">
                      {parseResult.errors.map((e, i) => (
                        <li key={i}>- {e}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Installed libraries */}
          <div>
            <h3 className="text-white font-semibold mb-3">
              Installed Libraries
            </h3>
            <div className="space-y-2">
              {libraries.map((lib) => (
                <div
                  key={lib.name}
                  className="bg-gray-700 rounded p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={activeLibraries.includes(lib.name)}
                      onChange={() => toggleLibrary(lib.name)}
                      disabled={lib.isCore}
                      className="w-4 h-4"
                    />
                    <div>
                      <p className="text-white font-medium">
                        {lib.displayName}
                        {lib.isCore && (
                          <span className="text-gray-500 text-xs ml-2">
                            (core)
                          </span>
                        )}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {lib.functions.length} functions,{' '}
                        {lib.classes.reduce(
                          (acc, c) => acc + c.methods.length,
                          0
                        )}{' '}
                        methods
                      </p>
                    </div>
                  </div>
                  {!lib.isCore && (
                    <button
                      onClick={() => handleRemoveLibrary(lib.name)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Library details */}
          <div className="mt-6">
            <h3 className="text-white font-semibold mb-3">Library Details</h3>
            {libraries
              .filter((lib) => activeLibraries.includes(lib.name))
              .map((lib) => (
                <div key={lib.name} className="mb-4">
                  <h4 className="text-gray-300 font-medium mb-2">
                    {lib.displayName}
                  </h4>
                  <div className="bg-gray-900 rounded p-3 max-h-40 overflow-y-auto">
                    <p className="text-gray-400 text-xs font-mono">
                      {lib.includeStatement || '// Core library'}
                    </p>
                    <div className="mt-2 text-xs text-gray-500">
                      {lib.functions.slice(0, 5).map((fn) => (
                        <div key={fn.name}>
                          {fn.returnType} {fn.name}(
                          {fn.parameters.map((p) => p.type).join(', ')})
                        </div>
                      ))}
                      {lib.functions.length > 5 && (
                        <div>... and {lib.functions.length - 5} more</div>
                      )}
                      {lib.classes.map((cls) => (
                        <div key={cls.name} className="mt-1">
                          class {cls.name}: {cls.methods.length} methods
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex justify-end">
          <button
            onClick={() => {
              setIsOpen(false);
              setParseResult(null);
            }}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
