import { type Node, type Edge } from '@xyflow/react';
import { type ArduinoNodeData } from '../models/types';

interface GeneratorContext {
  nodes: Node<ArduinoNodeData>[];
  edges: Edge[];
  includes: Set<string>;
  globalVariables: string[];
  setupCode: string[];
  loopCode: string[];
  nodeOutputs: Map<string, string>; // Maps node:output to variable/expression
}

export function generateArduinoCode(
  nodes: Node<ArduinoNodeData>[],
  edges: Edge[]
): string {
  const context: GeneratorContext = {
    nodes,
    edges,
    includes: new Set(),
    globalVariables: [],
    setupCode: [],
    loopCode: [],
    nodeOutputs: new Map(),
  };

  // Process variable nodes first (for global declarations)
  processVariableNodes(context);

  // Get nodes connected to setup (via execution flow)
  const setupNode = nodes.find((n) => n.data.nodeType === 'setup');
  const loopNode = nodes.find((n) => n.data.nodeType === 'loop');

  if (setupNode) {
    const setupChildren = getConnectedNodes(context, setupNode.id, 'exec-out');
    const orderedSetup = topologicalSort(context, setupChildren);
    orderedSetup.forEach((nodeId) => {
      const code = generateNodeCode(context, nodeId);
      if (code) context.setupCode.push(code);
    });
  }

  if (loopNode) {
    const loopChildren = getConnectedNodes(context, loopNode.id, 'exec-out');
    const orderedLoop = topologicalSort(context, loopChildren);
    orderedLoop.forEach((nodeId) => {
      const code = generateNodeCode(context, nodeId);
      if (code) context.loopCode.push(code);
    });
  }

  // Also process any function nodes not connected to setup/loop
  // (standalone nodes that might feed into connected nodes)
  nodes
    .filter(
      (n) =>
        n.data.nodeType === 'function' &&
        !context.setupCode.some((c) => c.includes(n.id)) &&
        !context.loopCode.some((c) => c.includes(n.id))
    )
    .forEach((node) => {
      // Check if this node has any outgoing data connections
      const hasDataOutput = edges.some(
        (e) => e.source === node.id && e.sourceHandle !== 'exec-out'
      );
      if (hasDataOutput) {
        // This node's output is used somewhere, pre-compute it
        const expr = buildExpression(context, node);
        context.nodeOutputs.set(`${node.id}:output`, expr);
      }
    });

  return assembleCode(context);
}

function processVariableNodes(context: GeneratorContext): void {
  const { nodes } = context;

  nodes
    .filter((n) => n.data.nodeType === 'variable')
    .forEach((node) => {
      const { variableName, variableType, initialValue, isGlobal } = node.data;

      if (!variableName) return;

      const declaration = initialValue
        ? `${variableType} ${variableName} = ${initialValue};`
        : `${variableType} ${variableName};`;

      if (isGlobal !== false) {
        context.globalVariables.push(declaration);
      }

      // Store reference for connections
      context.nodeOutputs.set(`${node.id}:value`, variableName);
    });
}

function getConnectedNodes(
  context: GeneratorContext,
  sourceId: string,
  sourceHandle: string
): string[] {
  const { edges, nodes } = context;
  const connected: string[] = [];

  // Find edges from this source
  edges
    .filter((e) => e.source === sourceId && e.sourceHandle === sourceHandle)
    .forEach((edge) => {
      connected.push(edge.target);
      // Recursively get nodes connected via exec flow
      const targetNode = nodes.find((n) => n.id === edge.target);
      if (targetNode?.data.nodeType === 'function') {
        // Check if this function has exec output
        const execEdges = edges.filter(
          (e) => e.source === edge.target && e.sourceHandle === 'exec-out'
        );
        execEdges.forEach((e) => {
          connected.push(...getConnectedNodes(context, e.source, 'exec-out'));
        });
      }
    });

  return [...new Set(connected)];
}

function topologicalSort(
  context: GeneratorContext,
  nodeIds: string[]
): string[] {
  const { edges } = context;
  const visited = new Set<string>();
  const result: string[] = [];

  function visit(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    // Visit dependencies first (data inputs)
    edges
      .filter((e) => e.target === nodeId && e.targetHandle !== 'exec-in')
      .forEach((edge) => {
        if (nodeIds.includes(edge.source)) {
          visit(edge.source);
        }
      });

    result.push(nodeId);
  }

  nodeIds.forEach((id) => visit(id));
  return result;
}

function generateNodeCode(
  context: GeneratorContext,
  nodeId: string
): string | null {
  const { nodes } = context;
  const node = nodes.find((n) => n.id === nodeId);

  if (!node) return null;

  if (node.data.nodeType === 'function') {
    return generateFunctionCall(context, node);
  }

  if (node.data.nodeType === 'variable' && node.data.isGlobal === false) {
    // Local variable declaration
    const { variableName, variableType, initialValue } = node.data;
    if (!variableName) return null;
    return initialValue
      ? `${variableType} ${variableName} = ${initialValue};`
      : `${variableType} ${variableName};`;
  }

  return null;
}

function generateFunctionCall(
  context: GeneratorContext,
  node: Node<ArduinoNodeData>
): string {
  const { edges, nodes } = context;
  const { functionName, inputs, includeStatement } = node.data;

  // Track includes - use the includeStatement from node data if available
  if (includeStatement) {
    context.includes.add(includeStatement);
  }

  // Build arguments
  const args = inputs.map((input) => {
    // Check if this input is connected
    const edge = edges.find(
      (e) => e.target === node.id && e.targetHandle === input.id
    );

    if (edge) {
      // Get value from connected node
      const sourceNode = nodes.find((n) => n.id === edge.source);
      if (sourceNode) {
        // Check if we have a cached output
        const cachedOutput = context.nodeOutputs.get(
          `${edge.source}:${edge.sourceHandle ?? ''}`
        );
        if (cachedOutput) {
          return cachedOutput;
        }

        // Build expression from source node
        const expr = buildExpression(context, sourceNode);
        return expr;
      }
    }

    // Use input value or default
    return input.value || getDefaultValue(input.type);
  });

  // Handle method calls (e.g., Serial.println)
  const call = `${functionName}(${args.join(', ')});`;

  // If this function has a return value and is connected to something, assign it
  if (node.data.outputs.length > 0) {
    const hasConsumer = edges.some(
      (e) => e.source === node.id && e.sourceHandle === 'output'
    );
    if (hasConsumer) {
      // Store the expression for later use
      const expr = `${functionName}(${args.join(', ')})`;
      context.nodeOutputs.set(`${node.id}:output`, expr);
    }
  }

  return call;
}

function buildExpression(
  context: GeneratorContext,
  node: Node<ArduinoNodeData>
): string {
  if (node.data.nodeType === 'variable') {
    return node.data.variableName || '0';
  }

  if (node.data.nodeType === 'function') {
    const { functionName, inputs, includeStatement } = node.data;
    const { edges, nodes } = context;

    // Track includes for functions used as data sources
    if (includeStatement) {
      context.includes.add(includeStatement);
    }

    const args = inputs.map((input) => {
      const edge = edges.find(
        (e) => e.target === node.id && e.targetHandle === input.id
      );

      if (edge) {
        const sourceNode = nodes.find((n) => n.id === edge.source);
        if (sourceNode) {
          return buildExpression(context, sourceNode);
        }
      }

      return input.value || getDefaultValue(input.type);
    });

    return `${functionName}(${args.join(', ')})`;
  }

  return '0';
}

function getDefaultValue(type: string): string {
  switch (type) {
    case 'String':
      return '""';
    case 'bool':
    case 'boolean':
      return 'false';
    case 'float':
    case 'double':
      return '0.0';
    case 'char':
      return "'\\0'";
    default:
      return '0';
  }
}

function assembleCode(context: GeneratorContext): string {
  const lines: string[] = [];

  // Header comment
  lines.push('// Generated by Arduino Node Editor');
  lines.push('// https://hyper-node.dev');
  lines.push('');

  // Includes
  if (context.includes.size > 0) {
    context.includes.forEach((inc) => lines.push(inc));
    lines.push('');
  }

  // Global variables
  if (context.globalVariables.length > 0) {
    lines.push('// Global variables');
    context.globalVariables.forEach((v) => lines.push(v));
    lines.push('');
  }

  // Setup function
  lines.push('void setup() {');
  if (context.setupCode.length > 0) {
    context.setupCode.forEach((code) => lines.push(`  ${code}`));
  } else {
    lines.push('  // Add setup code here');
  }
  lines.push('}');
  lines.push('');

  // Loop function
  lines.push('void loop() {');
  if (context.loopCode.length > 0) {
    context.loopCode.forEach((code) => lines.push(`  ${code}`));
  } else {
    lines.push('  // Add loop code here');
  }
  lines.push('}');

  return lines.join('\n');
}

// Export for testing
export type { GeneratorContext };
