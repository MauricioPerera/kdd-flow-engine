import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateDAG } from "../src/validator/dag.js";
import { WorkflowEngine } from "../src/runtime/engine.js";
import { generatePolyglotCode } from "../src/generator/polyglot.js";
import { WorkflowGraph } from "../src/schema/workflow.js";

describe("E2E Test Suite: Error Resilience & Security Boundaries", () => {
  it("Rejects code generation on cyclic graphs and preserves invariants", () => {
    const cyclicGraph: WorkflowGraph = {
      id: "wf_cycle_e2e",
      name: "Cycle Flow",
      description: "",
      version: "1.0.0",
      nodes: [
        { id: "node1", type: "code_script", label: "Node 1", position: { x: 0, y: 0 }, inputs: {}, outputs: {}, config: {} },
        { id: "node2", type: "code_script", label: "Node 2", position: { x: 100, y: 0 }, inputs: {}, outputs: {}, config: {} },
      ],
      edges: [
        { id: "e1", sourceNodeId: "node1", sourcePort: "out", targetNodeId: "node2", targetPort: "in" },
        { id: "e2", sourceNodeId: "node2", sourcePort: "out", targetNodeId: "node1", targetPort: "in" },
      ],
    };

    const val = validateDAG(cyclicGraph);
    assert.equal(val.valid, false);

    assert.throws(
      () => generatePolyglotCode(cyclicGraph, "typescript"),
      /Cannot generate code for invalid workflow/
    );

    assert.throws(
      () => generatePolyglotCode(cyclicGraph, "python"),
      /Cannot generate code for invalid workflow/
    );
  });

  it("Recovers gracefully from script runtime exceptions without crashing the engine process", async () => {
    const brokenGraph: WorkflowGraph = {
      id: "wf_syntax_err",
      name: "Broken Logic",
      nodes: [
        { id: "trig", type: "trigger_manual", label: "Start", position: { x: 0, y: 0 }, inputs: {}, outputs: {}, config: {} },
        { id: "bad_node", type: "code_script", label: "Broken Eval", position: { x: 100, y: 0 }, inputs: {}, outputs: {}, config: { code: "throw new TypeError('Invalid property access');" } },
      ],
      edges: [
        { id: "e1", sourceNodeId: "trig", sourcePort: "payload", targetNodeId: "bad_node", targetPort: "input" },
      ],
    };

    const engine = new WorkflowEngine();
    const result = await engine.execute(brokenGraph);

    assert.equal(result.status, "failed");
    assert.ok(result.error?.includes("Invalid property access"));
    assert.equal(result.logs.length, 2);
    assert.equal(result.logs[1].status, "error");
  });

  it("Executes multiple disconnected subgraphs in deterministic order", async () => {
    const islandGraph: WorkflowGraph = {
      id: "wf_islands",
      name: "Parallel Pipelines",
      nodes: [
        { id: "a1", type: "trigger_manual", label: "Trigger A", position: { x: 0, y: 0 }, inputs: {}, outputs: {}, config: { initialPayload: { branch: "A" } } },
        { id: "a2", type: "log_output", label: "Log A", position: { x: 200, y: 0 }, inputs: {}, outputs: {}, config: {} },
        { id: "b1", type: "trigger_manual", label: "Trigger B", position: { x: 0, y: 150 }, inputs: {}, outputs: {}, config: { initialPayload: { branch: "B" } } },
        { id: "b2", type: "log_output", label: "Log B", position: { x: 200, y: 150 }, inputs: {}, outputs: {}, config: {} },
      ],
      edges: [
        { id: "ea", sourceNodeId: "a1", sourcePort: "payload", targetNodeId: "a2", targetPort: "data" },
        { id: "eb", sourceNodeId: "b1", sourcePort: "payload", targetNodeId: "b2", targetPort: "data" },
      ],
    };

    const val = validateDAG(islandGraph);
    assert.equal(val.valid, true);
    assert.equal(val.topologicalOrder.length, 4);

    const engine = new WorkflowEngine();
    const result = await engine.execute(islandGraph);
    assert.equal(result.status, "completed");
    assert.equal(result.logs.length, 4);
  });
});
