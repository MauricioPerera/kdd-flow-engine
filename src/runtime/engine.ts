import {
  WorkflowGraph,
  WorkflowExecutionResult,
  NodeExecutionLog,
} from "../schema/workflow.js";
import { validateDAG } from "../validator/dag.js";
import { DynamicNodeRegistry } from "../nodes/dynamic.js";
import { CredentialVault } from "../vault/vault.js";

export type StepCallback = (log: NodeExecutionLog) => void;

export class WorkflowEngine {
  private onStepListeners: StepCallback[] = [];

  public onStep(callback: StepCallback) {
    this.onStepListeners.push(callback);
  }

  public async execute(
    graph: WorkflowGraph,
    initialPayload: Record<string, any> = {}
  ): Promise<WorkflowExecutionResult> {
    const startTime = Date.now();
    const validation = validateDAG(graph);
    const vault = CredentialVault.getInstance();

    if (!validation.valid) {
      const errorMsg = validation.errors.map((e) => `[${e.code}] ${e.message}`).join("; ");
      return {
        workflowId: graph.id,
        status: "failed",
        logs: [],
        finalOutputs: {},
        totalDurationMs: Date.now() - startTime,
        error: `Invalid DAG: ${errorMsg}`,
      };
    }

    const nodeOutputs = new Map<string, Record<string, any>>();
    const logs: NodeExecutionLog[] = [];
    const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

    // Ingoing edges per node
    const incomingEdges = new Map<string, typeof graph.edges>();
    for (const node of graph.nodes) {
      incomingEdges.set(node.id, []);
    }
    for (const edge of graph.edges) {
      incomingEdges.get(edge.targetNodeId)?.push(edge);
    }

    for (const nodeId of validation.topologicalOrder) {
      const node = nodeMap.get(nodeId);
      if (!node) continue;

      const nodeStart = Date.now();
      const nodeLog: NodeExecutionLog = {
        nodeId,
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
        // ignore callback errors
      }
    }
  }

  private async executeNode(
    node: WorkflowGraph["nodes"][0],
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
        return {
          data: {
            extractedText: text,
            parsed: true,
            timestamp: Date.now(),
          },
        };
      }

      case "http_request": {
        return {
          response: {
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
        const mappings = node.config.mappings || {};
        const result: Record<string, any> = {};
        const input = inputs.input || inputs;
        for (const [key, expr] of Object.entries(mappings)) {
          try {
            const fn = new Function("input", "inputs", `return (${expr});`);
            result[key] = fn(input, inputs);
          } catch {
            result[key] = expr;
          }
        }
        return { output: result };
      }

      case "iterator": {
        const items = Array.isArray(inputs.items) ? inputs.items : [inputs.items];
        return {
          item: items[0] || null,
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
        return { result: inputs };
    }
  }
}
