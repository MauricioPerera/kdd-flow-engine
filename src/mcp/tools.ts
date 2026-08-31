import { z } from "zod";
import { registerTool, defineTool } from "fastwebmcp";
import {
  WorkflowGraph,
  WorkflowNode,
  WorkflowEdge,
  WorkflowContract,
  WorkflowTestCaseSchema,
} from "../schema/workflow.js";
import { validateDAG, ValidationResult } from "../validator/dag.js";
import { WorkflowEngine } from "../runtime/engine.js";
import { generatePolyglotCode, GeneratedCode, TargetLanguage } from "../generator/polyglot.js";
import { NODE_CATALOG } from "../nodes/catalog.js";
import { DynamicNodeRegistry, synthesizeNodeFromApiDoc, ApiDocInput } from "../nodes/dynamic.js";
import { CredentialVault } from "../vault/vault.js";
import {
  runFrozenOracleGate,
  computeContractSha256,
  generateKddContractMarkdown,
  GateVerdict,
} from "../oracle/evaluator.js";
import { getLocale, setLocale, Locale, t } from "../i18n/translations.js";
import {
  buildWorkflowSpecificationManifest,
  WorkflowSpecificationManifest,
} from "../schema/specification_manifest.js";
import {
  serializeWorkflowToUrl,
  deserializeWorkflowFromUrl,
} from "../sharing/url_serializer.js";

export interface FlowStore {
  graph: WorkflowGraph;
  listeners: Array<(graph: WorkflowGraph) => void>;
  updateGraph: (modifier: (g: WorkflowGraph) => void) => void;
  getGraph: () => WorkflowGraph;
  subscribe: (cb: (g: WorkflowGraph) => void) => () => void;
}

export function createFlowStore(initialGraph?: WorkflowGraph): FlowStore {
  let graph: WorkflowGraph = initialGraph || {
    id: "workflow_default",
    name: "AI-First Workflow",
    description: "Built with KDD methodology and fastwebmcp",
    version: "1.0.0",
    nodes: [
      {
        id: "trigger_1",
        type: "trigger_manual",
        label: "Manual Trigger",
        position: { x: 80, y: 180 },
        inputs: {},
        outputs: { payload: { id: "payload", name: "Payload", type: "object" } },
        config: { initialPayload: { query: "Analyze customer sentiment" } },
      },
      {
        id: "agent_1",
        type: "ai_agent",
        label: "Sentiment Analyst Agent",
        position: { x: 380, y: 180 },
        inputs: { input: { id: "input", name: "Input Data", type: "any" } },
        outputs: { response: { id: "response", name: "AI Response", type: "string" } },
        config: {
          model: "gemini-2.5-flash",
          systemPrompt: "Analyze the tone and classify sentiment as positive, neutral, or negative.",
          userPromptTemplate: "Input to classify: {{input}}",
        },
      },
      {
        id: "log_1",
        type: "log_output",
        label: "Log Output",
        position: { x: 680, y: 180 },
        inputs: { data: { id: "data", name: "Data to Log", type: "any" } },
        outputs: { passthrough: { id: "passthrough", name: "Passthrough", type: "any" } },
        config: { prefix: "[ANALYSIS RESULT]" },
      },
    ],
    edges: [
      { id: "e1", sourceNodeId: "trigger_1", sourcePort: "payload", targetNodeId: "agent_1", targetPort: "input" },
      { id: "e2", sourceNodeId: "agent_1", sourcePort: "response", targetNodeId: "log_1", targetPort: "data" },
    ],
    contract: {
      id: "contract_default",
      workflowId: "workflow_default",
      title: "Sentiment Analysis Pipeline Contract",
      intent: "Verify that incoming text produces classified sentiment and log outputs",
      testCases: [
        {
          id: "tc_positive",
          name: "Standard query processing",
          inputPayload: { query: "I love this product" },
          assertions: [
            {
              targetNodeId: "agent_1",
              path: "response",
              operator: "contains",
              expectedValue: "[AI Processed]",
              description: "AI agent generates response",
            },
            {
              targetNodeId: "log_1",
              path: "logged",
              operator: "equals",
              expectedValue: true,
              description: "Log output records result",
            },
          ],
        },
      ],
      sealedSha256: "auto",
      invariants: [
        "Every payload generates an AI response",
        "Log output is always executed as the terminal node",
      ],
    },
    variables: {},
    metadata: {},
  };

  if (graph.contract && graph.contract.testCases) {
    graph.contract.sealedSha256 = computeContractSha256(graph.contract.testCases);
  }

  const listeners: Array<(graph: WorkflowGraph) => void> = [];

  const notify = () => {
    for (const cb of listeners) cb(graph);
  };

  return {
    graph,
    listeners,
    getGraph: () => graph,
    updateGraph: (modifier) => {
      modifier(graph);
      notify();
    },
    subscribe: (cb) => {
      listeners.push(cb);
      return () => {
        const idx = listeners.indexOf(cb);
        if (idx !== -1) listeners.splice(idx, 1);
      };
    },
  };
}

export function registerFlowWebMcpTools(store: FlowStore) {
  // 1. Tool: set_agent_language
  registerTool({
    name: "set_agent_language",
    description: "Sets the workspace display and communication language ('es' for Spanish, 'en' for English, 'pt' for Portuguese).",
    inputSchema: z.object({
      locale: z.enum(["es", "en", "pt"]).describe("Target language code"),
    }),
    execute: async ({ locale }) => {
      setLocale(locale);
      return {
        success: true,
        currentLocale: locale,
        message: `Language updated to ${locale.toUpperCase()}.`,
      };
    },
  });

  // 2. Tool: create_workflow
  registerTool({
    name: "create_workflow",
    description: "Initializes or resets a new workflow graph with a title and description.",
    inputSchema: z.object({
      id: z.string().min(1).describe("Unique workflow identifier"),
      name: z.string().min(1).describe("Workflow display name"),
      description: z.string().optional().describe("Workflow purpose"),
    }),
    execute: async ({ id, name, description }) => {
      store.updateGraph((g) => {
        g.id = id;
        g.name = name;
        g.description = description || "";
        g.nodes = [];
        g.edges = [];
        g.contract = undefined;
      });
      return { success: true, message: `Workflow '${name}' (${id}) initialized.` };
    },
  });

  // 3. Tool: add_node
  registerTool({
    name: "add_node",
    description: "Adds a new node (trigger, AI agent, condition, transformer, HTTP, custom dynamic API node, etc.) to the workflow.",
    inputSchema: z.object({
      id: z.string().min(1).describe("Unique node identifier"),
      type: z.string().min(1).describe("Node type from standard or dynamic catalog"),
      label: z.string().min(1).describe("User-friendly node label"),
      x: z.number().optional().default(100).describe("X position on canvas"),
      y: z.number().optional().default(100).describe("Y position on canvas"),
      config: z.record(z.string(), z.any()).optional().default({}).describe("Custom node configuration"),
    }),
    execute: async ({ id, type, label, x, y, config }) => {
      const template = (NODE_CATALOG as any)[type];
      const dynamicDef = DynamicNodeRegistry.getInstance().get(type);

      const inputs = template
        ? { ...template.defaultInputs }
        : dynamicDef
        ? { ...dynamicDef.inputs }
        : {};

      const outputs = template
        ? { ...template.defaultOutputs }
        : dynamicDef
        ? { ...dynamicDef.outputs }
        : {};

      const defaultConfig = template
        ? template.defaultConfig
        : dynamicDef
        ? dynamicDef.defaultConfig
        : {};

      const newNode: WorkflowNode = {
        id,
        type,
        label,
        position: { x: x ?? 100, y: y ?? 100 },
        inputs,
        outputs,
        config: { ...defaultConfig, ...(config || {}) },
        dynamicDef,
      };

      store.updateGraph((g) => {
        const existingIdx = g.nodes.findIndex((n) => n.id === id);
        if (existingIdx >= 0) {
          g.nodes[existingIdx] = newNode;
        } else {
          g.nodes.push(newNode);
        }
      });

      return { success: true, nodeId: id, message: `Node '${label}' (${type}) added.` };
    },
  });

  // 4. Tool: connect_nodes
  registerTool({
    name: "connect_nodes",
    description: "Connects an output port of a source node to an input port of a target node.",
    inputSchema: z.object({
      sourceNodeId: z.string().describe("Source node ID"),
      sourcePort: z.string().describe("Source port name/ID"),
      targetNodeId: z.string().describe("Target node ID"),
      targetPort: z.string().describe("Target port name/ID"),
    }),
    execute: async ({ sourceNodeId, sourcePort, targetNodeId, targetPort }) => {
      const edgeId = `e_${sourceNodeId}_${sourcePort}_to_${targetNodeId}_${targetPort}`;
      const newEdge: WorkflowEdge = {
        id: edgeId,
        sourceNodeId,
        sourcePort,
        targetNodeId,
        targetPort,
      };

      store.updateGraph((g) => {
        const existing = g.edges.find((e) => e.id === edgeId);
        if (!existing) {
          g.edges.push(newEdge);
        }
      });

      const validation = validateDAG(store.getGraph());

      return {
        success: true,
        edgeId,
        validDag: validation.valid,
        warnings: validation.errors.filter((e) => e.severity === "warning").map((e) => e.message),
      };
    },
  });

  // 5. Tool: configure_node
  registerTool({
    name: "configure_node",
    description: "Updates parameters, prompts, or config for a specific node in the workflow.",
    inputSchema: z.object({
      nodeId: z.string().describe("ID of the node to update"),
      label: z.string().optional().describe("Updated label"),
      configUpdates: z.record(z.string(), z.any()).describe("Key-value config updates"),
    }),
    execute: async ({ nodeId, label, configUpdates }) => {
      let found = false;
      store.updateGraph((g) => {
        const node = g.nodes.find((n) => n.id === nodeId);
        if (node) {
          found = true;
          if (label) node.label = label;
          node.config = { ...node.config, ...configUpdates };
        }
      });

      if (!found) {
        throw new Error(`Node with ID '${nodeId}' not found.`);
      }

      return { success: true, message: `Node '${nodeId}' updated.` };
    },
  });

  // 6. Tool: generate_node_from_api_doc
  registerTool({
    name: "generate_node_from_api_doc",
    description: "Synthesizes a brand new custom node type on-the-fly from API documentation or cURL example (e.g. Stripe, WhatsApp, Custom API).",
    inputSchema: z.object({
      serviceName: z.string().describe("Name of the service e.g. stripe, github, whatsapp"),
      operationName: z.string().describe("Specific operation e.g. create_charge, create_customer, send_message"),
      description: z.string().describe("What this node does"),
      endpointUrl: z.string().describe("HTTP endpoint URL"),
      method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).default("POST").describe("HTTP method"),
      authType: z.enum(["bearer", "api_key", "basic", "none"]).default("bearer").describe("Authentication type"),
      authSecretPlaceholder: z.string().optional().describe("Environment secret key name (e.g. STRIPE_API_KEY)"),
      rawDocOrCurl: z.string().optional().describe("Raw API documentation text or cURL snippet"),
      detectedFields: z.array(z.object({
        name: z.string(),
        type: z.enum(["string", "number", "boolean", "object", "array"]).default("string"),
        required: z.boolean().optional(),
        description: z.string().optional(),
      })).optional().describe("Input parameters extracted from the doc"),
      detectedOutputs: z.array(z.object({
        name: z.string(),
        type: z.enum(["string", "number", "boolean", "object", "array"]).default("string"),
        description: z.string().optional(),
      })).optional().describe("Output parameters extracted from response schema"),
    }),
    execute: async (input) => {
      const nodeDef = synthesizeNodeFromApiDoc(input as any);
      return {
        success: true,
        typeId: nodeDef.typeId,
        label: nodeDef.label,
        inputPorts: Object.keys(nodeDef.inputs),
        outputPorts: Object.keys(nodeDef.outputs),
        message: `Dynamic node '${nodeDef.label}' (${nodeDef.typeId}) synthesized and registered successfully.`,
      };
    },
  });

  // 7. Tool: list_vault_secret_keys
  registerTool({
    name: "list_vault_secret_keys",
    description: "Lists the names and status of configured credential keys in the user's local vault. Secret values are never exposed to AI agents.",
    inputSchema: z.object({}),
    execute: async () => {
      const vault = CredentialVault.getInstance();
      const keys = vault.listKeys();
      return {
        configuredKeys: keys,
        totalKeys: keys.length,
        message: "Secret values remain isolated in the client-side vault.",
      };
    },
  });

  // 8. Tool: define_workflow_frozen_oracle
  registerTool({
    name: "define_workflow_frozen_oracle",
    description: "Defines and cryptographically seals the frozen acceptance test suite (KDD Frozen Oracle) that this workflow must satisfy.",
    inputSchema: z.object({
      title: z.string().describe("Title of the acceptance contract"),
      intent: z.string().describe("Intent and business goals of this workflow"),
      testCases: z.array(WorkflowTestCaseSchema).min(1).describe("List of golden test cases and assertions"),
      invariants: z.array(z.string()).optional().default([]).describe("Key invariant assertions"),
    }),
    execute: async ({ title, intent, testCases, invariants }) => {
      const sha256 = computeContractSha256(testCases as any);
      const contract: WorkflowContract = {
        id: `contract_${store.getGraph().id}`,
        workflowId: store.getGraph().id,
        title,
        intent,
        testCases: testCases as any,
        sealedSha256: sha256,
        invariants: invariants || [],
      };

      store.updateGraph((g) => {
        g.contract = contract;
      });

      return {
        success: true,
        sealedSha256: sha256,
        testCaseCount: testCases.length,
        message: `Workflow contract sealed with SHA256: ${sha256}`,
      };
    },
  });

  // 9. Tool: run_frozen_oracle_gate
  registerTool({
    name: "run_frozen_oracle_gate",
    description: "Runs the deterministic KDD Frozen Oracle Gate over the active workflow, executing all test cases and checking invariant assertions.",
    inputSchema: z.object({}),
    execute: async () => {
      const graph = store.getGraph();
      const verdict = await runFrozenOracleGate(graph);
      return verdict;
    },
  });

  // 10. Tool: generate_shareable_workflow_url
  registerTool({
    name: "generate_shareable_workflow_url",
    description: "Serializes the current workflow graph into a standalone, privacy-safe, shareable URL hash. Secrets are excluded.",
    inputSchema: z.object({
      baseUrl: z.string().optional().default("https://mauricioperera.github.io/kdd-flow-engine/").describe("Base URL of the deployment"),
    }),
    execute: async ({ baseUrl }) => {
      const graph = store.getGraph();
      const url = serializeWorkflowToUrl(graph, baseUrl);
      return {
        shareableUrl: url,
        workflowId: graph.id,
        workflowName: graph.name,
        nodeCount: graph.nodes.length,
      };
    },
  });

  // 11. Tool: get_complete_workflow_specification
  registerTool({
    name: "get_complete_workflow_specification",
    description: "Returns the complete, self-contained, language-agnostic functional specification manifest of the workflow. Contains all topological steps, port bindings, dynamic API schemas, opaque vault references, and frozen test oracles so an AI agent can synthesize production code in ANY target language (Elixir, Rust, C#, Zig, Solidity, Ruby, COBOL, etc.).",
    inputSchema: z.object({
      targetLanguageHint: z.string().optional().default("any").describe("Target language or framework hint e.g. 'Rust with Tokio', 'Elixir with Broadway', 'Kotlin Spring'"),
    }),
    execute: async ({ targetLanguageHint }) => {
      const graph = store.getGraph();
      const manifest = buildWorkflowSpecificationManifest(graph, targetLanguageHint);
      return manifest;
    },
  });

  // 12. Tool: export_kdd_workflow_contract
  registerTool({
    name: "export_kdd_workflow_contract",
    description: "Generates the official KDD Task Contract markdown (.workflow.contract.md) with frozen oracle and sha256 seal.",
    inputSchema: z.object({}),
    execute: async () => {
      const graph = store.getGraph();
      if (!graph.contract) {
        throw new Error("No KDD contract defined for this workflow. Use define_workflow_frozen_oracle first.");
      }
      const md = generateKddContractMarkdown(graph, graph.contract);
      return {
        contractMarkdown: md,
        sha256: graph.contract.sealedSha256,
      };
    },
  });

  // 13. Tool: get_workflow_graph
  registerTool({
    name: "get_workflow_graph",
    description: "Returns the complete current workflow graph specification, node count, contract status, and DAG validation status.",
    inputSchema: z.object({}),
    execute: async () => {
      const graph = store.getGraph();
      const validation = validateDAG(graph);
      return {
        graph,
        nodeCount: graph.nodes.length,
        edgeCount: graph.edges.length,
        hasContract: Boolean(graph.contract),
        contractSha256: graph.contract?.sealedSha256,
        validation,
      };
    },
  });

  // 14. Tool: validate_workflow
  registerTool({
    name: "validate_workflow",
    description: "Runs deterministic KDD verification over the current workflow DAG.",
    inputSchema: z.object({}),
    execute: async () => {
      const graph = store.getGraph();
      const validation = validateDAG(graph);
      return validation;
    },
  });

  // 15. Tool: simulate_execution
  registerTool({
    name: "simulate_execution",
    description: "Runs the workflow engine in simulation mode, returning step-by-step trace and final outputs.",
    inputSchema: z.object({
      initialPayload: z.record(z.string(), z.any()).optional().default({}).describe("Payload for trigger node"),
    }),
    execute: async ({ initialPayload }) => {
      const graph = store.getGraph();
      const engine = new WorkflowEngine();
      const result = await engine.execute(graph, initialPayload);
      return result;
    },
  });

  // 16. Tool: export_code
  registerTool({
    name: "export_code",
    description: "Synthesizes executable target code (TypeScript, Python, PHP, or Go) and test oracles from the flow specification.",
    inputSchema: z.object({
      targetLanguage: z.enum(["typescript", "python", "php", "go"]).default("typescript").describe("Target language"),
    }),
    execute: async ({ targetLanguage }) => {
      const graph = store.getGraph();
      const generated = generatePolyglotCode(graph, targetLanguage as TargetLanguage);
      return generated;
    },
  });
}
