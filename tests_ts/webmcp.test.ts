import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createWebMcpMock } from "fastwebmcp";
import { createFlowStore, registerFlowWebMcpTools } from "../src/mcp/tools.js";

describe("fastwebmcp Workflow Tools Integration", () => {
  let mock: ReturnType<typeof createWebMcpMock>;
  let store: ReturnType<typeof createFlowStore>;

  beforeEach(() => {
    mock = createWebMcpMock();
    (globalThis as any).document = mock.document;
    store = createFlowStore();
    registerFlowWebMcpTools(store);
  });

  it("adds nodes and connects them via WebMCP tool calls", async () => {
    // 1. Reset workflow
    const createRes = (await mock.invokeTool("create_workflow", {
      id: "wf_agent_test",
      name: "Agent Created Flow",
      description: "Flow built by AI Agent via WebMCP",
    })) as any;
    assert.equal(createRes.success, true);
    assert.equal(store.getGraph().nodes.length, 0);

    // 2. Add trigger node
    const addTriggerRes = (await mock.invokeTool("add_node", {
      id: "trig1",
      type: "trigger_webhook",
      label: "Webhook In",
      x: 50,
      y: 50,
    })) as any;
    assert.equal(addTriggerRes.success, true);

    // 3. Add AI Agent node
    const addAgentRes = (await mock.invokeTool("add_node", {
      id: "agent1",
      type: "ai_agent",
      label: "Support Agent",
      x: 300,
      y: 50,
      config: { model: "gemini-2.5-flash" },
    })) as any;
    assert.equal(addAgentRes.success, true);

    // 4. Connect them
    const connectRes = (await mock.invokeTool("connect_nodes", {
      sourceNodeId: "trig1",
      sourcePort: "body",
      targetNodeId: "agent1",
      targetPort: "input",
    })) as any;
    assert.equal(connectRes.success, true);
    assert.equal(connectRes.validDag, true);

    // 5. Get workflow graph
    const graphRes = (await mock.invokeTool("get_workflow_graph", {})) as any;
    assert.equal(graphRes.nodeCount, 2);
    assert.equal(graphRes.edgeCount, 1);
    assert.equal(graphRes.validation.valid, true);

    // 6. Simulate execution
    const simRes = (await mock.invokeTool("simulate_execution", {
      initialPayload: { ticket: "Need help with API" },
    })) as any;
    assert.equal(simRes.status, "completed");
    assert.equal(simRes.logs.length, 2);

    // 7. Export code
    const codeRes = (await mock.invokeTool("export_code", {
      targetLanguage: "typescript",
    })) as any;
    assert.equal(codeRes.language, "typescript");
    assert.ok(codeRes.sourceCode.includes("run_Agent_Created_Flow"));
  });
});
