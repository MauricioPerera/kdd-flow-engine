import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { CredentialVault } from "../src/vault/vault.js";
import { createWebMcpMock } from "fastwebmcp";
import { createFlowStore, registerFlowWebMcpTools } from "../src/mcp/tools.js";
import { WorkflowEngine } from "../src/runtime/engine.js";
import { WorkflowGraph } from "../src/schema/workflow.js";

describe("Zero-Knowledge Local Credential Vault", () => {
  let vault: CredentialVault;
  let mock: ReturnType<typeof createWebMcpMock>;
  let store: ReturnType<typeof createFlowStore>;

  beforeEach(() => {
    vault = CredentialVault.getInstance();
    vault.setSecret("STRIPE_SECRET_KEY", "sk_test_secret_stripe_99999", "Stripe Secret Key");
    vault.setSecret("OPENAI_API_KEY", "sk-proj-supersecret-openai-token", "OpenAI API Token");

    mock = createWebMcpMock();
    (globalThis as any).document = mock.document;
    store = createFlowStore();
    registerFlowWebMcpTools(store);
  });

  it("Guarantees Zero-Knowledge exposure to AI Agents via WebMCP", async () => {
    const listRes = (await mock.invokeTool("list_vault_secret_keys", {})) as any;
    assert.equal(listRes.totalKeys >= 2, true);

    const stripeKey = listRes.configuredKeys.find((k: any) => k.key === "STRIPE_SECRET_KEY");
    assert.ok(stripeKey);
    assert.equal(stripeKey.isSet, true);
    assert.equal(stripeKey.description, "Stripe Secret Key");

    // Strictly verify that raw secret values are NEVER present anywhere in the returned payload
    const payloadStr = JSON.stringify(listRes);
    assert.equal(payloadStr.includes("sk_test_secret_stripe_99999"), false);
    assert.equal(payloadStr.includes("sk-proj-supersecret-openai-token"), false);
  });

  it("Resolves secrets at the execution boundary without leaking them into logs", async () => {
    const graph: WorkflowGraph = {
      id: "wf_vault_test",
      name: "Vault Test Flow",
      nodes: [
        {
          id: "trig",
          type: "trigger_manual",
          label: "Start",
          position: { x: 0, y: 0 },
          inputs: {},
          outputs: { payload: { id: "payload", name: "Payload", type: "object" } },
          config: { initialPayload: { authHeader: "Bearer $vault:STRIPE_SECRET_KEY" } },
        },
        {
          id: "http_call",
          type: "http_request",
          label: "Authenticated Call",
          position: { x: 200, y: 0 },
          inputs: { body: { id: "body", name: "Body", type: "any" } },
          outputs: { response: { id: "response", name: "Response", type: "any" } },
          config: { url: "https://api.stripe.com/v1/customers", method: "POST" },
        },
      ],
      edges: [
        { id: "e1", sourceNodeId: "trig", sourcePort: "payload", targetNodeId: "http_call", targetPort: "body" },
      ],
    };

    const engine = new WorkflowEngine();
    const result = await engine.execute(graph, { authHeader: "Bearer $vault:STRIPE_SECRET_KEY" });

    assert.equal(result.status, "completed");

    // The logs returned to the agent/client must redact the real secret
    const logsStr = JSON.stringify(result.logs);
    assert.equal(logsStr.includes("sk_test_secret_stripe_99999"), false);
  });

  it("Exports valid local .env configuration", () => {
    const dotEnv = vault.exportDotEnv();
    assert.ok(dotEnv.includes("STRIPE_SECRET_KEY=sk_test_secret_stripe_99999"));
    assert.ok(dotEnv.includes("OPENAI_API_KEY=sk-proj-supersecret-openai-token"));
    assert.ok(dotEnv.includes("# Stripe Secret Key"));
  });
});
