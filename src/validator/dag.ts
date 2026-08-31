import { WorkflowGraph, WorkflowNode, WorkflowEdge } from "../schema/workflow.js";

export interface ValidationError {
  code: string;
  message: string;
  nodeId?: string;
  edgeId?: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  topologicalOrder: string[];
}

export function validateDAG(graph: WorkflowGraph): ValidationResult {
  const errors: ValidationError[] = [];
  const nodeMap = new Map<string, WorkflowNode>();
  const edgeMap = new Map<string, WorkflowEdge>();

  // 1. Check duplicate and validate nodes
  for (const node of graph.nodes) {
    if (nodeMap.has(node.id)) {
      errors.push({
        code: "DUPLICATE_NODE_ID",
        message: `Duplicate node ID detected: ${node.id}`,
        nodeId: node.id,
        severity: "error",
      });
    } else {
      nodeMap.set(node.id, node);
    }
  }

  // 2. Check edges integrity
  const adjacency = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const node of graph.nodes) {
    adjacency.set(node.id, []);
    inDegree.set(node.id, 0);
  }

  for (const edge of graph.edges) {
    if (edgeMap.has(edge.id)) {
      errors.push({
        code: "DUPLICATE_EDGE_ID",
        message: `Duplicate edge ID detected: ${edge.id}`,
        edgeId: edge.id,
        severity: "error",
      });
      continue;
    }
    edgeMap.set(edge.id, edge);

    const sourceNode = nodeMap.get(edge.sourceNodeId);
    const targetNode = nodeMap.get(edge.targetNodeId);

    if (!sourceNode) {
      errors.push({
        code: "MISSING_SOURCE_NODE",
        message: `Edge ${edge.id} references non-existing source node ${edge.sourceNodeId}`,
        edgeId: edge.id,
        severity: "error",
      });
      continue;
    }
    if (!targetNode) {
      errors.push({
        code: "MISSING_TARGET_NODE",
        message: `Edge ${edge.id} references non-existing target node ${edge.targetNodeId}`,
        edgeId: edge.id,
        severity: "error",
      });
      continue;
    }

    if (edge.sourceNodeId === edge.targetNodeId) {
      errors.push({
        code: "SELF_CYCLE",
        message: `Self-loop detected on node ${edge.sourceNodeId}`,
        nodeId: edge.sourceNodeId,
        edgeId: edge.id,
        severity: "error",
      });
    }

    // Type compatibility check if ports defined
    const sourcePort = sourceNode.outputs?.[edge.sourcePort];
    const targetPort = targetNode.inputs?.[edge.targetPort];
    if (sourcePort && targetPort) {
      if (
        sourcePort.type !== "any" &&
        targetPort.type !== "any" &&
        sourcePort.type !== targetPort.type
      ) {
        errors.push({
          code: "TYPE_MISMATCH",
          message: `Port type mismatch on edge ${edge.id}: ${sourceNode.label}.${sourcePort.name} (${sourcePort.type}) -> ${targetNode.label}.${targetPort.name} (${targetPort.type})`,
          edgeId: edge.id,
          severity: "warning",
        });
      }
    }

    adjacency.get(edge.sourceNodeId)!.push(edge.targetNodeId);
    inDegree.set(edge.targetNodeId, (inDegree.get(edge.targetNodeId) || 0) + 1);
  }

  // 3. Cycle Detection using DFS & Topological Sort (Kahn's algorithm)
  const topologicalOrder: string[] = [];
  const queue: string[] = [];
  const currentInDegrees = new Map<string, number>(inDegree);

  for (const [nodeId, degree] of currentInDegrees.entries()) {
    if (degree === 0) {
      queue.push(nodeId);
    }
  }

  while (queue.length > 0) {
    const u = queue.shift()!;
    topologicalOrder.push(u);

    for (const v of adjacency.get(u) || []) {
      const updated = (currentInDegrees.get(v) || 0) - 1;
      currentInDegrees.set(v, updated);
      if (updated === 0) {
        queue.push(v);
      }
    }
  }

  if (topologicalOrder.length < graph.nodes.length) {
    // There is a cycle
    const cyclicNodes = graph.nodes
      .filter((n) => (currentInDegrees.get(n.id) || 0) > 0)
      .map((n) => n.id);

    errors.push({
      code: "CYCLIC_DEPENDENCY",
      message: `Cycle detected in workflow involving nodes: ${cyclicNodes.join(", ")}`,
      severity: "error",
    });
  }

  const hasFatalErrors = errors.some((e) => e.severity === "error");

  return {
    valid: !hasFatalErrors,
    errors,
    topologicalOrder: hasFatalErrors ? [] : topologicalOrder,
  };
}
