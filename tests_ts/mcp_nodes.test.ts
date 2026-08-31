import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { WorkflowEngine } from "../src/runtime/engine.js";
import { WorkflowGraph } from "../src/schema/workflow.js";
import { validateDAG } from "../src/validator/dag.js";
import { generatePolyglotCode } from "../src/generator/polyglot.js";

describe("MCP Client, MCP Server, and Multi-Agent Handoff Workflow Execution", () => {
  const mcpMultiAgentGraph: WorkflowGraph = {
    id: "wf_mcp_agent_pipeline",
    name: "MCP Server & Multi-Agent Review Pipeline",
    description: "Calls MCP tools, hands off to subagents, and exposes results as an MCP tool",
    version: "1.0.0",
    nodes: [
      {
        id: "webhook_req",
        type: "trigger_webhook",
        label: "Incoming Event",
        position: { x: 0, y: 0 },
        inputs: {},
        outputs: { body: { id: "body", name: "Body", type: "object" } },
        config: { initialPayload: { prNumber: 42, repo: "MauricioPerera/KDD" } },
      },
      {
        id: "mcp_client_step",
        type: "mcp_client_call",
        label: "MCP Client: Fetch PR Files",
        position: { x: 250, y: 0 },
        inputs: { arguments: { id: "arguments", name: "Arguments", type: "object" } },
        outputs: {
          result: { id: "result", name: "Result", type: "any" },
          isError: { id: "isError", name: "Is Error", type: "boolean" },
        },
        config: {
          serverName: "github-mcp",
          toolName: "get_pull_request_files",
          transport: "sse",
        },
      },
      {
        id: "subagent_handoff_step",
        type: "agent_handoff",
        label: "Subagent: QA Code Reviewer",
        position: { x: 500, y: 0 },
        inputs: { task: { id: "task", name: "Task", type: "string" } },
        outputs: {
          subagentResult: { id: "subagentResult", name: "Review Verdict", type: "any" },
          handoffStatus: { id: "handoffStatus", name: "Status", type: "string" },
        },
        config: {
          subagentRole: "KDD QA Reviewer",
          targetModel: "claude-3-7-sonnet",
          handoffInstruction: "Verify test coverage and contract seal.",
        },
      },
      {
        id: "mcp_server_exposer",
        type: "mcp_server_tool",
        label: "MCP Server: Expose QA Verdict",
        position: { x: 750, y: 0 },
        inputs: { inputData: { id: "inputData", name: "Data", type: "any" } },
        outputs: { toolResponse: { id: "toolResponse", name: "Response", type: "any" } },
        config: {
          exposedToolName: "get_pr_qa_verdict",
          toolDescription: "Exposes automated PR QA verdict to Claude Desktop / Cursor",
        },
      },
    ],
    edges: [
      { id: "e1", sourceNodeId: "webhook_req", sourcePort: "body", targetNodeId: "mcp_client_step", targetPort: "arguments" },
      { id: "e2", sourceNodeId: "mcp_client_step", sourcePort: "result", targetNodeId: "subagent_handoff_step", targetPort: "task" },
      { id: "e3", sourceNodeId: "subagent_handoff_step", sourcePort: "subagentResult", targetNodeId: "mcp_server_exposer", targetPort: "inputData" },
    ],
    variables: {},
    metadata: {},
  };

  it("Validates DAG for MCP and Multi-Agent workflow without errors", () => {
    const validation = validateDAG(mcpMultiAgentGraph);
    assert.equal(validation.valid, true);
    assert.equal(validation.topologicalOrder.length, 4);
    assert.deepEqual(validation.topologicalOrder, [
      "webhook_req",
      "mcp_client_step",
      "subagent_handoff_step",
      "mcp_server_exposer",
    ]);
  });

  it("Executes end-to-end MCP Client and Multi-Agent Handoff simulation in runtime engine", async () => {
    const engine = new WorkflowEngine();
    const result = await engine.execute(mcpMultiAgentGraph, { prNumber: 42 });

    assert.equal(result.status, "completed");
    assert.equal(result.logs.length, 4);

    // Verify MCP Client Step output
    const mcpLog = result.logs.find((l) => l.nodeId === "mcp_client_step");
    assert.equal(mcpLog?.status, "success");
    assert.equal(mcpLog?.outputs?.result?.mcpServer, "github-mcp");
    assert.equal(mcpLog?.outputs?.result?.toolCalled, "get_pull_request_files");

    // Verify Subagent Handoff Step output
    const handoffLog = result.logs.find((l) => l.nodeId === "subagent_handoff_step");
    assert.equal(handoffLog?.status, "success");
    assert.equal(handoffLog?.outputs?.handoffStatus, "delegation_completed");
    assert.ok(handoffLog?.outputs?.subagentResult.includes("[Subagent: KDD QA Reviewer]"));

    // Verify MCP Server Exposer output
    const serverLog = result.logs.find((l) => l.nodeId === "mcp_server_exposer");
    assert.equal(serverLog?.status, "success");
    assert.ok(serverLog?.outputs?.toolResponse);
  });

  it("Generates polyglot code for MCP pipelines in TypeScript, Python, PHP, and Go", () => {
    const tsCode = generatePolyglotCode(mcpMultiAgentGraph, "typescript");
    assert.ok(tsCode.sourceCode.includes("run_mcp_agent_pipeline"));
    assert.ok(tsCode.testCode.includes("node:test"));

    const pyCode = generatePolyglotCode(mcpMultiAgentGraph, "python");
    assert.ok(pyCode.sourceCode.includes("async def run_mcp_agent_pipeline"));

    const phpCode = generatePolyglotCode(mcpMultiAgentGraph, "php");
    assert.ok(phpCode.sourceCode.includes("public static function run_mcp_agent_pipeline"));

    const goCode = generatePolyglotCode(mcpMultiAgentGraph, "go");
    assert.ok(goCode.sourceCode.includes("func RunMcpAgentPipeline"));
  });
});
