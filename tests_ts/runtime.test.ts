import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { WorkflowEngine } from "../src/runtime/engine.js";
import { WorkflowGraph } from "../src/schema/workflow.js";

describe("Workflow Engine Runtime", () => {
  it("executes an end-to-end workflow successfully", async () => {
    const graph: WorkflowGraph = {
      id: "wf_test_1",
      name: "Test Flow",
      description: "Testing runtime execution",
      version: "1.0.0",
      nodes: [
        {
          id: "t1",
          type: "trigger_manual",
          label: "Start",
          position: { x: 0, y: 0 },
          inputs: {},
          outputs: { payload: { id: "payload", name: "Payload", type: "object" } },
          config: { initialPayload: { message: "Hello world" } },
        },
        {
          id: "c1",
          type: "code_script",
          label: "Upper Script",
          position: { x: 100, y: 0 },
          inputs: { input: { id: "input", name: "Input", type: "any" } },
          outputs: { output: { id: "output", name: "Output", type: "any" } },
          config: { code: "return { upper: String(input.message).toUpperCase() };" },
        },
        {
          id: "a1",
          type: "ai_agent",
          label: "AI Processor",
          position: { x: 200, y: 0 },
          inputs: { input: { id: "input", name: "Input", type: "any" } },
          outputs: { response: { id: "response", name: "Response", type: "string" } },
          config: { model: "gemini-2.5-flash", userPromptTemplate: "Summary: {{input}}" },
        },
      ],
      edges: [
        { id: "e1", sourceNodeId: "t1", sourcePort: "payload", targetNodeId: "c1", targetPort: "input" },
        { id: "e2", sourceNodeId: "c1", sourcePort: "output", targetNodeId: "a1", targetPort: "input" },
      ],
      variables: {},
      metadata: {},
    };

    const engine = new WorkflowEngine();
    const result = await engine.execute(graph, { message: "antigravity kdd" });

    assert.equal(result.status, "completed");
    assert.equal(result.logs.length, 3);
    assert.equal(result.logs[0].status, "success");
    assert.equal(result.logs[1].status, "success");
    assert.equal(result.logs[2].status, "success");

    // Check script output uppercase transformation
    assert.equal(result.logs[1].outputs?.output?.upper, "ANTIGRAVITY KDD");
    assert.ok(result.logs[2].outputs?.response.includes("[AI Processed]"));
  });

  it("handles runtime errors gracefully", async () => {
    const graph: WorkflowGraph = {
      id: "wf_err",
      name: "Error Flow",
      description: "",
      version: "1.0.0",
      nodes: [
        {
          id: "t1",
          type: "trigger_manual",
          label: "Start",
          position: { x: 0, y: 0 },
          inputs: {},
          outputs: {},
          config: {},
        },
        {
          id: "broken",
          type: "code_script",
          label: "Broken Script",
          position: { x: 100, y: 0 },
          inputs: { input: { id: "input", name: "Input", type: "any" } },
          outputs: {},
          config: { code: "throw new Error('Explosion');" },
        },
      ],
      edges: [
        { id: "e1", sourceNodeId: "t1", sourcePort: "payload", targetNodeId: "broken", targetPort: "input" },
      ],
      variables: {},
      metadata: {},
    };

    const engine = new WorkflowEngine();
    const result = await engine.execute(graph);

    assert.equal(result.status, "failed");
    assert.ok(result.error?.includes("Explosion"));
  });
});
