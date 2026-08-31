import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateDAG } from "../src/validator/dag.js";
import { WorkflowGraph } from "../src/schema/workflow.js";

describe("DAG Validator", () => {
  it("validates a simple linear DAG", () => {
    const graph: WorkflowGraph = {
      id: "w1",
      name: "Linear Flow",
      description: "",
      version: "1.0.0",
      nodes: [
        { id: "n1", type: "trigger_manual", label: "Start", position: { x: 0, y: 0 }, inputs: {}, outputs: {}, config: {} },
        { id: "n2", type: "ai_agent", label: "Agent", position: { x: 100, y: 0 }, inputs: {}, outputs: {}, config: {} },
        { id: "n3", type: "log_output", label: "End", position: { x: 200, y: 0 }, inputs: {}, outputs: {}, config: {} },
      ],
      edges: [
        { id: "e1", sourceNodeId: "n1", sourcePort: "payload", targetNodeId: "n2", targetPort: "input" },
        { id: "e2", sourceNodeId: "n2", sourcePort: "response", targetNodeId: "n3", targetPort: "data" },
      ],
      variables: {},
      metadata: {},
    };

    const res = validateDAG(graph);
    assert.equal(res.valid, true);
    assert.deepEqual(res.topologicalOrder, ["n1", "n2", "n3"]);
    assert.equal(res.errors.length, 0);
  });

  it("detects cyclic dependencies", () => {
    const graph: WorkflowGraph = {
      id: "w2",
      name: "Cyclic Flow",
      description: "",
      version: "1.0.0",
      nodes: [
        { id: "a", type: "code_script", label: "A", position: { x: 0, y: 0 }, inputs: {}, outputs: {}, config: {} },
        { id: "b", type: "code_script", label: "B", position: { x: 100, y: 0 }, inputs: {}, outputs: {}, config: {} },
      ],
      edges: [
        { id: "e1", sourceNodeId: "a", sourcePort: "out", targetNodeId: "b", targetPort: "in" },
        { id: "e2", sourceNodeId: "b", sourcePort: "out", targetNodeId: "a", targetPort: "in" },
      ],
      variables: {},
      metadata: {},
    };

    const res = validateDAG(graph);
    assert.equal(res.valid, false);
    assert.ok(res.errors.some((e) => e.code === "CYCLIC_DEPENDENCY"));
  });

  it("detects self cycles", () => {
    const graph: WorkflowGraph = {
      id: "w3",
      name: "Self Loop",
      description: "",
      version: "1.0.0",
      nodes: [
        { id: "a", type: "code_script", label: "A", position: { x: 0, y: 0 }, inputs: {}, outputs: {}, config: {} },
      ],
      edges: [
        { id: "e1", sourceNodeId: "a", sourcePort: "out", targetNodeId: "a", targetPort: "in" },
      ],
      variables: {},
      metadata: {},
    };

    const res = validateDAG(graph);
    assert.equal(res.valid, false);
    assert.ok(res.errors.some((e) => e.code === "SELF_CYCLE"));
  });

  it("detects missing source or target nodes", () => {
    const graph: WorkflowGraph = {
      id: "w4",
      name: "Dangling Edge",
      description: "",
      version: "1.0.0",
      nodes: [
        { id: "n1", type: "trigger_manual", label: "Start", position: { x: 0, y: 0 }, inputs: {}, outputs: {}, config: {} },
      ],
      edges: [
        { id: "e1", sourceNodeId: "n1", sourcePort: "payload", targetNodeId: "ghost_node", targetPort: "in" },
      ],
      variables: {},
      metadata: {},
    };

    const res = validateDAG(graph);
    assert.equal(res.valid, false);
    assert.ok(res.errors.some((e) => e.code === "MISSING_TARGET_NODE"));
  });
});
