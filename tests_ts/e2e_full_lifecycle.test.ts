import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createWebMcpMock } from "fastwebmcp";
import { createFlowStore, registerFlowWebMcpTools } from "../src/mcp/tools.js";

describe("E2E Test Suite: Full Agentic Lifecycle via fastwebmcp", () => {
  let mock: ReturnType<typeof createWebMcpMock>;
  let store: ReturnType<typeof createFlowStore>;

  beforeEach(() => {
    mock = createWebMcpMock();
    (globalThis as any).document = mock.document;
    store = createFlowStore();
    registerFlowWebMcpTools(store);
  });

  it("Scenario 1: Complex Multi-Branch AI Customer Support Pipeline", async () => {
    // 1. Agent initializes workflow
    const initRes = (await mock.invokeTool("create_workflow", {
      id: "wf_support_routing",
      name: "Enterprise Support Automation",
      description: "AI triage, routing and escalation pipeline",
    })) as any;
    assert.equal(initRes.success, true);

    // 2. Agent adds Trigger Node
    await mock.invokeTool("add_node", {
      id: "webhook_in",
      type: "trigger_webhook",
      label: "Support Ticket Webhook",
      x: 50,
      y: 150,
      config: { path: "/api/tickets", method: "POST" },
    });

    // 3. Agent adds AI Router Node
    await mock.invokeTool("add_node", {
      id: "intent_router",
      type: "ai_router",
      label: "Ticket Classifier",
      x: 350,
      y: 150,
      config: {
        routes: ["billing", "technical", "urgent_escalation"],
        model: "gemini-2.5-pro",
      },
    });

    // 4. Agent adds Condition Branch Node
    await mock.invokeTool("add_node", {
      id: "priority_check",
      type: "condition_branch",
      label: "Is Urgent?",
      x: 650,
      y: 150,
      config: {
        expression: "value.confidence > 0.8 || value.route === 'urgent_escalation'",
      },
    });

    // 5. Agent adds AI Escalation Agent Node
    await mock.invokeTool("add_node", {
      id: "ai_resolver",
      type: "ai_agent",
      label: "Executive Resolution Agent",
      x: 950,
      y: 80,
      config: {
        model: "claude-3-7-sonnet",
        systemPrompt: "You are an executive tier-3 support agent.",
        userPromptTemplate: "Priority incident: {{input}}",
      },
    });

    // 6. Agent adds HTTP Dispatch Action Node
    await mock.invokeTool("add_node", {
      id: "notify_slack",
      type: "http_request",
      label: "Slack Alert Dispatcher",
      x: 1250,
      y: 80,
      config: {
        url: "https://hooks.slack.com/services/T00/B00/X00",
        method: "POST",
      },
    });

    // 7. Agent connects the entire pipeline graph
    await mock.invokeTool("connect_nodes", {
      sourceNodeId: "webhook_in",
      sourcePort: "body",
      targetNodeId: "intent_router",
      targetPort: "input",
    });

    await mock.invokeTool("connect_nodes", {
      sourceNodeId: "intent_router",
      sourcePort: "route",
      targetNodeId: "priority_check",
      targetPort: "value",
    });

    await mock.invokeTool("connect_nodes", {
      sourceNodeId: "priority_check",
      sourcePort: "true_branch",
      targetNodeId: "ai_resolver",
      targetPort: "input",
    });

    await mock.invokeTool("connect_nodes", {
      sourceNodeId: "ai_resolver",
      sourcePort: "response",
      targetNodeId: "notify_slack",
      targetPort: "body",
    });

    // 8. Verify Graph Integrity via WebMCP
    const graphRes = (await mock.invokeTool("get_workflow_graph", {})) as any;
    assert.equal(graphRes.nodeCount, 5);
    assert.equal(graphRes.edgeCount, 4);
    assert.equal(graphRes.validation.valid, true);
    assert.deepEqual(graphRes.validation.topologicalOrder, [
      "webhook_in",
      "intent_router",
      "priority_check",
      "ai_resolver",
      "notify_slack",
    ]);

    // 9. Execute end-to-end Simulation
    const simRes = (await mock.invokeTool("simulate_execution", {
      initialPayload: {
        ticketId: "TCK-9901",
        customer: "Acme Corp",
        issue: "Production database down - urgent_escalation needed immediately",
      },
    })) as any;

    assert.equal(simRes.status, "completed");
    assert.equal(simRes.logs.length, 5);
    for (const log of simRes.logs) {
      assert.equal(log.status, "success");
    }

    // Assert Slack notification received AI response
    const slackLog = simRes.logs.find((l: any) => l.nodeId === "notify_slack");
    assert.equal(slackLog.outputs?.status, 200);

    // 10. Synthesize polyglot implementations
    const tsCode = (await mock.invokeTool("export_code", { targetLanguage: "typescript" })) as any;
    assert.ok(tsCode.sourceCode.includes("run_Enterprise_Support_Automation"));
    assert.ok(tsCode.testCode.includes("Enterprise Support Automation"));

    const pyCode = (await mock.invokeTool("export_code", { targetLanguage: "python" })) as any;
    assert.ok(pyCode.sourceCode.includes("run_Enterprise_Support_Automation"));
    assert.ok(pyCode.testCode.includes("TestWorkflowwf_support_routing"));
  });

  it("Scenario 2: Data Extraction, Script Transformation & Formatting Pipeline", async () => {
    // 1. Initialize
    await mock.invokeTool("create_workflow", {
      id: "wf_data_extractor",
      name: "Document Data Extractor",
      description: "Extract and clean JSON data from raw text",
    });

    // 2. Add nodes
    await mock.invokeTool("add_node", {
      id: "manual_trigger",
      type: "trigger_manual",
      label: "Raw Text Input",
      config: { initialPayload: { rawDoc: "Invoice #1234. Amount: $450.00. Vendor: TechCorp." } },
    });

    await mock.invokeTool("add_node", {
      id: "extractor",
      type: "ai_extractor",
      label: "AI Invoice Extractor",
    });

    await mock.invokeTool("add_node", {
      id: "normalizer",
      type: "code_script",
      label: "Data Normalizer",
      config: {
        code: `
          return {
            invoiceId: "INV-1234",
            amountFormatted: 450,
            vendorName: "TechCorp",
            processed: true
          };
        `,
      },
    });

    await mock.invokeTool("add_node", {
      id: "transformer",
      type: "data_transform",
      label: "Schema Transformer",
      config: {
        mappings: {
          id: "input.invoiceId",
          total: "input.amountFormatted",
          status: "'APPROVED'",
        },
      },
    });

    // 3. Connect
    await mock.invokeTool("connect_nodes", { sourceNodeId: "manual_trigger", sourcePort: "payload", targetNodeId: "extractor", targetPort: "text" });
    await mock.invokeTool("connect_nodes", { sourceNodeId: "extractor", sourcePort: "data", targetNodeId: "normalizer", targetPort: "input" });
    await mock.invokeTool("connect_nodes", { sourceNodeId: "normalizer", sourcePort: "output", targetNodeId: "transformer", targetPort: "input" });

    // 4. Simulate
    const simRes = (await mock.invokeTool("simulate_execution", {})) as any;
    assert.equal(simRes.status, "completed");
    assert.equal(simRes.logs.length, 4);

    const transformLog = simRes.logs.find((l: any) => l.nodeId === "transformer");
    assert.equal(transformLog.outputs?.output?.id, "INV-1234");
    assert.equal(transformLog.outputs?.output?.total, 450);
    assert.equal(transformLog.outputs?.output?.status, "APPROVED");
  });
});
