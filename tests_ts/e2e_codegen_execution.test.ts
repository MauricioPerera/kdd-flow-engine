import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { generatePolyglotCode } from "../src/generator/polyglot.js";
import { WorkflowGraph } from "../src/schema/workflow.js";

describe("E2E Test Suite: Real Polyglot Code Synthesis & Binary Execution", () => {
  const e2eDir = path.resolve("./dist/scratch_e2e");
  const pyDir = path.resolve("./scratch_py_e2e");

  const sampleGraph: WorkflowGraph = {
    id: "e2e_payment_fraud",
    name: "Payment Fraud Detector",
    description: "Evaluates transactions and alerts security",
    version: "1.0.0",
    nodes: [
      {
        id: "webhook_tx",
        type: "trigger_webhook",
        label: "Incoming Transaction",
        position: { x: 0, y: 0 },
        inputs: {},
        outputs: { body: { id: "body", name: "Body", type: "object" } },
        config: { initialPayload: { amount: 15000, user: "usr_99" } },
      },
      {
        id: "ai_risk_eval",
        type: "ai_agent",
        label: "Risk Evaluator Agent",
        position: { x: 200, y: 0 },
        inputs: { input: { id: "input", name: "Input", type: "any" } },
        outputs: { response: { id: "response", name: "Response", type: "string" } },
        config: { model: "gemini-2.5-flash" },
      },
      {
        id: "script_decision",
        type: "code_script",
        label: "Decision Logic",
        position: { x: 400, y: 0 },
        inputs: { input: { id: "input", name: "Input", type: "any" } },
        outputs: { output: { id: "output", name: "Output", type: "any" } },
        config: { code: "return { flag: 'HIGH_RISK_REVIEW', status: 'FLAGGED' };" },
      },
    ],
    edges: [
      { id: "e1", sourceNodeId: "webhook_tx", sourcePort: "body", targetNodeId: "ai_risk_eval", targetPort: "input" },
      { id: "e2", sourceNodeId: "ai_risk_eval", sourcePort: "response", targetNodeId: "script_decision", targetPort: "input" },
    ],
    variables: {},
    metadata: {},
  };

  it("Synthesizes and executes real TypeScript / Node.js code end-to-end", () => {
    fs.mkdirSync(e2eDir, { recursive: true });

    const tsResult = generatePolyglotCode(sampleGraph, "typescript");
    const srcFile = path.join(e2eDir, "workflow_e2e_payment_fraud.ts");
    const runnerFile = path.join(e2eDir, "runner_payment_fraud.ts");

    fs.writeFileSync(srcFile, tsResult.sourceCode, "utf8");

    // Standalone Node.js execution verification script
    const runnerCode = `
      import { run_Payment_Fraud_Detector } from "./workflow_e2e_payment_fraud.ts";
      const result = await run_Payment_Fraud_Detector({ amount: 15000 });
      console.log("NODE_E2E_OK:", JSON.stringify({
        workflowId: result.workflowId,
        status: result.results["script_decision"]?.output?.status
      }));
    `;
    fs.writeFileSync(runnerFile, runnerCode, "utf8");

    const output = execSync(`node --experimental-strip-types "${runnerFile}"`, {
      encoding: "utf8",
    });
    assert.ok(output.includes("NODE_E2E_OK:"));
    assert.ok(output.includes("e2e_payment_fraud"));
    assert.ok(output.includes("FLAGGED"));
  });

  it("Synthesizes and executes real Python code end-to-end", () => {
    fs.mkdirSync(pyDir, { recursive: true });

    const pyResult = generatePolyglotCode(sampleGraph, "python");
    const pySrcFile = path.join(pyDir, "workflow_e2e_payment_fraud.py");
    const pyRunnerFile = path.join(pyDir, "runner_payment_fraud.py");

    fs.writeFileSync(pySrcFile, pyResult.sourceCode, "utf8");

    // Standalone Python execution verification script
    const pyRunnerCode = `
import asyncio
from workflow_e2e_payment_fraud import run_Payment_Fraud_Detector

async def main():
    res = await run_Payment_Fraud_Detector({"amount": 15000})
    print("PYTHON_E2E_OK:", res["workflow_id"], res["results"]["script_decision"]["output"])

asyncio.run(main())
`;
    fs.writeFileSync(pyRunnerFile, pyRunnerCode, "utf8");

    const output = execSync(`python runner_payment_fraud.py`, {
      encoding: "utf8",
      cwd: pyDir,
    });
    assert.ok(output.includes("PYTHON_E2E_OK:"));
    assert.ok(output.includes("e2e_payment_fraud"));
  });
});
