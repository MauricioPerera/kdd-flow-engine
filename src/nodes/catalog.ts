import { NodeType, PortDefinition } from "../schema/workflow.js";

export interface NodeTemplate {
  type: NodeType;
  label: string;
  category: "trigger" | "ai" | "logic" | "action" | "data";
  description: string;
  defaultInputs: Record<string, PortDefinition>;
  defaultOutputs: Record<string, PortDefinition>;
  defaultConfig: Record<string, any>;
}

export const NODE_CATALOG: Record<NodeType, NodeTemplate> = {
  trigger_manual: {
    type: "trigger_manual",
    label: "Manual Trigger",
    category: "trigger",
    description: "Start workflow execution manually with optional test payload",
    defaultInputs: {},
    defaultOutputs: {
      payload: { id: "payload", name: "Payload", type: "object", description: "Trigger payload" },
    },
    defaultConfig: {
      initialPayload: { message: "Hello AI workflow" },
    },
  },
  trigger_webhook: {
    type: "trigger_webhook",
    label: "Webhook Trigger",
    category: "trigger",
    description: "Triggers the flow on HTTP POST/GET request",
    defaultInputs: {},
    defaultOutputs: {
      body: { id: "body", name: "Body", type: "object", description: "Request body" },
      headers: { id: "headers", name: "Headers", type: "object", description: "Request headers" },
    },
    defaultConfig: {
      path: "/webhook/v1/trigger",
      method: "POST",
    },
  },
  trigger_cron: {
    type: "trigger_cron",
    label: "Cron Schedule",
    category: "trigger",
    description: "Trigger flow on a recurring time schedule",
    defaultInputs: {},
    defaultOutputs: {
      timestamp: { id: "timestamp", name: "Timestamp", type: "number", description: "Execution epoch ms" },
    },
    defaultConfig: {
      cron: "0 * * * *",
    },
  },
  ai_agent: {
    type: "ai_agent",
    label: "AI Agent",
    category: "ai",
    description: "Executes an LLM reasoning step with customizable system prompt and instructions",
    defaultInputs: {
      input: { id: "input", name: "Input Data", type: "any", required: true },
      context: { id: "context", name: "Context / Knowledge", type: "string", required: false },
    },
    defaultOutputs: {
      response: { id: "response", name: "AI Response", type: "string" },
      metadata: { id: "metadata", name: "Token Usage / Meta", type: "object" },
    },
    defaultConfig: {
      model: "gemini-2.5-flash",
      systemPrompt: "You are an expert AI workflow agent following KDD principles.",
      userPromptTemplate: "Process the following input: {{input}}",
      temperature: 0.2,
    },
  },
  ai_router: {
    type: "ai_router",
    label: "AI Classifier Router",
    category: "ai",
    description: "Classifies incoming text or object into specific decision paths",
    defaultInputs: {
      input: { id: "input", name: "Input", type: "any", required: true },
    },
    defaultOutputs: {
      route: { id: "route", name: "Matched Route", type: "string" },
      confidence: { id: "confidence", name: "Confidence Score", type: "number" },
    },
    defaultConfig: {
      routes: ["support", "sales", "technical", "other"],
      model: "gemini-2.5-flash",
    },
  },
  ai_extractor: {
    type: "ai_extractor",
    label: "AI Structured Extractor",
    category: "ai",
    description: "Extracts structured JSON entity matching target schema from unstructured text",
    defaultInputs: {
      text: { id: "text", name: "Raw Text", type: "string", required: true },
    },
    defaultOutputs: {
      data: { id: "data", name: "Extracted JSON", type: "object" },
    },
    defaultConfig: {
      targetSchema: {
        name: "string",
        intent: "string",
        priority: "low | medium | high",
      },
    },
  },
  http_request: {
    type: "http_request",
    label: "HTTP Request",
    category: "action",
    description: "Sends an external HTTP/REST request",
    defaultInputs: {
      body: { id: "body", name: "Request Body", type: "any" },
      query: { id: "query", name: "Query Params", type: "object" },
    },
    defaultOutputs: {
      response: { id: "response", name: "Response Body", type: "any" },
      status: { id: "status", name: "Status Code", type: "number" },
    },
    defaultConfig: {
      method: "POST",
      url: "https://api.example.com/process",
      headers: { "Content-Type": "application/json" },
    },
  },
  code_script: {
    type: "code_script",
    label: "Code Script",
    category: "action",
    description: "Executes custom transformation script (JavaScript or Python)",
    defaultInputs: {
      input: { id: "input", name: "Input Data", type: "any" },
    },
    defaultOutputs: {
      output: { id: "output", name: "Script Output", type: "any" },
    },
    defaultConfig: {
      language: "javascript",
      code: "return { result: input.map(x => x * 2) };",
    },
  },
  condition_branch: {
    type: "condition_branch",
    label: "Condition Branch",
    category: "logic",
    description: "Evaluates an expression and routes data to True or False branch",
    defaultInputs: {
      value: { id: "value", name: "Input Value", type: "any", required: true },
    },
    defaultOutputs: {
      true_branch: { id: "true_branch", name: "If True", type: "any" },
      false_branch: { id: "false_branch", name: "If False", type: "any" },
    },
    defaultConfig: {
      expression: "value.status === 'success'",
    },
  },
  data_transform: {
    type: "data_transform",
    label: "Data Transform",
    category: "data",
    description: "Maps and shapes data using JSON path transformations",
    defaultInputs: {
      input: { id: "input", name: "Input Data", type: "any", required: true },
    },
    defaultOutputs: {
      output: { id: "output", name: "Transformed Data", type: "any" },
    },
    defaultConfig: {
      mappings: {
        summary: "input.response",
        processedAt: "new Date().toISOString()",
      },
    },
  },
  iterator: {
    type: "iterator",
    label: "Iterator (Loop)",
    category: "logic",
    description: "Iterates over an array and emits each element sequentially",
    defaultInputs: {
      items: { id: "items", name: "Items Array", type: "array", required: true },
    },
    defaultOutputs: {
      item: { id: "item", name: "Current Item", type: "any" },
      index: { id: "index", name: "Current Index", type: "number" },
    },
    defaultConfig: {
      batchSize: 1,
    },
  },
  log_output: {
    type: "log_output",
    label: "Log Output",
    category: "action",
    description: "Logs data to execution trace and console for debugging",
    defaultInputs: {
      data: { id: "data", name: "Data to Log", type: "any", required: true },
    },
    defaultOutputs: {
      passthrough: { id: "passthrough", name: "Passthrough", type: "any" },
    },
    defaultConfig: {
      prefix: "[LOG]",
    },
  },
};
