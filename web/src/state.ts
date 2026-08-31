import { WorkflowGraph, WorkflowNode, WorkflowEdge, DynamicNodeDefinition } from "../../src/schema/workflow.js";
import { createFlowStore, FlowStore } from "../../src/mcp/tools.js";
import { validateDAG, ValidationResult } from "../../src/validator/dag.js";
import { WorkflowEngine } from "../../src/runtime/engine.js";
import { generatePolyglotCode, GeneratedCode, TargetLanguage } from "../../src/generator/polyglot.js";
import { NODE_CATALOG, NodeTemplate } from "../../src/nodes/catalog.js";
import { DynamicNodeRegistry, synthesizeNodeFromApiDoc, ApiDocInput } from "../../src/nodes/dynamic.js";
import { deserializeWorkflowFromUrl, serializeWorkflowToUrl } from "../../src/sharing/url_serializer.js";

export interface AppState {
  store: FlowStore;
  selectedNodeId: string | null;
  validation: ValidationResult;
  isSimulating: boolean;
  activeExecutingNodeId: string | null;
  lastExecutionResult: any | null;
  generatedCode: GeneratedCode | null;
  targetLang: TargetLanguage;
}

// Check if a shared workflow is present in the URL hash
let initialSharedGraph: WorkflowGraph | undefined = undefined;
if (typeof window !== "undefined" && window.location.hash) {
  const parsed = deserializeWorkflowFromUrl(window.location.hash);
  if (parsed) {
    initialSharedGraph = parsed;
  }
}

export const appState: AppState = {
  store: createFlowStore(initialSharedGraph),
  selectedNodeId: initialSharedGraph?.nodes[0]?.id || "agent_1",
  validation: { valid: true, errors: [], topologicalOrder: [] },
  isSimulating: false,
  activeExecutingNodeId: null,
  lastExecutionResult: null,
  generatedCode: null,
  targetLang: "typescript",
};

export function updateValidation() {
  appState.validation = validateDAG(appState.store.getGraph());
}

export function selectNode(nodeId: string | null) {
  appState.selectedNodeId = nodeId;
  window.dispatchEvent(new CustomEvent("node-selected", { detail: { nodeId } }));
}

export function addNodeFromCatalog(type: string, x = 200, y = 200) {
  const template = (NODE_CATALOG as any)[type];
  const dynamicDef = DynamicNodeRegistry.getInstance().get(type);

  const count = appState.store.getGraph().nodes.filter((n) => n.type === type).length + 1;
  const id = `${type}_${count}_${Date.now().toString(36).slice(-4)}`;

  const label = template ? `${template.label} ${count}` : dynamicDef ? `${dynamicDef.label} ${count}` : `Node ${count}`;
  const inputs = template ? JSON.parse(JSON.stringify(template.defaultInputs)) : dynamicDef ? JSON.parse(JSON.stringify(dynamicDef.inputs)) : {};
  const outputs = template ? JSON.parse(JSON.stringify(template.defaultOutputs)) : dynamicDef ? JSON.parse(JSON.stringify(dynamicDef.outputs)) : {};
  const config = template ? JSON.parse(JSON.stringify(template.defaultConfig)) : dynamicDef ? JSON.parse(JSON.stringify(dynamicDef.defaultConfig)) : {};

  const newNode: WorkflowNode = {
    id,
    type,
    label,
    position: { x, y },
    inputs,
    outputs,
    config,
    dynamicDef,
  };

  appState.store.updateGraph((g) => {
    g.nodes.push(newNode);
  });
  updateValidation();
  selectNode(id);
}

export function createAndAddDynamicNode(input: ApiDocInput) {
  const def = synthesizeNodeFromApiDoc(input);
  window.dispatchEvent(new CustomEvent("dynamic-node-registered", { detail: def }));
  addNodeFromCatalog(def.typeId, 300, 200);
}

export function removeSelectedNode() {
  if (!appState.selectedNodeId) return;
  const idToRemove = appState.selectedNodeId;
  appState.store.updateGraph((g) => {
    g.nodes = g.nodes.filter((n) => n.id !== idToRemove);
    g.edges = g.edges.filter((e) => e.sourceNodeId !== idToRemove && e.targetNodeId !== idToRemove);
  });
  appState.selectedNodeId = null;
  updateValidation();
  window.dispatchEvent(new CustomEvent("workflow-updated"));
}

export async function runSimulation(initialPayload: any = {}) {
  appState.isSimulating = true;
  appState.lastExecutionResult = null;
  window.dispatchEvent(new CustomEvent("simulation-started"));

  const engine = new WorkflowEngine();
  engine.onStep((log) => {
    appState.activeExecutingNodeId = log.nodeId;
    window.dispatchEvent(new CustomEvent("simulation-step", { detail: log }));
  });

  const result = await engine.execute(appState.store.getGraph(), initialPayload);
  appState.isSimulating = false;
  appState.activeExecutingNodeId = null;
  appState.lastExecutionResult = result;
  window.dispatchEvent(new CustomEvent("simulation-finished", { detail: result }));
  return result;
}

export function updateGeneratedCode() {
  try {
    appState.generatedCode = generatePolyglotCode(
      appState.store.getGraph(),
      appState.targetLang
    );
  } catch (err: any) {
    appState.generatedCode = {
      language: appState.targetLang,
      sourceCode: `// Validation Error: ${err.message}`,
      testCode: `// Cannot generate tests for invalid DAG`,
      workflowId: appState.store.getGraph().id,
      workflowName: appState.store.getGraph().name,
    };
  }
}
