import { z } from "zod";

export const PortTypeSchema = z.enum(["any", "string", "number", "boolean", "object", "array", "trigger"]);
export type PortType = z.infer<typeof PortTypeSchema>;

export const PortDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: PortTypeSchema.optional().default("any"),
  description: z.string().optional(),
  required: z.boolean().optional().default(false),
  defaultValue: z.any().optional(),
});
export type PortDefinition = {
  id: string;
  name: string;
  type?: PortType;
  description?: string;
  required?: boolean;
  defaultValue?: any;
};

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
  collapsed: z.boolean().optional(),
});
export type Position = { x: number; y: number; collapsed?: boolean };

export const StandardNodeTypeSchema = z.enum([
  "trigger_manual",
  "trigger_webhook",
  "trigger_cron",
  "ai_agent",
  "ai_router",
  "ai_extractor",
  "agent_handoff",
  "mcp_client_call",
  "mcp_server_tool",
  "http_request",
  "code_script",
  "condition_branch",
  "data_transform",
  "iterator",
  "log_output",
  "dynamic_api",
]);
export type StandardNodeType = z.infer<typeof StandardNodeTypeSchema>;
export const NodeTypeSchema = StandardNodeTypeSchema;
export type NodeType = StandardNodeType | string;

export interface DynamicNodeDefinition {
  typeId: string;
  label: string;
  category: "api" | "ai" | "action" | "integration" | "custom";
  description: string;
  documentationSummary?: string;
  endpoint: {
    url: string;
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    authType: "bearer" | "api_key" | "basic" | "none";
    authHeaderKey?: string;
    authSecretPlaceholder?: string;
  };
  inputs: Record<string, PortDefinition>;
  outputs: Record<string, PortDefinition>;
  defaultConfig: Record<string, any>;
  rawDocSnippet?: string;
}

export const WorkflowNodeSchema = z.object({
  id: z.string().min(1),
  type: z.string(),
  label: z.string().min(1),
  position: PositionSchema,
  inputs: z.record(z.string(), PortDefinitionSchema).optional().default({}),
  outputs: z.record(z.string(), PortDefinitionSchema).optional().default({}),
  config: z.record(z.string(), z.any()).optional().default({}),
  dynamicDef: z.custom<DynamicNodeDefinition>().optional(),
});
export type WorkflowNode = {
  id: string;
  type: NodeType;
  label: string;
  position: Position;
  inputs?: Record<string, PortDefinition>;
  outputs?: Record<string, PortDefinition>;
  config: Record<string, any>;
  dynamicDef?: DynamicNodeDefinition;
};

export const WorkflowEdgeSchema = z.object({
  id: z.string().min(1),
  sourceNodeId: z.string().min(1),
  sourcePort: z.string().min(1),
  targetNodeId: z.string().min(1),
  targetPort: z.string().min(1),
  label: z.string().optional(),
});
export type WorkflowEdge = z.infer<typeof WorkflowEdgeSchema>;

export const WorkflowAssertionSchema = z.object({
  targetNodeId: z.string().optional(),
  path: z.string(),
  operator: z.enum(["equals", "not_equals", "contains", "greater_than", "less_than", "matches_regex", "exists"]),
  expectedValue: z.any().optional(),
  description: z.string().optional(),
});
export type WorkflowAssertion = z.infer<typeof WorkflowAssertionSchema>;

export const WorkflowTestCaseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  inputPayload: z.record(z.string(), z.any()).default({}),
  assertions: z.array(WorkflowAssertionSchema).min(1),
  description: z.string().optional(),
});
export type WorkflowTestCase = z.infer<typeof WorkflowTestCaseSchema>;

export const WorkflowContractSchema = z.object({
  id: z.string().min(1),
  workflowId: z.string().min(1),
  title: z.string().min(1),
  intent: z.string(),
  testCases: z.array(WorkflowTestCaseSchema).min(1),
  sealedSha256: z.string().min(1),
  invariants: z.array(z.string()).optional().default([]),
});
export type WorkflowContract = z.infer<typeof WorkflowContractSchema>;

export const WorkflowGraphSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().default(""),
  version: z.string().optional().default("1.0.0"),
  nodes: z.array(WorkflowNodeSchema).default([]),
  edges: z.array(WorkflowEdgeSchema).default([]),
  contract: WorkflowContractSchema.optional(),
  variables: z.record(z.string(), z.any()).optional().default({}),
  metadata: z.record(z.string(), z.any()).optional().default({}),
});
export type WorkflowGraph = z.infer<typeof WorkflowGraphSchema>;
