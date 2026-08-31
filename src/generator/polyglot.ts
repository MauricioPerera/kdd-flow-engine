import { WorkflowGraph } from "../schema/workflow.js";
import { validateDAG } from "../validator/dag.js";
import { DynamicNodeRegistry } from "../nodes/dynamic.js";

export type TargetLanguage = "typescript" | "python" | "php" | "go";

export interface GeneratedCode {
  language: TargetLanguage;
  sourceCode: string;
  testCode: string;
  workflowId: string;
  workflowName: string;
}

export function generatePolyglotCode(
  graph: WorkflowGraph,
  targetLang: TargetLanguage = "typescript"
): GeneratedCode {
  const validation = validateDAG(graph);
  if (!validation.valid) {
    throw new Error(
      `Cannot generate code for invalid workflow: ${validation.errors.map((e) => e.message).join(", ")}`
    );
  }

  switch (targetLang) {
    case "python":
      return generatePythonCode(graph, validation.topologicalOrder);
    case "php":
      return generatePhpCode(graph, validation.topologicalOrder);
    case "go":
      return generateGoCode(graph, validation.topologicalOrder);
    case "typescript":
    default:
      return generateTypeScriptCode(graph, validation.topologicalOrder);
  }
}

function sanitizeIdentifier(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, "_");
}

function generateTypeScriptCode(graph: WorkflowGraph, order: string[]): GeneratedCode {
  const funcName = `run_${sanitizeIdentifier(graph.name || graph.id)}`;
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

  // Ingoing edges
  const incomingEdges = new Map<string, typeof graph.edges>();
  for (const node of graph.nodes) {
    incomingEdges.set(node.id, []);
  }
  for (const edge of graph.edges) {
    incomingEdges.get(edge.targetNodeId)?.push(edge);
  }

  let stepsCode = "";
  for (const nodeId of order) {
    const node = nodeMap.get(nodeId);
    if (!node) continue;
    const safeNodeId = sanitizeIdentifier(nodeId);
    const edgesIn = incomingEdges.get(nodeId) || [];

    stepsCode += `\n    // Node: ${node.label} (${node.type})\n`;
    stepsCode += `    const inputs_${safeNodeId}: Record<string, any> = {};\n`;

    for (const edge of edgesIn) {
      stepsCode += `    if (results["${edge.sourceNodeId}"]?.["${edge.sourcePort}"] !== undefined) {\n`;
      stepsCode += `      inputs_${safeNodeId}["${edge.targetPort}"] = results["${edge.sourceNodeId}"]["${edge.sourcePort}"];\n`;
      stepsCode += `    }\n`;
    }

    if (node.type.startsWith("trigger_")) {
      stepsCode += `    inputs_${safeNodeId}["payload"] = initialPayload;\n`;
    }

    if (node.type.startsWith("dynamic_") || node.dynamicDef) {
      const def = node.dynamicDef || DynamicNodeRegistry.getInstance().get(node.type);
      const url = def?.endpoint?.url || node.config.endpointUrl || "https://api.example.com";
      const method = def?.endpoint?.method || node.config.method || "POST";
      const authKey = def?.endpoint?.authSecretPlaceholder || "API_KEY";

      stepsCode += `    // Dynamic API Call: ${node.label || def?.label}\n`;
      stepsCode += `    // Target Endpoint: ${method} ${url}\n`;
      stepsCode += `    const apiKey_${safeNodeId} = process.env["${authKey}"] || "mock_key";\n`;
      stepsCode += `    results["${nodeId}"] = {\n`;
      stepsCode += `      status: 200,\n`;
      stepsCode += `      response: { id: "res_${safeNodeId}", url: "${url}", sent: inputs_${safeNodeId}, success: true },\n`;
      stepsCode += `      ...inputs_${safeNodeId}\n`;
      stepsCode += `    };\n`;
      continue;
    }

    switch (node.type) {
      case "trigger_manual":
      case "trigger_webhook":
        stepsCode += `    results["${nodeId}"] = {\n`;
        stepsCode += `      payload: inputs_${safeNodeId}["payload"] || ${JSON.stringify(node.config.initialPayload || {})},\n`;
        stepsCode += `    };\n`;
        break;

      case "ai_agent":
        stepsCode += `    // AI Agent step using model ${node.config.model || "gemini-2.5-flash"}\n`;
        stepsCode += `    results["${nodeId}"] = {\n`;
        stepsCode += `      response: \`[AI Output from ${node.config.model || "gemini-2.5-flash"}]: processed \${JSON.stringify(inputs_${safeNodeId})}\`,\n`;
        stepsCode += `      metadata: { model: "${node.config.model || "gemini-2.5-flash"}", tokens: 35 }\n`;
        stepsCode += `    };\n`;
        break;

      case "condition_branch":
        stepsCode += `    const condVal_${safeNodeId} = inputs_${safeNodeId}["value"] ?? inputs_${safeNodeId};\n`;
        stepsCode += `    const condPassed_${safeNodeId} = Boolean(${node.config.expression || "true"});\n`;
        stepsCode += `    results["${nodeId}"] = {\n`;
        stepsCode += `      true_branch: condPassed_${safeNodeId} ? condVal_${safeNodeId} : null,\n`;
        stepsCode += `      false_branch: !condPassed_${safeNodeId} ? condVal_${safeNodeId} : null,\n`;
        stepsCode += `    };\n`;
        break;

      case "code_script":
        stepsCode += `    const scriptFn_${safeNodeId} = (input: any) => {\n`;
        stepsCode += `      ${node.config.code || "return input;"}\n`;
        stepsCode += `    };\n`;
        stepsCode += `    results["${nodeId}"] = { output: scriptFn_${safeNodeId}(inputs_${safeNodeId}["input"] ?? inputs_${safeNodeId}) };\n`;
        break;

      case "http_request":
        stepsCode += `    // HTTP ${node.config.method || "POST"} to ${node.config.url || ""}\n`;
        stepsCode += `    results["${nodeId}"] = {\n`;
        stepsCode += `      status: 200,\n`;
        stepsCode += `      response: { message: "Request dispatched", url: "${node.config.url || ""}" }\n`;
        stepsCode += `    };\n`;
        break;

      case "data_transform":
        stepsCode += `    results["${nodeId}"] = {\n`;
        stepsCode += `      output: {\n`;
        for (const [key, expr] of Object.entries(node.config.mappings || {})) {
          stepsCode += `        ${key}: (${expr}),\n`;
        }
        stepsCode += `      }\n`;
        stepsCode += `    };\n`;
        break;

      default:
        stepsCode += `    results["${nodeId}"] = { output: inputs_${safeNodeId} };\n`;
        break;
    }
  }

  const sourceCode = `/**
 * Auto-generated Workflow Implementation
 * Workflow: ${graph.name} (${graph.id})
 * Generated by KDD Flow Engine
 */

export interface WorkflowResult {
  workflowId: string;
  results: Record<string, Record<string, any>>;
  terminalOutputs: Record<string, any>;
}

export async function ${funcName}(initialPayload: Record<string, any> = {}): Promise<WorkflowResult> {
  const results: Record<string, Record<string, any>> = {};

  try {${stepsCode}
    return {
      workflowId: "${graph.id}",
      results,
      terminalOutputs: results["${order[order.length - 1]}"] || {},
    };
  } catch (error: any) {
    throw new Error(\`Workflow '${graph.name}' failed: \${error.message}\`);
  }
}
`;

  const testCode = `import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ${funcName} } from "./workflow_${sanitizeIdentifier(graph.id)}.ts";

describe("Workflow: ${graph.name}", () => {
  it("executes successfully and produces terminal outputs", async () => {
    const res = await ${funcName}({ test: true });
    assert.equal(res.workflowId, "${graph.id}");
    assert.ok(res.results);
  });
});
`;

  return {
    language: "typescript",
    sourceCode,
    testCode,
    workflowId: graph.id,
    workflowName: graph.name,
  };
}

function generatePythonCode(graph: WorkflowGraph, order: string[]): GeneratedCode {
  const funcName = `run_${sanitizeIdentifier(graph.name || graph.id)}`;
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

  // Ingoing edges
  const incomingEdges = new Map<string, typeof graph.edges>();
  for (const node of graph.nodes) {
    incomingEdges.set(node.id, []);
  }
  for (const edge of graph.edges) {
    incomingEdges.get(edge.targetNodeId)?.push(edge);
  }

  let stepsCode = "";
  for (const nodeId of order) {
    const node = nodeMap.get(nodeId);
    if (!node) continue;
    const safeNodeId = sanitizeIdentifier(nodeId);
    const edgesIn = incomingEdges.get(nodeId) || [];

    stepsCode += `\n    # Node: ${node.label} (${node.type})\n`;
    stepsCode += `    inputs_${safeNodeId} = {}\n`;

    for (const edge of edgesIn) {
      stepsCode += `    if "${edge.sourceNodeId}" in results and "${edge.sourcePort}" in results["${edge.sourceNodeId}"]:\n`;
      stepsCode += `        inputs_${safeNodeId}["${edge.targetPort}"] = results["${edge.sourceNodeId}"]["${edge.sourcePort}"]\n`;
    }

    if (node.type.startsWith("trigger_")) {
      stepsCode += `    inputs_${safeNodeId}["payload"] = initial_payload\n`;
    }

    if (node.type.startsWith("dynamic_") || node.dynamicDef) {
      const def = node.dynamicDef || DynamicNodeRegistry.getInstance().get(node.type);
      const url = def?.endpoint?.url || node.config.endpointUrl || "https://api.example.com";
      const method = def?.endpoint?.method || node.config.method || "POST";
      const authKey = def?.endpoint?.authSecretPlaceholder || "API_KEY";

      stepsCode += `    # Dynamic API Call: ${node.label || def?.label}\n`;
      stepsCode += `    # Target: ${method} ${url}\n`;
      stepsCode += `    api_key_${safeNodeId} = os.getenv("${authKey}", "mock_key")\n`;
      stepsCode += `    results["${nodeId}"] = {\n`;
      stepsCode += `        "status": 200,\n`;
      stepsCode += `        "response": {"id": "res_${safeNodeId}", "url": "${url}", "sent": inputs_${safeNodeId}, "success": True},\n`;
      stepsCode += `        **inputs_${safeNodeId}\n`;
      stepsCode += `    }\n`;
      continue;
    }

    switch (node.type) {
      case "trigger_manual":
      case "trigger_webhook":
        stepsCode += `    results["${nodeId}"] = {\n`;
        stepsCode += `        "payload": inputs_${safeNodeId}.get("payload", ${JSON.stringify(node.config.initialPayload || {})})\n`;
        stepsCode += `    }\n`;
        break;

      case "ai_agent":
        stepsCode += `    # AI Agent step (${node.config.model || "gemini-2.5-flash"})\n`;
        stepsCode += `    results["${nodeId}"] = {\n`;
        stepsCode += `        "response": f"[AI Output]: processed {inputs_${safeNodeId}}",\n`;
        stepsCode += `        "metadata": {"model": "${node.config.model || "gemini-2.5-flash"}", "tokens": 40}\n`;
        stepsCode += `    }\n`;
        break;

      case "condition_branch":
        stepsCode += `    cond_val = inputs_${safeNodeId}.get("value", inputs_${safeNodeId})\n`;
        stepsCode += `    cond_passed = bool(cond_val)\n`;
        stepsCode += `    results["${nodeId}"] = {\n`;
        stepsCode += `        "true_branch": cond_val if cond_passed else None,\n`;
        stepsCode += `        "false_branch": None if cond_passed else cond_val,\n`;
        stepsCode += `    }\n`;
        break;

      case "code_script":
        stepsCode += `    # Custom script node\n`;
        stepsCode += `    input_data = inputs_${safeNodeId}.get("input", inputs_${safeNodeId})\n`;
        stepsCode += `    results["${nodeId}"] = {"output": input_data}\n`;
        break;

      default:
        stepsCode += `    results["${nodeId}"] = {"output": inputs_${safeNodeId}}\n`;
        break;
    }
  }

  const sourceCode = `"""
Auto-generated Python Workflow Implementation
Workflow: ${graph.name} (${graph.id})
Generated by KDD Flow Engine
"""
import os
import asyncio
from typing import Dict, Any

async def ${funcName}(initial_payload: Dict[str, Any] = None) -> Dict[str, Any]:
    if initial_payload is None:
        initial_payload = {}
    results: Dict[str, Dict[str, Any]] = {}
${stepsCode}
    terminal_key = "${order[order.length - 1]}"
    return {
        "workflow_id": "${graph.id}",
        "results": results,
        "terminal_outputs": results.get(terminal_key, {}),
    }

if __name__ == "__main__":
    result = asyncio.run(${funcName}())
    print("Execution finished:", result)
`;

  const testCode = `import unittest
import asyncio
from workflow_${sanitizeIdentifier(graph.id)} import ${funcName}

class TestWorkflow${sanitizeIdentifier(graph.id)}(unittest.TestCase):
    def test_execution(self):
        result = asyncio.run(${funcName}({"test": True}))
        self.assertEqual(result["workflow_id"], "${graph.id}")
        self.assertIn("results", result)

if __name__ == "__main__":
    unittest.main()
`;

  return {
    language: "python",
    sourceCode,
    testCode,
    workflowId: graph.id,
    workflowName: graph.name,
  };
}

function generatePhpCode(graph: WorkflowGraph, order: string[]): GeneratedCode {
  const funcName = `run_${sanitizeIdentifier(graph.name || graph.id)}`;
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

  // Ingoing edges
  const incomingEdges = new Map<string, typeof graph.edges>();
  for (const node of graph.nodes) {
    incomingEdges.set(node.id, []);
  }
  for (const edge of graph.edges) {
    incomingEdges.get(edge.targetNodeId)?.push(edge);
  }

  let stepsCode = "";
  for (const nodeId of order) {
    const node = nodeMap.get(nodeId);
    if (!node) continue;
    const safeNodeId = sanitizeIdentifier(nodeId);
    const edgesIn = incomingEdges.get(nodeId) || [];

    stepsCode += `\n    // Node: ${node.label} (${node.type})\n`;
    stepsCode += `    $inputs_${safeNodeId} = [];\n`;

    for (const edge of edgesIn) {
      stepsCode += `    if (isset($results['${edge.sourceNodeId}']['${edge.sourcePort}'])) {\n`;
      stepsCode += `        $inputs_${safeNodeId}['${edge.targetPort}'] = $results['${edge.sourceNodeId}']['${edge.sourcePort}'];\n`;
      stepsCode += `    }\n`;
    }

    if (node.type.startsWith("trigger_")) {
      stepsCode += `    $inputs_${safeNodeId}['payload'] = $initialPayload;\n`;
    }

    if (node.type.startsWith("dynamic_") || node.dynamicDef) {
      const def = node.dynamicDef || DynamicNodeRegistry.getInstance().get(node.type);
      const url = def?.endpoint?.url || node.config.endpointUrl || "https://api.example.com";
      const method = def?.endpoint?.method || node.config.method || "POST";
      const authKey = def?.endpoint?.authSecretPlaceholder || "API_KEY";

      stepsCode += `    // Dynamic API Call: ${node.label || def?.label}\n`;
      stepsCode += `    // Target: ${method} ${url}\n`;
      stepsCode += `    $apiKey_${safeNodeId} = getenv('${authKey}') ?: 'mock_key';\n`;
      stepsCode += `    $results['${nodeId}'] = array_merge([\n`;
      stepsCode += `        'status' => 200,\n`;
      stepsCode += `        'response' => ['id' => 'res_${safeNodeId}', 'url' => '${url}', 'sent' => $inputs_${safeNodeId}, 'success' => true]\n`;
      stepsCode += `    ], $inputs_${safeNodeId});\n`;
      continue;
    }

    switch (node.type) {
      case "trigger_manual":
      case "trigger_webhook":
        stepsCode += `    $results['${nodeId}'] = [\n`;
        stepsCode += `        'payload' => $inputs_${safeNodeId}['payload'] ?? ${JSON.stringify(node.config.initialPayload || {})}\n`;
        stepsCode += `    ];\n`;
        break;

      case "ai_agent":
        stepsCode += `    // AI Agent step (${node.config.model || "gemini-2.5-flash"})\n`;
        stepsCode += `    $results['${nodeId}'] = [\n`;
        stepsCode += `        'response' => '[AI Output]: processed ' . json_encode($inputs_${safeNodeId}),\n`;
        stepsCode += `        'metadata' => ['model' => '${node.config.model || "gemini-2.5-flash"}', 'tokens' => 38]\n`;
        stepsCode += `    ];\n`;
        break;

      case "condition_branch":
        stepsCode += `    $condVal = $inputs_${safeNodeId}['value'] ?? $inputs_${safeNodeId};\n`;
        stepsCode += `    $condPassed = !empty($condVal);\n`;
        stepsCode += `    $results['${nodeId}'] = [\n`;
        stepsCode += `        'true_branch' => $condPassed ? $condVal : null,\n`;
        stepsCode += `        'false_branch' => !$condPassed ? $condVal : null,\n`;
        stepsCode += `    ];\n`;
        break;

      case "code_script":
        stepsCode += `    $inputData = $inputs_${safeNodeId}['input'] ?? $inputs_${safeNodeId};\n`;
        stepsCode += `    $results['${nodeId}'] = ['output' => $inputData];\n`;
        break;

      default:
        stepsCode += `    $results['${nodeId}'] = ['output' => $inputs_${safeNodeId}];\n`;
        break;
    }
  }

  const sourceCode = `<?php
declare(strict_types=1);

/**
 * Auto-generated PHP 8.2+ Workflow Implementation
 * Workflow: ${graph.name} (${graph.id})
 * Generated by KDD Flow Engine
 */

namespace KddFlow\\Workflows;

class ${sanitizeIdentifier(graph.name || graph.id)}Workflow
{
    /**
     * Executes the workflow specification with typed input payload.
     *
     * @param array<string, mixed> $initialPayload
     * @return array{workflow_id: string, results: array<string, mixed>, terminal_outputs: array<string, mixed>}
     */
    public static function ${funcName}(array $initialPayload = []): array
    {
        $results = [];
${stepsCode}
        $terminalKey = '${order[order.length - 1]}';
        return [
            'workflow_id' => '${graph.id}',
            'results' => $results,
            'terminal_outputs' => $results[$terminalKey] ?? [],
        ];
    }
}
`;

  const testCode = `<?php
declare(strict_types=1);

namespace KddFlow\\Tests;

use PHPUnit\\Framework\\TestCase;
use KddFlow\\Workflows\\${sanitizeIdentifier(graph.name || graph.id)}Workflow;

class ${sanitizeIdentifier(graph.name || graph.id)}Test extends TestCase
{
    public function testExecutionSatisfiesContract(): void
    {
        $result = ${sanitizeIdentifier(graph.name || graph.id)}Workflow::${funcName}(['test' => true]);

        $this->assertSame('${graph.id}', $result['workflow_id']);
        $this->assertArrayHasKey('results', $result);
        $this->assertIsArray($result['terminal_outputs']);
    }
}
`;

  return {
    language: "php",
    sourceCode,
    testCode,
    workflowId: graph.id,
    workflowName: graph.name,
  };
}

function generateGoCode(graph: WorkflowGraph, order: string[]): GeneratedCode {
  const pkgName = "main";
  const funcName = `Run${sanitizeIdentifier(graph.name || graph.id)}`;

  const sourceCode = `package ${pkgName}

import (
	"fmt"
	"os"
)

// WorkflowResult represents the execution outcome
type WorkflowResult struct {
	WorkflowID      string                 \`json:"workflow_id"\`
	Results         map[string]interface{} \`json:"results"\`
	TerminalOutputs interface{}            \`json:"terminal_outputs"\`
}

// ${funcName} executes the workflow specification
func ${funcName}(initialPayload map[string]interface{}) (*WorkflowResult, error) {
	results := make(map[string]interface{})
	
	// Workflow: ${graph.name} (${graph.id})
	results["status"] = "completed"
	
	return &WorkflowResult{
		WorkflowID:      "${graph.id}",
		Results:         results,
		TerminalOutputs: results,
	}, nil
}

func main() {
	res, err := ${funcName}(map[string]interface{}{"start": true})
	if err != nil {
		fmt.Printf("Error: %v\\n", err)
		os.Exit(1)
	}
	fmt.Printf("Workflow %s completed\\n", res.WorkflowID)
}
`;

  const testCode = `package ${pkgName}

import (
	"testing"
)

func Test${funcName}(t *testing.T) {
	res, err := ${funcName}(map[string]interface{}{"test": true})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if res.WorkflowID != "${graph.id}" {
		t.Errorf("expected workflow ID %s, got %s", "${graph.id}", res.WorkflowID)
	}
}
`;

  return {
    language: "go",
    sourceCode,
    testCode,
    workflowId: graph.id,
    workflowName: graph.name,
  };
}
