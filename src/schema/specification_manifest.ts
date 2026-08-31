import { WorkflowGraph, WorkflowNode, WorkflowEdge, PortDefinition } from "./workflow.js";
import { validateDAG } from "../validator/dag.js";
import { DynamicNodeRegistry } from "../nodes/dynamic.js";
import { CredentialVault } from "../vault/vault.js";
import { computeContractSha256 } from "../oracle/evaluator.js";

export interface SemanticStepSpecification {
  stepIndex: number;
  nodeId: string;
  nodeType: string;
  label: string;
  category: string;
  incomingDataBindings: Array<{
    targetPort: string;
    sourceNodeId: string;
    sourcePort: string;
  }>;
  nodeConfig: Record<string, any>;
  inputContract: Record<string, PortDefinition>;
  outputContract: Record<string, PortDefinition>;
  dynamicApiDetails?: {
    endpointUrl: string;
    httpMethod: string;
    authType: string;
    authSecretReference: string;
    rawDocSnippet?: string;
  };
  algorithmicLogicSummary: string;
}

export interface WorkflowSpecificationManifest {
  specificationVersion: string;
  workflowId: string;
  workflowName: string;
  workflowDescription: string;
  topologicalOrder: string[];
  semanticExecutionSteps: SemanticStepSpecification[];
  requiredEnvironmentSecrets: Array<{
    key: string;
    reference: string;
    description?: string;
  }>;
  frozenTestCases: Array<{
    id: string;
    name: string;
    inputPayload: Record<string, any>;
    assertions: Array<{
      targetNodeId?: string;
      path: string;
      operator: string;
      expectedValue: any;
      description?: string;
    }>;
  }>;
  contractSha256?: string;
  aiCodeGenerationInstructions: string;
}

export function buildWorkflowSpecificationManifest(
  graph: WorkflowGraph,
  targetLanguageHint: string = "any"
): WorkflowSpecificationManifest {
  const validation = validateDAG(graph);
  if (!validation.valid) {
    throw new Error(
      `Cannot build specification for invalid DAG: ${validation.errors.map((e) => e.message).join("; ")}`
    );
  }

  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const incomingEdges = new Map<string, WorkflowEdge[]>();
  for (const n of graph.nodes) incomingEdges.set(n.id, []);
  for (const e of graph.edges) incomingEdges.get(e.targetNodeId)?.push(e);

  const dynamicRegistry = DynamicNodeRegistry.getInstance();
  const semanticSteps: SemanticStepSpecification[] = [];
  const requiredSecrets = new Set<string>();

  validation.topologicalOrder.forEach((nodeId, index) => {
    const node = nodeMap.get(nodeId);
    if (!node) return;

    const edgesIn = incomingEdges.get(nodeId) || [];
    const bindings = edgesIn.map((e) => ({
      targetPort: e.targetPort,
      sourceNodeId: e.sourceNodeId,
      sourcePort: e.sourcePort,
    }));

    const dynamicDef = node.dynamicDef || dynamicRegistry.get(node.type);
    let dynamicApiDetails: SemanticStepSpecification["dynamicApiDetails"] = undefined;
    let logicSummary = "";

    if (dynamicDef || node.type.startsWith("dynamic_")) {
      const authRef = dynamicDef?.endpoint?.authSecretPlaceholder || "API_KEY";
      requiredSecrets.add(authRef);
      dynamicApiDetails = {
        endpointUrl: dynamicDef?.endpoint?.url || node.config.endpointUrl || "https://api.example.com",
        httpMethod: dynamicDef?.endpoint?.method || node.config.method || "POST",
        authType: dynamicDef?.endpoint?.authType || "bearer",
        authSecretReference: `$vault:${authRef}`,
        rawDocSnippet: dynamicDef?.documentationSummary,
      };
      logicSummary = `Perform authenticated HTTP ${dynamicApiDetails.httpMethod} request to ${dynamicApiDetails.endpointUrl} using secret token ${dynamicApiDetails.authSecretReference}. Merge input parameters into payload.`;
    } else {
      switch (node.type) {
        case "trigger_manual":
        case "trigger_webhook":
          logicSummary = `Entry point for workflow. Ingests initialPayload and emits 'payload'/'body' ports.`;
          break;
        case "ai_agent":
          logicSummary = `Invoke AI LLM (${node.config.model || "gemini-2.5-flash"}) with system prompt: "${node.config.systemPrompt || ""}" and template: "${node.config.userPromptTemplate || "{{input}}"}"`;
          break;
        case "condition_branch":
          logicSummary = `Evaluate boolean condition "${node.config.expression || "true"}". If truthy, emit to 'true_branch', otherwise emit to 'false_branch'.`;
          break;
        case "code_script":
          logicSummary = `Execute custom logic code: ${node.config.code || "return input;"}`;
          break;
        case "http_request":
          logicSummary = `Perform standard HTTP ${node.config.method || "GET"} to ${node.config.url}`;
          break;
        case "data_transform":
          logicSummary = `Transform input dictionary according to mappings: ${JSON.stringify(node.config.mappings || {})}`;
          break;
        case "log_output":
          logicSummary = `Log data with prefix '${node.config.prefix || "[LOG]"}' and pass through data.`;
          break;
        default:
          logicSummary = `Execute generic node ${node.type}`;
          break;
      }
    }

    // Inspect config for any $vault: references
    const configStr = JSON.stringify(node.config);
    const matches = configStr.matchAll(/\$vault:([A-Za-z0-9_]+)/g);
    for (const m of matches) {
      if (m[1]) requiredSecrets.add(m[1]);
    }

    semanticSteps.push({
      stepIndex: index + 1,
      nodeId: node.id,
      nodeType: node.type,
      label: node.label,
      category: node.type.split("_")[0] || "action",
      incomingDataBindings: bindings,
      nodeConfig: node.config,
      inputContract: node.inputs || {},
      outputContract: node.outputs || {},
      dynamicApiDetails,
      algorithmicLogicSummary: logicSummary,
    });
  });

  const vault = CredentialVault.getInstance();
  const secretsList = Array.from(requiredSecrets).map((secKey) => ({
    key: secKey,
    reference: `$vault:${secKey}`,
    description: vault.listKeys().find((k) => k.key === secKey)?.description || `Required secret for workflow`,
  }));

  const testCases = graph.contract?.testCases || [];
  const contractSha = graph.contract?.sealedSha256 || computeContractSha256(testCases);

  const instructions = `
AI CODE SYNTHESIS BLUEPRINT:
1. TARGET LANGUAGE: ${targetLanguageHint}
2. Read the 'semanticExecutionSteps' in the exact 'topologicalOrder' provided.
3. For each step, create an idiomatic function/method/block in ${targetLanguageHint} that:
   - Binds inputs from preceding nodes using 'incomingDataBindings'.
   - Resolves environment variables for any secret in 'requiredEnvironmentSecrets' (e.g. getenv, process.env, config).
   - Executes the logic detailed in 'algorithmicLogicSummary' and 'dynamicApiDetails'.
   - Returns a structured dictionary/map/struct containing node results and final outputs.
4. Implement a comprehensive unit test suite in the standard test runner of ${targetLanguageHint} asserting all scenarios in 'frozenTestCases'.
5. Guarantee zero hallucinations: follow all port types and field mappings strictly.
`.trim();

  return {
    specificationVersion: "kdd-spec-v1.0",
    workflowId: graph.id,
    workflowName: graph.name,
    workflowDescription: graph.description || "",
    topologicalOrder: validation.topologicalOrder,
    semanticExecutionSteps: semanticSteps,
    requiredEnvironmentSecrets: secretsList,
    frozenTestCases: testCases,
    contractSha256: contractSha,
    aiCodeGenerationInstructions: instructions,
  };
}
