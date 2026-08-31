import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generatePolyglotCode } from "../src/generator/polyglot.js";
import { WorkflowGraph } from "../src/schema/workflow.js";

describe("Polyglot Code Generator (TypeScript, Python, PHP, Go)", () => {
  const sampleGraph: WorkflowGraph = {
    id: "wf_sentiment_test",
    name: "Customer Sentiment Flow",
    nodes: [
      {
        id: "trig",
        type: "trigger_manual",
        label: "Manual Trigger",
        position: { x: 0, y: 0 },
        inputs: {},
        outputs: { payload: { id: "payload", name: "Payload", type: "object" } },
        config: { initialPayload: { message: "Hello world" } },
      },
      {
        id: "ai_node",
        type: "ai_agent",
        label: "Classifier",
        position: { x: 200, y: 0 },
        inputs: { input: { id: "input", name: "Input", type: "any" } },
        outputs: { response: { id: "response", name: "Response", type: "string" } },
        config: { model: "gemini-2.5-flash" },
      },
    ],
    edges: [
      { id: "e1", sourceNodeId: "trig", sourcePort: "payload", targetNodeId: "ai_node", targetPort: "input" },
    ],
    variables: {},
    metadata: {},
  };

  it("generates runnable TypeScript code and test oracle", () => {
    const res = generatePolyglotCode(sampleGraph, "typescript");
    assert.equal(res.language, "typescript");
    assert.ok(res.sourceCode.includes("async function run_Customer_Sentiment_Flow"));
    assert.ok(res.testCode.includes("import { describe, it } from \"node:test\""));
  });

  it("generates runnable Python code and unittest suite", () => {
    const res = generatePolyglotCode(sampleGraph, "python");
    assert.equal(res.language, "python");
    assert.ok(res.sourceCode.includes("async def run_Customer_Sentiment_Flow"));
    assert.ok(res.testCode.includes("import unittest"));
  });

  it("generates production-ready PHP 8.2+ code and PHPUnit test suite", () => {
    const res = generatePolyglotCode(sampleGraph, "php");
    assert.equal(res.language, "php");
    assert.ok(res.sourceCode.includes("declare(strict_types=1);"));
    assert.ok(res.sourceCode.includes("namespace KddFlow\\Workflows;"));
    assert.ok(res.sourceCode.includes("class Customer_Sentiment_FlowWorkflow"));
    assert.ok(res.sourceCode.includes("public static function run_Customer_Sentiment_Flow"));
    assert.ok(res.testCode.includes("use PHPUnit\\Framework\\TestCase;"));
  });

  it("generates idiomatic Go code and testing suite", () => {
    const res = generatePolyglotCode(sampleGraph, "go");
    assert.equal(res.language, "go");
    assert.ok(res.sourceCode.includes("package main"));
    assert.ok(res.sourceCode.includes("func RunCustomer_Sentiment_Flow"));
    assert.ok(res.testCode.includes("func TestRunCustomer_Sentiment_Flow(t *testing.T)"));
  });
});
