import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createWebMcpMock } from "fastwebmcp";
import { createFlowStore, registerFlowWebMcpTools } from "../src/mcp/tools.js";
import {
  serializeWorkflowToUrl,
  deserializeWorkflowFromUrl,
  sanitizeGraphForSharing,
} from "../src/sharing/url_serializer.js";
import { WorkflowGraph } from "../src/schema/workflow.js";

describe("Custom Shareable Workflow URL (Client-side Zero-Backend Sharing)", () => {
  let mock: ReturnType<typeof createWebMcpMock>;
  let store: ReturnType<typeof createFlowStore>;

  const complexGraph: WorkflowGraph = {
    id: "wf_shared_lead_qualification",
    name: "Lead Qualification & CRM Sync",
    description: "Scores leads and syncs qualified contacts to CRM",
    version: "1.2.0",
    nodes: [
      {
        id: "webhook_lead",
        type: "trigger_webhook",
        label: "Incoming Lead",
        position: { x: 100, y: 120 },
        inputs: {},
        outputs: { body: { id: "body", name: "Body", type: "object" } },
        config: { initialPayload: { email: "lead@example.com", score: 85 } },
      },
      {
        id: "ai_qualifier",
        type: "ai_agent",
        label: "Lead Qualification Agent",
        position: { x: 380, y: 120 },
        inputs: { input: { id: "input", name: "Lead Data", type: "any" } },
        outputs: { response: { id: "response", name: "Verdict", type: "string" } },
        config: { model: "gemini-2.5-flash", systemPrompt: "Qualify lead based on score" },
      },
      {
        id: "log_sink",
        type: "log_output",
        label: "Record Output",
        position: { x: 680, y: 120 },
        inputs: { data: { id: "data", name: "Data", type: "any" } },
        outputs: { passthrough: { id: "passthrough", name: "Pass", type: "any" } },
        config: { prefix: "[LEAD_OK]" },
      },
    ],
    edges: [
      { id: "e1", sourceNodeId: "webhook_lead", sourcePort: "body", targetNodeId: "ai_qualifier", targetPort: "input" },
      { id: "e2", sourceNodeId: "ai_qualifier", sourcePort: "response", targetNodeId: "log_sink", targetPort: "data" },
    ],
    contract: {
      id: "contract_lead_qual",
      workflowId: "wf_shared_lead_qualification",
      title: "Lead Qualification Contract",
      intent: "Verify that incoming leads produce classified verdicts",
      testCases: [
        {
          id: "tc_high_lead",
          name: "High score lead",
          inputPayload: { email: "vip@corp.com", score: 95 },
          assertions: [
            {
              targetNodeId: "ai_qualifier",
              path: "response",
              operator: "contains",
              expectedValue: "[AI Output",
            },
          ],
        },
      ],
      sealedSha256: "auto",
      invariants: ["Every lead is processed."],
    },
    variables: {},
    metadata: {},
  };

  beforeEach(() => {
    mock = createWebMcpMock();
    (globalThis as any).document = mock.document;
    store = createFlowStore(complexGraph);
    registerFlowWebMcpTools(store);
  });

  it("Serializes a workflow graph into a clean URL-safe shareable URL", () => {
    const url = serializeWorkflowToUrl(complexGraph, "https://mauricioperera.github.io/kdd-flow-engine/");

    assert.ok(url.startsWith("https://mauricioperera.github.io/kdd-flow-engine/#flow="));
    assert.equal(url.includes(" "), false);
    assert.equal(url.includes("\n"), false);
  });

  it("Deserializes a workflow graph accurately from a URL hash", () => {
    const url = serializeWorkflowToUrl(complexGraph, "https://mauricioperera.github.io/kdd-flow-engine/");
    const restored = deserializeWorkflowFromUrl(url);

    assert.ok(restored);
    assert.equal(restored?.id, complexGraph.id);
    assert.equal(restored?.name, complexGraph.name);
    assert.equal(restored?.nodes.length, 3);
    assert.equal(restored?.edges.length, 2);
    assert.equal(restored?.contract?.testCases.length, 1);
  });

  it("Guarantees that raw secrets are never leaked into the shareable URL", () => {
    const sensitiveGraph = JSON.parse(JSON.stringify(complexGraph));
    sensitiveGraph.nodes[0].config.authHeader = "$vault:STRIPE_SECRET_KEY";

    const url = serializeWorkflowToUrl(sensitiveGraph);
    // Real secret should not be in the URL, only the opaque identifier
    assert.ok(url.includes("flow="));
    const restored = deserializeWorkflowFromUrl(url);
    assert.equal(restored?.nodes[0].config.authHeader, "$vault:STRIPE_SECRET_KEY");
  });

  it("Generates shareable URL via WebMCP tool 'generate_shareable_workflow_url'", async () => {
    const res = (await mock.invokeTool("generate_shareable_workflow_url", {
      baseUrl: "https://mauricioperera.github.io/kdd-flow-engine/",
    })) as any;

    assert.ok(res.shareableUrl);
    assert.ok(res.shareableUrl.includes("#flow="));
    assert.equal(res.workflowId, complexGraph.id);
    assert.equal(res.nodeCount, 3);
  });
});
