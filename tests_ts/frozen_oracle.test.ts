import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createWebMcpMock } from "fastwebmcp";
import { createFlowStore, registerFlowWebMcpTools } from "../src/mcp/tools.js";
import {
  runFrozenOracleGate,
  computeContractSha256,
  generateKddContractMarkdown,
} from "../src/oracle/evaluator.js";
import { WorkflowGraph, WorkflowContract } from "../src/schema/workflow.js";

describe("KDD Frozen Test Oracles & Workflow Acceptance Gate", () => {
  let mock: ReturnType<typeof createWebMcpMock>;
  let store: ReturnType<typeof createFlowStore>;

  const paymentGraph: WorkflowGraph = {
    id: "wf_payment_fraud_check",
    name: "Payment Ingestion & Fraud Gate",
    description: "Evaluates incoming payments against risk rules",
    version: "1.0.0",
    nodes: [
      {
        id: "webhook_in",
        type: "trigger_webhook",
        label: "Incoming Order",
        position: { x: 0, y: 0 },
        inputs: {},
        outputs: { body: { id: "body", name: "Body", type: "object" } },
        config: {},
      },
      {
        id: "script_eval",
        type: "code_script",
        label: "Risk Evaluator",
        position: { x: 200, y: 0 },
        inputs: { input: { id: "input", name: "Input", type: "any" } },
        outputs: { output: { id: "output", name: "Output", type: "any" } },
        config: {
          code: `
            const amt = Number(input.amount || 0);
            if (amt <= 0) return { status: "REJECTED", reason: "INVALID_AMOUNT", riskScore: 0 };
            if (amt > 10000) return { status: "FLAGGED_FRAUD", reason: "HIGH_TICKET", riskScore: 0.95 };
            return { status: "APPROVED", reason: "CLEAN", riskScore: 0.05 };
          `,
        },
      },
      {
        id: "data_out",
        type: "data_transform",
        label: "Payload Formatter",
        position: { x: 400, y: 0 },
        inputs: { input: { id: "input", name: "Input", type: "any" } },
        outputs: { output: { id: "output", name: "Output", type: "any" } },
        config: {
          mappings: {
            decision: "input.status",
            risk: "input.riskScore",
            processed: "true",
          },
        },
      },
    ],
    edges: [
      { id: "e1", sourceNodeId: "webhook_in", sourcePort: "body", targetNodeId: "script_eval", targetPort: "input" },
      { id: "e2", sourceNodeId: "script_eval", sourcePort: "output", targetNodeId: "data_out", targetPort: "input" },
    ],
    variables: {},
    metadata: {},
  };

  const frozenContract: WorkflowContract = {
    id: "contract_payment_fraud",
    workflowId: "wf_payment_fraud_check",
    title: "Payment Fraud Rules Acceptance Contract",
    intent: "Ensure all clean payments pass and high-risk payments are flagged",
    testCases: [
      {
        id: "tc_clean_payment",
        name: "Standard $50 payment approval",
        inputPayload: { amount: 50, user: "usr_100" },
        assertions: [
          {
            targetNodeId: "script_eval",
            path: "output.status",
            operator: "equals",
            expectedValue: "APPROVED",
            description: "Status must be APPROVED",
          },
          {
            targetNodeId: "data_out",
            path: "output.risk",
            operator: "less_than",
            expectedValue: 0.1,
            description: "Risk score must be below 0.1",
          },
        ],
      },
      {
        id: "tc_high_risk_payment",
        name: "High ticket $15,000 payment fraud flag",
        inputPayload: { amount: 15000, user: "usr_200" },
        assertions: [
          {
            targetNodeId: "script_eval",
            path: "output.status",
            operator: "equals",
            expectedValue: "FLAGGED_FRAUD",
            description: "Must be FLAGGED_FRAUD",
          },
          {
            targetNodeId: "script_eval",
            path: "output.riskScore",
            operator: "greater_than",
            expectedValue: 0.9,
            description: "Risk score must exceed 0.9",
          },
        ],
      },
      {
        id: "tc_invalid_zero_payment",
        name: "Zero amount rejection",
        inputPayload: { amount: 0, user: "usr_300" },
        assertions: [
          {
            targetNodeId: "script_eval",
            path: "output.status",
            operator: "equals",
            expectedValue: "REJECTED",
            description: "Must be REJECTED",
          },
        ],
      },
    ],
    invariants: [
      "Payments > 10000 are always flagged as fraud",
      "Payments <= 0 are rejected with INVALID_AMOUNT",
    ],
  };

  beforeEach(() => {
    frozenContract.sealedSha256 = computeContractSha256(frozenContract.testCases);
    paymentGraph.contract = frozenContract;

    mock = createWebMcpMock();
    (globalThis as any).document = mock.document;
    store = createFlowStore(paymentGraph);
    registerFlowWebMcpTools(store);
  });

  it("Executes and passes all frozen oracle test cases via KDD Gate", async () => {
    const verdict = await runFrozenOracleGate(paymentGraph);

    assert.equal(verdict.passed, true);
    assert.equal(verdict.totalTestCases, 3);
    assert.equal(verdict.passedTestCases, 3);
    assert.equal(verdict.failedTestCases, 0);
    assert.equal(verdict.hashMatch, true);
    assert.ok(verdict.verdictSummary.includes("KDD GATE PASS"));
  });

  it("Rejects changes deterministically when an invariant assertion fails", async () => {
    // Introduce a breaking regression into the node logic
    const brokenGraph = JSON.parse(JSON.stringify(paymentGraph));
    brokenGraph.nodes[1].config.code = `return { status: "APPROVED", riskScore: 0.01 };`; // Flawed logic that approves all fraud!

    const verdict = await runFrozenOracleGate(brokenGraph);

    assert.equal(verdict.passed, false);
    assert.equal(verdict.failedTestCases >= 1, true);
    assert.ok(verdict.verdictSummary.includes("KDD GATE REJECTED"));

    const fraudTestCase = verdict.testCaseResults.find((tc) => tc.testCaseId === "tc_high_risk_payment");
    assert.equal(fraudTestCase?.passed, false);
    assert.ok(fraudTestCase?.assertionResults.some((a) => !a.passed));
  });

  it("Detects cryptographic hash drift if test cases are modified without resealing", async () => {
    const tamperedGraph = JSON.parse(JSON.stringify(paymentGraph));
    // Tamper with test case without recomputing sealedSha256
    tamperedGraph.contract.testCases[0].name = "Tampered title";

    const verdict = await runFrozenOracleGate(tamperedGraph);
    assert.equal(verdict.hashMatch, false);
    assert.equal(verdict.passed, false);
    assert.ok(verdict.verdictSummary.includes("Oracle hash drift detected"));
  });

  it("Exports compliant KDD Contract markdown with frozen oracle seal", async () => {
    const exportRes = (await mock.invokeTool("export_kdd_workflow_contract", {})) as any;
    assert.ok(exportRes.contractMarkdown.includes("task: wf_contract_wf_payment_fraud_check"));
    assert.ok(exportRes.contractMarkdown.includes("tests_sha256:"));
    assert.ok(exportRes.contractMarkdown.includes("## Invariants"));
    assert.ok(exportRes.contractMarkdown.includes("PARAR y reportar si"));
    assert.equal(exportRes.sha256, frozenContract.sealedSha256);
  });
});
