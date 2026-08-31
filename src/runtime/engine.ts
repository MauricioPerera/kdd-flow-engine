import { WorkflowGraph, WorkflowNode, WorkflowEdge } from "../schema/workflow.js";
import { validateDAG, ValidationResult } from "../validator/dag.js";
import { DynamicNodeRegistry } from "../nodes/dynamic.js";
import { CredentialVault } from "../vault/vault.js";

export interface NodeExecutionLog {
  nodeId: string;
  nodeType: string;
  label: string;
  status: "pending" | "running" | "success" | "error";
  startedAt: number;
  finishedAt?: number;
  durationMs?: number;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  error?: string;
}

export interface WorkflowExecutionResult {
  workflowId: string;
  status: "completed" | "failed";
  logs: NodeExecutionLog[];
  finalOutputs: Record<string, any>;
  totalDurationMs: number;
  error?: string;
}

export class WorkflowEngine {
  private onStepListeners: Array<(log: NodeExecutionLog) => void> = [];

  public onStep(listener: (log: NodeExecutionLog) => void) {
    this.onStepListeners.push(listener);
  }

  public async execute(
    graph: WorkflowGraph,
    initialPayload: Record<string, any> = {}
  ): Promise<WorkflowExecutionResult> {
    const startTime = Date.now();
    const validation = validateDAG(graph);

    if (!validation.valid) {
      const errorMsg = `Invalid workflow graph: ${validation.errors.map((e) => e.message).join("; ")}`;
      return {
        workflowId: graph.id,
        status: "failed",
        logs: [],
        finalOutputs: {},
        totalDurationMs: 0,
        error: errorMsg,
      };
    }

    const nodeOutputs = new Map<string, Record<string, any>>();
    const logs: NodeExecutionLog[] = [];
    const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
    const incomingEdges = new Map<string, WorkflowEdge[]>();

    for (const node of graph.nodes) {
      incomingEdges.set(node.id, []);
    }
    for (const edge of graph.edges) {
      incomingEdges.get(edge.targetNodeId)?.push(edge);
    }

    const vault = CredentialVault.getInstance();

    for (const nodeId of validation.topologicalOrder) {
      const node = nodeMap.get(nodeId);
      if (!node) continue;

      const nodeStart = Date.now();
      const nodeLog: NodeExecutionLog = {
        nodeId,
        nodeType: node.type,
        label: node.label,
        status: "running",
        startedAt: nodeStart,
        inputs: {},
        outputs: {},
      };

      // 1. Gather inputs from incoming edges
      const inputs: Record<string, any> = {};
      const edgesIn = incomingEdges.get(nodeId) || [];

      for (const edge of edgesIn) {
        const sourceOutput = nodeOutputs.get(edge.sourceNodeId);
        if (sourceOutput && edge.sourcePort in sourceOutput) {
          inputs[edge.targetPort] = sourceOutput[edge.sourcePort];
        }
      }

      // Merge initial payload if this is a trigger node
      if (node.type.startsWith("trigger_") && Object.keys(inputs).length === 0) {
        inputs["payload"] = initialPayload;
        inputs["body"] = initialPayload;
      }

      // 2. Resolve Vault secrets at the execution boundary
      const resolvedInputs = vault.resolveSecrets(inputs);
      const resolvedConfig = vault.resolveSecrets(node.config);
      const execNode = { ...node, config: resolvedConfig };

      nodeLog.inputs = vault.redactSecrets(resolvedInputs);

      try {
        // 3. Execute node logic
        const outputs = await this.executeNode(execNode, resolvedInputs);
        nodeOutputs.set(nodeId, outputs);

        nodeLog.status = "success";
        nodeLog.outputs = vault.redactSecrets(outputs);
        nodeLog.finishedAt = Date.now();
        nodeLog.durationMs = nodeLog.finishedAt - nodeStart;
      } catch (err: any) {
        nodeLog.status = "error";
        nodeLog.error = vault.redactSecrets(err?.message || String(err));
        nodeLog.finishedAt = Date.now();
        nodeLog.durationMs = nodeLog.finishedAt - nodeStart;
        logs.push(nodeLog);
        this.notifyStep(nodeLog);

        return {
          workflowId: graph.id,
          status: "failed",
          logs,
          finalOutputs: vault.redactSecrets(Object.fromEntries(nodeOutputs)),
          totalDurationMs: Date.now() - startTime,
          error: `Execution error at node '${node.label}' (${nodeId}): ${nodeLog.error}`,
        };
      }

      logs.push(nodeLog);
      this.notifyStep(nodeLog);
    }

    // Collect final outputs from nodes that have no outgoing edges
    const targetNodeIds = new Set(graph.edges.map((e) => e.sourceNodeId));
    const terminalOutputs: Record<string, any> = {};
    for (const node of graph.nodes) {
      if (!targetNodeIds.has(node.id)) {
        terminalOutputs[node.id] = nodeOutputs.get(node.id) || {};
      }
    }

    return {
      workflowId: graph.id,
      status: "completed",
      logs,
      finalOutputs: vault.redactSecrets(terminalOutputs),
      totalDurationMs: Date.now() - startTime,
    };
  }

  private notifyStep(log: NodeExecutionLog) {
    for (const listener of this.onStepListeners) {
      try {
        listener(log);
      } catch {
        // ignore listener errors
      }
    }
  }

  private async executeNode(
    node: WorkflowNode,
    inputs: Record<string, any>
  ): Promise<Record<string, any>> {
    // Dynamic API node
    if (node.type.startsWith("dynamic_") || node.dynamicDef) {
      const def = node.dynamicDef || DynamicNodeRegistry.getInstance().get(node.type);
      const endpoint = def?.endpoint?.url || node.config.endpointUrl || "https://api.example.com";
      const method = def?.endpoint?.method || node.config.method || "POST";

      return {
        response: {
          id: `res_${Date.now()}`,
          success: true,
          endpoint,
          method,
          receivedParams: inputs,
        },
        status: 200,
        ...inputs,
      };
    }

    switch (node.type) {
      case "trigger_manual":
      case "trigger_webhook":
        return {
          payload: inputs.payload || inputs.body || node.config.initialPayload || {},
          body: inputs.payload || inputs.body || node.config.initialPayload || {},
          headers: { "x-triggered-by": "kdd-flow-engine" },
        };

      case "trigger_cron":
        return {
          timestamp: Date.now(),
        };

      case "ai_agent": {
        const template = node.config.userPromptTemplate || "{{input}}";
        const prompt = template.replace(/\{\{input\}\}/g, JSON.stringify(inputs.input ?? inputs));
        const systemPrompt = node.config.systemPrompt || "You are an AI assistant.";
        const simulatedAnswer = `[AI Processed]: Response based on "${prompt.substring(0, 80)}..." using ${node.config.model || "gemini-2.5-flash"}`;
        return {
          response: simulatedAnswer,
          metadata: {
            model: node.config.model || "gemini-2.5-flash",
            systemPrompt,
            tokens: 42,
          },
        };
      }

      case "agent_handoff": {
        const task = String(inputs.task || JSON.stringify(inputs));
        const role = node.config.subagentRole || "Specialized Subagent";
        const model = node.config.targetModel || "claude-3-7-sonnet";
        return {
          subagentResult: `[Subagent: ${role}] Completed task: "${task.substring(0, 60)}..." using ${model}`,
          handoffStatus: "delegation_completed",
          role,
        };
      }

      case "mcp_client_call": {
        const serverName = node.config.serverName || "remote-mcp";
        const toolName = node.config.toolName || "execute_tool";
        const args = inputs.arguments || inputs;
        return {
          result: {
            mcpServer: serverName,
            toolCalled: toolName,
            transport: node.config.transport || "sse",
            arguments: args,
            output: `[MCP Output from ${serverName}/${toolName}] Success.`,
          },
          isError: false,
        };
      }

      case "mcp_server_tool": {
        const exposedName = node.config.exposedToolName || "exposed_flow_tool";
        return {
          toolResponse: {
            content: [{ type: "text", text: `[MCP Server Tool: ${exposedName}] Workflow execution payload processed.` }],
            isError: false,
            processedData: inputs,
          },
        };
      }

      case "ai_router": {
        const routes = node.config.routes || ["route_a", "route_b"];
        const inputStr = String(JSON.stringify(inputs.input || ""));
        const matched = routes.find((r: string) => inputStr.toLowerCase().includes(r.toLowerCase())) || routes[0];
        return {
          route: matched,
          confidence: 0.95,
        };
      }

      case "ai_extractor": {
        const text = String(inputs.text || "");
        const extractedObj = {
          name: "John Doe",
          email: "john@example.com",
          amount: 150,
          invoiceId: "INV-1234",
          rawText: text,
        };
        return {
          extracted: extractedObj,
          data: extractedObj,
          success: true,
          ...extractedObj,
        };
      }

      case "http_request": {
        return {
          data: {
            status: "ok",
            mocked: true,
            url: node.config.url,
            sentData: inputs.body,
          },
          status: 200,
        };
      }

      case "code_script": {
        const code = node.config.code || "return input;";
        const fn = new Function("input", "context", code);
        const res = fn(inputs.input, inputs);
        return {
          output: res,
          ...((typeof res === "object" && res !== null) ? res : {}),
        };
      }

      case "condition_branch": {
        const expr = node.config.expression || "true";
        const value = inputs.value ?? inputs;
        const fn = new Function("value", "inputs", `return Boolean(${expr});`);
        const isTrue = fn(value, inputs);
        return isTrue
          ? { true_branch: value, false_branch: null }
          : { true_branch: null, false_branch: value };
      }

      case "data_transform": {
        const source = inputs.source || inputs.input || inputs;
        const mappings = node.config.mappings || {};
        const transformed: Record<string, any> = {};

        for (const [targetKey, sourcePath] of Object.entries(mappings)) {
          if (typeof sourcePath === "string") {
            if (sourcePath.startsWith("source.")) {
              const prop = sourcePath.replace("source.", "");
              transformed[targetKey] = source?.[prop] ?? null;
            } else if (sourcePath.startsWith("input.")) {
              const prop = sourcePath.replace("input.", "");
              transformed[targetKey] = source?.[prop] ?? null;
            } else if (
              (sourcePath.startsWith("'") && sourcePath.endsWith("'")) ||
              (sourcePath.startsWith('"') && sourcePath.endsWith('"'))
            ) {
              transformed[targetKey] = sourcePath.slice(1, -1);
            } else if (source && typeof source === "object" && sourcePath in source) {
              transformed[targetKey] = source[sourcePath];
            } else {
              transformed[targetKey] = sourcePath;
            }
          } else {
            transformed[targetKey] = sourcePath;
          }
        }

        const res = Object.keys(transformed).length > 0 ? transformed : { ...source, mapped: true };
        return {
          transformed: res,
          output: res,
          ...res,
        };
      }

      case "iterator": {
        const items = Array.isArray(inputs.items) ? inputs.items : [inputs.items || "item_1"];
        return {
          item: items[0],
          index: 0,
          total: items.length,
        };
      }

      case "log_output": {
        const prefix = node.config.prefix || "[LOG]";
        return {
          passthrough: inputs.data ?? inputs,
          logged: true,
          prefix,
        };
      }

      default:
        return {
          result: inputs,
        };
    }
  }
}
