import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { createWebMcpMock } from "fastwebmcp";
import { createFlowStore, registerFlowWebMcpTools } from "../src/mcp/tools.js";
import { synthesizeNodeFromApiDoc, DynamicNodeRegistry } from "../src/nodes/dynamic.js";
import { generatePolyglotCode } from "../src/generator/polyglot.js";

describe("Dynamic Node Synthesis from API Docs (Stripe / Custom APIs)", () => {
  let mock: ReturnType<typeof createWebMcpMock>;
  let store: ReturnType<typeof createFlowStore>;

  beforeEach(() => {
    mock = createWebMcpMock();
    (globalThis as any).document = mock.document;
    store = createFlowStore();
    registerFlowWebMcpTools(store);
  });

  it("Synthesizes a dynamic Stripe Charge node from API documentation via WebMCP", async () => {
    // 1. Agent calls generate_node_from_api_doc with Stripe documentation
    const synthRes = (await mock.invokeTool("generate_node_from_api_doc", {
      serviceName: "stripe",
      operationName: "create_charge",
      description: "Creates a new credit card charge via Stripe API",
      endpointUrl: "https://api.stripe.com/v1/charges",
      method: "POST",
      authType: "bearer",
      authSecretPlaceholder: "STRIPE_SECRET_KEY",
      rawDocOrCurl: `
        curl https://api.stripe.com/v1/charges \\
          -u sk_test_123456789: \\
          -d amount=2000 \\
          -d currency=usd \\
          -d source=tok_visa \\
          -d description="Charge for customer@example.com"
      `,
      detectedFields: [
        { name: "amount", type: "number", required: true, description: "Amount in cents (e.g. 2000 for $20.00)" },
        { name: "currency", type: "string", required: true, description: "3-letter ISO currency code" },
        { name: "source", type: "string", required: false, description: "Payment source token" },
        { name: "description", type: "string", required: false, description: "Arbitrary charge description" },
      ],
      detectedOutputs: [
        { name: "charge_id", type: "string", description: "Unique identifier for the charge" },
        { name: "status", type: "string", description: "Charge status: succeeded, pending, or failed" },
      ],
    })) as any;

    assert.equal(synthRes.success, true);
    assert.equal(synthRes.typeId, "dynamic_stripe_create_charge");
    assert.ok(synthRes.inputPorts.includes("amount"));
    assert.ok(synthRes.inputPorts.includes("currency"));
    assert.ok(synthRes.outputPorts.includes("charge_id"));

    // 2. Add the dynamic Stripe node to the workflow
    await mock.invokeTool("create_workflow", {
      id: "wf_stripe_payment_flow",
      name: "Stripe Payment Gateway",
      description: "Payment processing flow using dynamically synthesized Stripe node",
    });

    await mock.invokeTool("add_node", {
      id: "webhook_order",
      type: "trigger_webhook",
      label: "Order Webhook",
      config: { initialPayload: { amount: 5000, currency: "usd", description: "Order #8821" } },
    });

    await mock.invokeTool("add_node", {
      id: "stripe_charge_node",
      type: "dynamic_stripe_create_charge",
      label: "Stripe: Create Charge",
      x: 350,
      y: 150,
    });

    await mock.invokeTool("add_node", {
      id: "log_receipt",
      type: "log_output",
      label: "Log Receipt",
      x: 700,
      y: 150,
    });

    // 3. Connect nodes
    await mock.invokeTool("connect_nodes", {
      sourceNodeId: "webhook_order",
      sourcePort: "body",
      targetNodeId: "stripe_charge_node",
      targetPort: "payload",
    });

    await mock.invokeTool("connect_nodes", {
      sourceNodeId: "stripe_charge_node",
      sourcePort: "response",
      targetNodeId: "log_receipt",
      targetPort: "data",
    });

    // 4. Validate graph
    const graphRes = (await mock.invokeTool("get_workflow_graph", {})) as any;
    assert.equal(graphRes.nodeCount, 3);
    assert.equal(graphRes.validation.valid, true);

    // 5. Simulate execution
    const simRes = (await mock.invokeTool("simulate_execution", {
      initialPayload: { amount: 5000, currency: "usd", description: "Order #8821" },
    })) as any;
    assert.equal(simRes.status, "completed");
    assert.equal(simRes.logs.length, 3);

    const stripeLog = simRes.logs.find((l: any) => l.nodeId === "stripe_charge_node");
    assert.equal(stripeLog.status, "success");
    assert.equal(stripeLog.outputs?.status, 200);

    // 6. Polyglot code generation & execution verification
    const graph = store.getGraph();
    const tsCode = generatePolyglotCode(graph, "typescript");
    assert.ok(tsCode.sourceCode.includes("Dynamic API Call: Stripe: Create Charge"));
    assert.ok(tsCode.sourceCode.includes("https://api.stripe.com/v1/charges"));

    const pyCode = generatePolyglotCode(graph, "python");
    assert.ok(pyCode.sourceCode.includes("Dynamic API Call: Stripe: Create Charge"));
    assert.ok(pyCode.sourceCode.includes("https://api.stripe.com/v1/charges"));

    // 7. Verify real binary execution with Node.js
    const scratchDir = path.resolve("./dist/scratch_e2e");
    fs.mkdirSync(scratchDir, { recursive: true });

    const tsFile = path.join(scratchDir, "workflow_stripe.ts");
    const runnerFile = path.join(scratchDir, "runner_stripe.ts");
    fs.writeFileSync(tsFile, tsCode.sourceCode, "utf8");

    const runner = `
      import { run_Stripe_Payment_Gateway } from "./workflow_stripe.ts";
      const res = await run_Stripe_Payment_Gateway({ amount: 5000, currency: "usd" });
      console.log("STRIPE_E2E_OK:", res.workflowId, res.results["stripe_charge_node"]?.status);
    `;
    fs.writeFileSync(runnerFile, runner, "utf8");

    const tsExec = execSync(`node --experimental-strip-types "${runnerFile}"`, { encoding: "utf8" });
    assert.ok(tsExec.includes("STRIPE_E2E_OK:"));
    assert.ok(tsExec.includes("wf_stripe_payment_flow 200"));
  });
});
