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

export const NODE_CATALOG: Record<string, NodeTemplate> = {
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
      extracted: { id: "extracted", name: "Structured Entity", type: "object" },
      success: { id: "success", name: "Extracted Boolean", type: "boolean" },
    },
    defaultConfig: {
      targetSchema: {
        name: "string",
        email: "string",
        amount: "number",
      },
    },
  },
  agent_handoff: {
    type: "agent_handoff",
    label: "Agent Subagent Handoff",
    category: "ai",
    description: "Delegates complex sub-tasks to a specialized secondary agent (e.g. Coder, Reviewer, Researcher)",
    defaultInputs: {
      task: { id: "task", name: "Task Prompt", type: "string", required: true },
      parentContext: { id: "parentContext", name: "Parent Context", type: "any" },
    },
    defaultOutputs: {
      subagentResult: { id: "subagentResult", name: "Subagent Result", type: "any" },
      handoffStatus: { id: "handoffStatus", name: "Status", type: "string" },
    },
    defaultConfig: {
      subagentRole: "Code Reviewer Agent",
      targetModel: "claude-3-7-sonnet",
      handoffInstruction: "Review code against KDD contracts and report verdict.",
    },
  },
  mcp_client_call: {
    type: "mcp_client_call",
    label: "MCP Client: Call Tool",
    category: "action",
    description: "Calls a tool on a remote or local MCP server via stdio, SSE, HTTP, or WebMCP",
    defaultInputs: {
      arguments: { id: "arguments", name: "Tool Arguments", type: "object", required: true },
    },
    defaultOutputs: {
      result: { id: "result", name: "Tool Result", type: "any" },
      isError: { id: "isError", name: "Is Error", type: "boolean" },
    },
    defaultConfig: {
      serverName: "github-mcp",
      toolName: "create_issue",
      transport: "sse",
      endpointUrl: "http://localhost:3000/sse",
    },
  },
  mcp_server_tool: {
    type: "mcp_server_tool",
    label: "MCP Server: Expose Tool",
    category: "action",
    description: "Exposes this workflow step or subgraph as a callable MCP Tool Schema for external AI clients",
    defaultInputs: {
      inputData: { id: "inputData", name: "Input Schema Data", type: "any" },
    },
    defaultOutputs: {
      toolResponse: { id: "toolResponse", name: "Tool Response", type: "any" },
    },
    defaultConfig: {
      exposedToolName: "run_fraud_verification",
      toolDescription: "Runs fraud verification on customer transaction",
      inputSchemaJson: {
        type: "object",
        properties: {
          transactionId: { type: "string" },
          amount: { type: "number" },
        },
        required: ["transactionId", "amount"],
      },
    },
  },
  http_request: {
    type: "http_request",
    label: "HTTP Request",
    category: "action",
    description: "Make an outgoing HTTP REST / API request",
    defaultInputs: {
      body: { id: "body", name: "Request Body", type: "any" },
      params: { id: "params", name: "Query Params", type: "object" },
    },
    defaultOutputs: {
      data: { id: "data", name: "Response Data", type: "any" },
      status: { id: "status", name: "Status Code", type: "number" },
    },
    defaultConfig: {
      url: "https://api.example.com/data",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
  },
  code_script: {
    type: "code_script",
    label: "Code Script (JS)",
    category: "action",
    description: "Execute custom JavaScript transform or calculation",
    defaultInputs: {
      input: { id: "input", name: "Input", type: "any" },
    },
    defaultOutputs: {
      output: { id: "output", name: "Output", type: "any" },
    },
    defaultConfig: {
      code: "return { processed: true, value: input };",
    },
  },
  condition_branch: {
    type: "condition_branch",
    label: "Condition (If/Else)",
    category: "logic",
    description: "Evaluates an expression and routes execution to true_branch or false_branch",
    defaultInputs: {
      value: { id: "value", name: "Value to Test", type: "any", required: true },
    },
    defaultOutputs: {
      true_branch: { id: "true_branch", name: "True", type: "any" },
      false_branch: { id: "false_branch", name: "False", type: "any" },
    },
    defaultConfig: {
      expression: "value > 0",
    },
  },
  data_transform: {
    type: "data_transform",
    label: "Data Transformer",
    category: "data",
    description: "Maps and restructures fields from input object into new shape",
    defaultInputs: {
      source: { id: "source", name: "Source Data", type: "object", required: true },
    },
    defaultOutputs: {
      transformed: { id: "transformed", name: "Transformed Data", type: "object" },
    },
    defaultConfig: {
      mappings: {
        id: "source.id",
        displayName: "source.name",
      },
    },
  },
  iterator: {
    type: "iterator",
    label: "Array Iterator (Map)",
    category: "data",
    description: "Iterates over an array and emits each element individually",
    defaultInputs: {
      items: { id: "items", name: "Items Array", type: "array", required: true },
    },
    defaultOutputs: {
      item: { id: "item", name: "Current Item", type: "any" },
      index: { id: "index", name: "Index", type: "number" },
    },
    defaultConfig: {
      batchSize: 1,
    },
  },
  log_output: {
    type: "log_output",
    label: "Log Output",
    category: "action",
    description: "Prints and records intermediate data to execution log",
    defaultInputs: {
      data: { id: "data", name: "Data to Log", type: "any", required: true },
    },
    defaultOutputs: {
      passthrough: { id: "passthrough", name: "Passthrough", type: "any" },
    },
    defaultConfig: {
      prefix: "[WORKFLOW LOG]",
    },
  },
};
