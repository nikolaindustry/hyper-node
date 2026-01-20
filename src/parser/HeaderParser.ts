import {
  type Library,
  type FunctionDef,
  type ClassDef,
  type ConstantDef,
  type ArduinoType,
  type FunctionParameter,
} from '../models/types';

// Type mapping from C++ to Arduino types
const TYPE_MAP: Record<string, ArduinoType> = {
  void: 'void',
  int: 'int',
  long: 'long',
  float: 'float',
  double: 'double',
  bool: 'bool',
  boolean: 'boolean',
  byte: 'byte',
  char: 'char',
  String: 'String',
  uint8_t: 'uint8_t',
  uint16_t: 'uint16_t',
  uint32_t: 'uint32_t',
  'unsigned long': 'unsigned long',
  'unsigned int': 'uint16_t',
  'unsigned char': 'uint8_t',
  size_t: 'uint32_t',
  word: 'uint16_t',
};

export interface ParseResult {
  success: boolean;
  library?: Library;
  errors: string[];
  warnings: string[];
}

export function parseHeaderFile(
  content: string,
  fileName: string
): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Clean up the content
    let cleanContent = removeComments(content);

    // Extract library name from filename
    const libraryName = fileName.replace(/\.h$/i, '');

    // Parse different elements
    const constants = parseConstants(cleanContent);
    const functions = parseFunctions(cleanContent, warnings);
    const classes = parseClasses(cleanContent, warnings);

    const library: Library = {
      name: libraryName,
      displayName: libraryName,
      includeStatement: `#include <${fileName}>`,
      isCore: false,
      category: 'Custom',
      constants,
      functions,
      classes,
    };

    return {
      success: true,
      library,
      errors,
      warnings,
    };
  } catch (error) {
    errors.push(`Failed to parse header: ${error}`);
    return {
      success: false,
      errors,
      warnings,
    };
  }
}

function removeComments(content: string): string {
  // Remove single-line comments
  let result = content.replace(/\/\/.*$/gm, '');

  // Remove multi-line comments
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');

  return result;
}

function parseConstants(content: string): ConstantDef[] {
  const constants: ConstantDef[] = [];

  // Match #define NAME VALUE
  const defineRegex = /#define\s+(\w+)\s+(.+?)(?:\n|$)/g;
  let match;

  while ((match = defineRegex.exec(content)) !== null) {
    const name = match[1];
    const value = match[2].trim();

    // Skip function-like macros
    if (name.includes('(')) continue;

    // Skip common header guards
    if (name.endsWith('_H') || name.endsWith('_H_')) continue;

    constants.push({
      name,
      value,
      type: inferType(value),
    });
  }

  // Match const declarations
  const constRegex = /const\s+(\w+)\s+(\w+)\s*=\s*([^;]+);/g;

  while ((match = constRegex.exec(content)) !== null) {
    const type = mapType(match[1]);
    const name = match[2];
    const value = match[3].trim();

    constants.push({
      name,
      value,
      type,
    });
  }

  return constants;
}

function parseFunctions(content: string, warnings: string[]): FunctionDef[] {
  const functions: FunctionDef[] = [];

  // Match function declarations
  // Pattern: returnType functionName(params);
  const funcRegex =
    /^\s*(?:static\s+)?(?:inline\s+)?(?:virtual\s+)?(\w+(?:\s+\w+)?(?:\s*\*)?)\s+(\w+)\s*\(([^)]*)\)\s*(?:const)?\s*;/gm;

  let match;
  while ((match = funcRegex.exec(content)) !== null) {
    const returnType = mapType(match[1].trim());
    const name = match[2];
    const paramsStr = match[3].trim();

    // Skip constructors/destructors (they start with ~ or match class name)
    if (name.startsWith('~')) continue;
    // Skip operators
    if (name.startsWith('operator')) continue;

    const parameters = parseParameters(paramsStr, warnings);

    functions.push({
      name,
      returnType,
      parameters,
      category: 'Functions',
    });
  }

  return functions;
}

function parseClasses(content: string, warnings: string[]): ClassDef[] {
  const classes: ClassDef[] = [];

  // Match class declarations
  const classRegex = /class\s+(\w+)(?:\s*:\s*(?:public|private|protected)\s+\w+)?\s*\{([\s\S]*?)\};/g;

  let match;
  while ((match = classRegex.exec(content)) !== null) {
    const className = match[1];
    const classBody = match[2];

    const methods: FunctionDef[] = [];
    const constructors: FunctionDef[] = [];

    // Find public section
    const publicSection = extractPublicSection(classBody);

    // Parse methods in public section
    const methodRegex =
      /(?:virtual\s+)?(\w+(?:\s+\w+)?(?:\s*\*)?)\s+(\w+)\s*\(([^)]*)\)\s*(?:const)?\s*;/g;

    let methodMatch;
    while ((methodMatch = methodRegex.exec(publicSection)) !== null) {
      const returnType = mapType(methodMatch[1].trim());
      const methodName = methodMatch[2];
      const paramsStr = methodMatch[3].trim();

      // Skip destructors
      if (methodName.startsWith('~')) continue;
      // Skip operators
      if (methodName.startsWith('operator')) continue;

      const parameters = parseParameters(paramsStr, warnings);

      // Check if constructor
      if (methodName === className) {
        constructors.push({
          name: className,
          returnType: 'void',
          parameters,
          isMethod: false,
          className,
          category: className,
        });
      } else {
        methods.push({
          name: methodName,
          returnType,
          parameters,
          isMethod: true,
          className,
          category: className,
        });
      }
    }

    if (methods.length > 0 || constructors.length > 0) {
      classes.push({
        name: className,
        methods,
        constructors,
      });
    }
  }

  return classes;
}

function extractPublicSection(classBody: string): string {
  // Look for public: section
  const publicMatch = classBody.match(/public\s*:([\s\S]*?)(?:private\s*:|protected\s*:|$)/);
  if (publicMatch) {
    return publicMatch[1];
  }

  // If no explicit sections, assume everything is public (for structs)
  return classBody;
}

function parseParameters(
  paramsStr: string,
  warnings: string[]
): FunctionParameter[] {
  if (!paramsStr || paramsStr === 'void') {
    return [];
  }

  const params: FunctionParameter[] = [];
  const paramParts = paramsStr.split(',');

  for (const part of paramParts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Parse parameter: type name = defaultValue
    const paramMatch = trimmed.match(
      /^(\w+(?:\s+\w+)?(?:\s*\*|\s*&)?)\s+(\w+)(?:\s*=\s*(.+))?$/
    );

    if (paramMatch) {
      const type = mapType(paramMatch[1].trim());
      const name = paramMatch[2];
      const defaultValue = paramMatch[3]?.trim();

      params.push({
        name,
        type,
        defaultValue,
      });
    } else {
      // Try simpler match (just type)
      const simpleMatch = trimmed.match(/^(\w+(?:\s+\w+)?(?:\s*\*|\s*&)?)$/);
      if (simpleMatch) {
        params.push({
          name: `arg${params.length}`,
          type: mapType(simpleMatch[1].trim()),
        });
      } else {
        warnings.push(`Could not parse parameter: ${trimmed}`);
      }
    }
  }

  return params;
}

function mapType(cppType: string): ArduinoType {
  // Remove pointer/reference markers for lookup
  const cleanType = cppType.replace(/[*&]/g, '').trim();

  // Check direct mapping
  if (TYPE_MAP[cleanType]) {
    return TYPE_MAP[cleanType];
  }

  // Handle pointers
  if (cppType.includes('*')) {
    if (cleanType === 'char') return 'char*';
    if (cleanType === 'int') return 'int*';
    return 'any';
  }

  // Default to any for unknown types
  return 'any';
}

function inferType(value: string): ArduinoType {
  // String literal
  if (value.startsWith('"')) return 'String';

  // Character literal
  if (value.startsWith("'")) return 'char';

  // Boolean
  if (value === 'true' || value === 'false') return 'bool';

  // Floating point
  if (value.includes('.')) return 'float';

  // Hex number
  if (value.startsWith('0x')) return 'int';

  // Regular number
  if (/^\d+$/.test(value)) return 'int';

  // Default
  return 'int';
}

// Validate parsed library
export function validateLibrary(library: Library): string[] {
  const errors: string[] = [];

  if (!library.name) {
    errors.push('Library name is required');
  }

  if (library.functions.length === 0 && library.classes.length === 0) {
    errors.push('No functions or classes found in header');
  }

  return errors;
}
