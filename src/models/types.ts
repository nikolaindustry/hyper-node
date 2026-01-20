// Arduino type system
export type ArduinoType =
  | 'void'
  | 'int'
  | 'long'
  | 'float'
  | 'double'
  | 'bool'
  | 'boolean'
  | 'byte'
  | 'char'
  | 'String'
  | 'uint8_t'
  | 'uint16_t'
  | 'uint32_t'
  | 'unsigned long'
  | 'int*'
  | 'char*'
  | 'any'; // For flexible connections

// Node types
export type NodeType = 'function' | 'variable' | 'control' | 'setup' | 'loop' | 'comment';

// Control flow types
export type ControlFlowType = 'if' | 'for' | 'while';

// Port definitions
export interface NodePort {
  id: string;
  label: string;
  type: ArduinoType;
  value?: string;
  connected?: boolean;
}

// Function parameter definition
export interface FunctionParameter {
  name: string;
  type: ArduinoType;
  defaultValue?: string;
}

// Function definition from library
export interface FunctionDef {
  name: string;
  returnType: ArduinoType;
  parameters: FunctionParameter[];
  description?: string;
  isMethod?: boolean;
  className?: string;
  category?: string;
}

// Class definition from library
export interface ClassDef {
  name: string;
  methods: FunctionDef[];
  constructors: FunctionDef[];
  description?: string;
}

// Constant definition
export interface ConstantDef {
  name: string;
  value: string;
  type?: ArduinoType;
}

// Library definition
export interface Library {
  name: string;
  displayName: string;
  includeStatement: string;
  isCore: boolean;
  category: string;
  functions: FunctionDef[];
  classes: ClassDef[];
  constants: ConstantDef[];
}

// Arduino node data stored in React Flow node
export interface ArduinoNodeData extends Record<string, unknown> {
  label: string;
  nodeType: NodeType;
  library: string;
  functionName: string;
  inputs: NodePort[];
  outputs: NodePort[];
  // Include statement for this node's library (auto-generated in code)
  includeStatement?: string;
  // For variable nodes
  variableName?: string;
  variableType?: ArduinoType;
  initialValue?: string;
  isGlobal?: boolean;
  // For control flow nodes
  controlType?: ControlFlowType;
  condition?: string;
  // For comment nodes
  comment?: string;
  // Container tracking (which setup/loop this belongs to)
  containerId?: string;
}

// Type compatibility rules
export const TYPE_COMPATIBILITY: Record<ArduinoType, ArduinoType[]> = {
  'void': [],
  'int': ['int', 'byte', 'uint8_t', 'bool', 'boolean', 'char'],
  'long': ['long', 'int', 'byte', 'uint8_t', 'uint16_t', 'bool', 'boolean', 'char'],
  'float': ['float', 'int', 'long', 'byte', 'uint8_t', 'uint16_t', 'uint32_t'],
  'double': ['double', 'float', 'int', 'long', 'byte', 'uint8_t', 'uint16_t', 'uint32_t'],
  'bool': ['bool', 'boolean', 'int', 'byte'],
  'boolean': ['boolean', 'bool', 'int', 'byte'],
  'byte': ['byte', 'uint8_t', 'char'],
  'char': ['char', 'byte', 'uint8_t'],
  'String': ['String', 'char*'],
  'uint8_t': ['uint8_t', 'byte', 'char'],
  'uint16_t': ['uint16_t', 'int'],
  'uint32_t': ['uint32_t', 'long', 'unsigned long'],
  'unsigned long': ['unsigned long', 'uint32_t', 'long'],
  'int*': ['int*'],
  'char*': ['char*', 'String'],
  'any': ['void', 'int', 'long', 'float', 'double', 'bool', 'boolean', 'byte', 'char', 'String', 'uint8_t', 'uint16_t', 'uint32_t', 'unsigned long', 'int*', 'char*', 'any'],
};

// Check if source type can connect to target type
export function isTypeCompatible(sourceType: ArduinoType, targetType: ArduinoType): boolean {
  if (targetType === 'any' || sourceType === 'any') return true;
  return TYPE_COMPATIBILITY[targetType]?.includes(sourceType) ?? false;
}

// Get color for Arduino type (for UI)
export const TYPE_COLORS: Record<ArduinoType, string> = {
  'void': '#6b7280',
  'int': '#3b82f6',
  'long': '#2563eb',
  'float': '#f59e0b',
  'double': '#d97706',
  'bool': '#ec4899',
  'boolean': '#ec4899',
  'byte': '#8b5cf6',
  'char': '#06b6d4',
  'String': '#10b981',
  'uint8_t': '#8b5cf6',
  'uint16_t': '#7c3aed',
  'uint32_t': '#6d28d9',
  'unsigned long': '#4f46e5',
  'int*': '#64748b',
  'char*': '#14b8a6',
  'any': '#9ca3af',
};
