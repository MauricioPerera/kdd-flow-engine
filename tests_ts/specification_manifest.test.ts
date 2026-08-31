import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createWebMcpMock } from "fastwebmcp";
import { createFlowStore, registerFlowWebMcpTools } from "../src/mcp/tools.js";
import { buildWorkflowSpecificationManifest } from "../src/schema/specification_manifest.js";
import { WorkflowGraph } from "../src/schema/workflow.js";

describe("Universal AI Specification Manifest (Language-Agnostic IR)", () => {
  let mock: ReturnType<typeof createWebMcpMock>;
  let store: ReturnType<typeof createFlowStore>;

  const orderFlowGraph: WorkflowGraph = {
    id: "wf_order_fulfillment",
    name: "E-Commerce Order Fulfillment",
    description: "Validates payment with Stripe, analyzes fraud risk, and notifies logistics",
    version: "1.0.0",
    nodes: [
      {
        id: "webhook_order",
        type: "trigger_webhook",
        label: "Incoming Order Webhook",
        position: { x: 0, y: 0 },
        inputs: {},
        outputs: { body: { id: "body", name: "Body", type: "object" } },
        config: {},
      },
      {
        id: "stripe_charge",
        type: "dynamic_stripe_charge",
        label: "Stripe: Charge Card",
        position: { x: 250, y: 0 },
        inputs: {
          amount: { id: "amount", name: "Amount", type: "number", required: true },
          currency: { id: "currency", name: "Currency", type: "string", required: true },
        },
        outputs: {
          charge_id: { id: "charge_id", name: "Charge ID", type: "string" },
          status: { id: "status", name: "Status", type: "string" },
        },
        config: {
          endpointUrl: "https://api.stripe.com/v1/charges",
          method: "POST",
        },
        dynamicDef: {
          typeId: "dynamic_stripe_charge",
          label: "Stripe: Charge Card",
          category: "api",
          description: "Charges a credit card via Stripe API",
          endpoint: {
            url: "https://api.stripe.com/v1/charges",
            method: "POST",
            authType: "bearer",
            authSecretPlaceholder: "STRIPE_SECRET_KEY",
          },
          inputs: {
            amount: { id: "amount", name: "Amount", type: "number", required: true },
            currency: { id: "currency", name: "Currency", type: "string", required: true },
          },
          outputs: {
            charge_id: { id: "charge_id", name: "Charge ID", type: "string" },
            status: { id: "status", name: "Status", type: "string" },
          },
          defaultConfig: {},
        },
      },
      {
        id: "log_fulfillment",
        type: "log_output",
        label: "Log Fulfillment",
        position: { x: 500, y: 0 },
        inputs: { data: { id: "data", name: "Data", type: "any" } },
        outputs: { passthrough: { id: "passthrough", name: "Passthrough", type: "any" } },
        config: { prefix: "[FULFILLMENT_OK]" },
      },
    ],
    edges: [
      { id: "e1", sourceNodeId: "webhook_order", sourcePort: "body", targetNodeId: "stripe_charge", targetPort: "amount" },
      { id: "e2", sourceNodeId: "stripe_charge", sourcePort: "charge_id", targetNodeId: "log_fulfillment", targetPort: "data" },
    ],
    contract: {
      id: "contract_order_fulfillment",
      workflowId: "wf_order_fulfillment",
      title: "Order Fulfillment Contract",
      intent: "Verify that valid orders create a Stripe charge and log fulfillment",
      testCases: [
        {
          id: "tc_standard_order",
          name: "Standard $99 order",
          inputPayload: { amount: 9900, currency: "usd" },
          assertions: [
            {
              targetNodeId: "stripe_charge",
              path: "status",
              operator: "equals",
              expectedValue: 200,
              description: "Charge returns 200 OK",
            },
          ],
        },
      ],
      sealedSha256: "auto",
      invariants: ["Every incoming order triggers a charge."],
    },
    variables: {},
    metadata: {},
  };

  beforeEach(() => {
    mock = createWebMcpMock();
    (globalThis as any).document = mock.document;
    store = createFlowStore(orderFlowGraph);
    registerFlowWebMcpTools(store);
  });

  it("Builds a complete, language-agnostic specification manifest", () => {
    const manifest = buildWorkflowSpecificationManifest(orderFlowGraph, "Rust with Tokio");

    assert.equal(manifest.specificationVersion, "kdd-spec-v1.0");
    assert.equal(manifest.workflowId, "wf_order_fulfillment");
    assert.equal(manifest.topologicalOrder.length, 3);
    assert.equal(manifest.semanticExecutionSteps.length, 3);

    // Verify step 2: dynamic Stripe charge details
    const stripeStep = manifest.semanticExecutionSteps[1];
    assert.equal(stripeStep.nodeId, "stripe_charge");
    assert.ok(stripeStep.dynamicApiDetails);
    assert.equal(stripeStep.dynamicApiDetails?.httpMethod, "POST");
    assert.equal(stripeStep.dynamicApiDetails?.endpointUrl, "https://api.stripe.com/v1/charges");
    assert.equal(stripeStep.dynamicApiDetails?.authSecretReference, "$vault:STRIPE_SECRET_KEY");

    // Verify required secrets
    assert.ok(manifest.requiredEnvironmentSecrets.some((s) => s.key === "STRIPE_SECRET_KEY"));

    // Verify frozen test cases
    assert.equal(manifest.frozenTestCases.length, 1);
    assert.equal(manifest.frozenTestCases[0].assertions[0].path, "status");

    // Verify code gen instructions
    assert.ok(manifest.aiCodeGenerationInstructions.includes("TARGET LANGUAGE: Rust with Tokio"));
  });

  it("Exposes get_complete_workflow_specification tool via WebMCP for AI Agents", async () => {
    const res = (await mock.invokeTool("get_complete_workflow_specification", {
      targetLanguageHint: "Elixir with Broadway",
    })) as any;

    assert.equal(res.workflowId, "wf_order_fulfillment");
    assert.ok(res.semanticExecutionSteps);
    assert.ok(res.aiCodeGenerationInstructions.includes("TARGET LANGUAGE: Elixir with Broadway"));
  });
});
