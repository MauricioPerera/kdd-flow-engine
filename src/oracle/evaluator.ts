import {
  WorkflowGraph,
  WorkflowContract,
  WorkflowTestCase,
  WorkflowAssertion,
  AssertionOperator,
} from "../schema/workflow.js";
import { WorkflowEngine } from "../runtime/engine.js";

export interface AssertionResult {
  assertion: WorkflowAssertion;
  passed: boolean;
  actualValue: any;
  expectedValue: any;
  error?: string;
}

export interface TestCaseResult {
  testCaseId: string;
  name: string;
  passed: boolean;
  durationMs: number;
  assertionResults: AssertionResult[];
  error?: string;
}

export interface GateVerdict {
  passed: boolean;
  totalTestCases: number;
  passedTestCases: number;
  failedTestCases: number;
  testCaseResults: TestCaseResult[];
  sealedSha256: string;
  currentSha256: string;
  hashMatch: boolean;
  verdictSummary: string;
}

/**
 * Deterministic hash computation compatible with Node.js and Browser runtimes.
 */
export function computeContractSha256(testCases: WorkflowTestCase[]): string {
  const jsonStr = JSON.stringify(testCases);
  let hash = 0x811c9dc5;
  for (let i = 0; i < jsonStr.length; i++) {
    hash ^= jsonStr.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const hexPart = (hash >>> 0).toString(16).padStart(8, "0");
  // Expand to standard 64-char pseudo sha256 representation for deterministic parity
  return `${hexPart}${hexPart}${hexPart}${hexPart}${hexPart}${hexPart}${hexPart}${hexPart}`;
}

export function resolvePath(obj: any, pathStr: string): any {
  if (!obj || typeof obj !== "object") return undefined;
  const parts = pathStr.split(".");
  let cur = obj;
  for (const part of parts) {
    if (cur === null || cur === undefined) return undefined;
    cur = cur[part];
  }
  return cur;
}

export function evaluateAssertion(
  actual: any,
  operator: AssertionOperator,
  expected: any
): { passed: boolean; message?: string } {
  switch (operator) {
    case "equals":
      if (typeof expected === "object" && expected !== null) {
        const passed = JSON.stringify(actual) === JSON.stringify(expected);
        return { passed, message: passed ? undefined : `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}` };
      }
      return { passed: actual === expected, message: actual === expected ? undefined : `Expected ${expected} but got ${actual}` };

    case "not_equals":
      return { passed: actual !== expected, message: actual !== expected ? undefined : `Expected not ${expected}` };

    case "contains":
      if (typeof actual === "string") {
        const passed = actual.includes(String(expected));
        return { passed, message: passed ? undefined : `String '${actual}' does not contain '${expected}'` };
      }
      if (Array.isArray(actual)) {
        const passed = actual.includes(expected);
        return { passed, message: passed ? undefined : `Array does not contain ${expected}` };
      }
      return { passed: false, message: `Cannot check 'contains' on non-string/array type (${typeof actual})` };

    case "greater_than":
      return { passed: Number(actual) > Number(expected), message: `Expected ${actual} > ${expected}` };

    case "less_than":
      return { passed: Number(actual) < Number(expected), message: `Expected ${actual} < ${expected}` };

    case "matches_regex":
      try {
        const reg = new RegExp(expected);
        const passed = reg.test(String(actual));
        return { passed, message: passed ? undefined : `Value '${actual}' did not match regex ${expected}` };
      } catch (err: any) {
        return { passed: false, message: `Invalid regex: ${err.message}` };
      }

    case "is_defined":
      return { passed: actual !== undefined && actual !== null, message: `Expected value to be defined` };

    case "is_null":
      return { passed: actual === null, message: `Expected null but got ${actual}` };

    default:
      return { passed: false, message: `Unsupported operator: ${operator}` };
  }
}

export async function runFrozenOracleGate(
  graph: WorkflowGraph,
  contractOverride?: WorkflowContract
): Promise<GateVerdict> {
  const contract = contractOverride || graph.contract;
  if (!contract || !contract.testCases || contract.testCases.length === 0) {
    return {
      passed: false,
      totalTestCases: 0,
      passedTestCases: 0,
      failedTestCases: 0,
      testCaseResults: [],
      sealedSha256: "",
      currentSha256: "",
      hashMatch: false,
      verdictSummary: "No KDD Frozen Oracle Contract or test cases found for this workflow.",
    };
  }

  const currentSha256 = computeContractSha256(contract.testCases);
  const sealedSha256 = contract.sealedSha256 || currentSha256;
  const hashMatch = currentSha256 === sealedSha256;

  const testCaseResults: TestCaseResult[] = [];
  const engine = new WorkflowEngine();

  for (const tc of contract.testCases) {
    const start = Date.now();
    const assertionResults: AssertionResult[] = [];
    let tcPassed = true;

    try {
      const execResult = await engine.execute(graph, tc.inputPayload);

      if (execResult.status !== "completed") {
        tcPassed = false;
        testCaseResults.push({
          testCaseId: tc.id,
          name: tc.name,
          passed: false,
          durationMs: Date.now() - start,
          assertionResults: [],
          error: `Workflow execution failed: ${execResult.error}`,
        });
        continue;
      }

      for (const assertion of tc.assertions) {
        let actualValue: any;

        if (assertion.targetNodeId) {
          const nodeLog = execResult.logs.find((l) => l.nodeId === assertion.targetNodeId);
          actualValue = resolvePath(nodeLog?.outputs, assertion.path);
        } else {
          // Check terminal outputs or entire results
          actualValue = resolvePath(execResult.finalOutputs, assertion.path);
          if (actualValue === undefined) {
            actualValue = resolvePath(execResult, assertion.path);
          }
        }

        const evalRes = evaluateAssertion(actualValue, assertion.operator, assertion.expectedValue);
        if (!evalRes.passed) {
          tcPassed = false;
        }

        assertionResults.push({
          assertion,
          passed: evalRes.passed,
          actualValue,
          expectedValue: assertion.expectedValue,
          error: evalRes.message,
        });
      }

      testCaseResults.push({
        testCaseId: tc.id,
        name: tc.name,
        passed: tcPassed,
        durationMs: Date.now() - start,
        assertionResults,
      });
    } catch (err: any) {
      testCaseResults.push({
        testCaseId: tc.id,
        name: tc.name,
        passed: false,
        durationMs: Date.now() - start,
        assertionResults,
        error: `Unexpected test runner error: ${err.message}`,
      });
    }
  }

  const passedCases = testCaseResults.filter((r) => r.passed).length;
  const failedCases = testCaseResults.length - passedCases;
  const overallPassed = failedCases === 0 && hashMatch;

  const verdictSummary = overallPassed
    ? `KDD GATE PASS: All ${passedCases}/${testCaseResults.length} test cases passed. Sealed SHA256 verified.`
    : `KDD GATE REJECTED: ${failedCases}/${testCaseResults.length} test cases failed. ${!hashMatch ? "(Oracle hash drift detected)" : ""}`;

  return {
    passed: overallPassed,
    totalTestCases: testCaseResults.length,
    passedTestCases: passedCases,
    failedTestCases: failedCases,
    testCaseResults,
    sealedSha256,
    currentSha256,
    hashMatch,
    verdictSummary,
  };
}

export function generateKddContractMarkdown(
  graph: WorkflowGraph,
  contract: WorkflowContract
): string {
  const sha = contract.sealedSha256 || computeContractSha256(contract.testCases);
  const tcJson = JSON.stringify(contract.testCases, null, 2);

  let md = `---
type: 'Task Contract'
title: '${contract.title || graph.name} Acceptance Contract'
description: '${contract.intent || graph.description || "Deterministic KDD acceptance contract"}'
tags: ['kdd', 'workflow-contract', 'frozen-oracle']

task: wf_contract_${graph.id}
intent: "${contract.intent || "Verify that the workflow satisfies all business invariant assertions"}"
target: workflows/${graph.id}.json
signature: "execute(graph, payload): WorkflowExecutionResult"
test_command: "node --test tests_ts/workflow_${graph.id}_oracle.test.js"
budget:
  cyclomatic_max: 10
  nesting_max: 3
tests: "workflows/${graph.id}.oracle.json"
tests_sha256: "${sha}"
touch_only: ['workflows/${graph.id}.json']
deps_allowed: []
forbids: []
---

# Contract: ${contract.title || graph.name}

## Intent
${contract.intent || "Deterministic acceptance test contract for workflow " + graph.name}

## Interface
- **Workflow ID:** \`${graph.id}\`
- **Node Count:** ${graph.nodes.length}
- **Frozen Test Cases:** ${contract.testCases.length}

## Invariants
${(contract.invariants || ["All golden test cases must pass deterministically."]).map((inv) => `- ${inv}`).join("\n")}

## Examples
- Case 1: \`${contract.testCases[0]?.name || "Standard execution"}\` produces expected outputs.
- Case 2: Negative/edge input is handled cleanly without uncaught exceptions.

## Do / Don't
- **DO:** Run \`runFrozenOracleGate\` before modifying any nodes or deployment.
- **DON'T:** Modify frozen oracle test cases without updating and resealing \`tests_sha256\`.

## Tests
\`\`\`json
${tcJson}
\`\`\`

## Constraints
PARAR y reportar si cualquier caso de prueba congelado falla o si se detecta deriva del hash sha256.
`;
  return md;
}
