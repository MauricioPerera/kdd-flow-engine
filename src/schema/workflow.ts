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
});
export type Position = { x: number; y: number };

export const StandardNodeTypeSchema = z.enum([
  "trigger_manual",
  "trigger_webhook",
  "trigger_cron",
  "ai_agent",
  "ai_router",
  "ai_extractor",
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
}

export const WorkflowNodeSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  label: z.string().min(1),
  position: PositionSchema.default({ x: 0, y: 0 }),
  inputs: z.record(z.string(), PortDefinitionSchema).default({}),
  outputs: z.record(z.string(), PortDefinitionSchema).default({}),
  config: z.record(z.string(), z.any()).default({}),
  description: z.string().optional(),
});
export type WorkflowNode = {
  id: string;
  type: NodeType;
  label: string;
  position: Position;
  inputs?: Record<string, PortDefinition>;
  outputs?: Record<string, PortDefinition>;
  config: Record<string, any>;
  description?: string;
  dynamicDef?: DynamicNodeDefinition;
};

export const WorkflowEdgeSchema = z.object({
  id: z.string().min(1),
  sourceNodeId: z.string().min(1),
  sourcePort: z.string().min(1),
  targetNodeId: z.string().min(1),
  targetPort: z.string().min(1),
});
export type WorkflowEdge = z.infer<typeof WorkflowEdgeSchema>;

// --- KDD Frozen Oracle & Contract Schemas ---
export const AssertionOperatorSchema = z.enum([
  "equals",
  "not_equals",
  "contains",
  "greater_than",
  "less_than",
  "matches_regex",
  "is_defined",
  "is_null",
]);
export type AssertionOperator = z.infer<typeof AssertionOperatorSchema>;

export const WorkflowAssertionSchema = z.object({
  targetNodeId: z.string().optional(), // If omitted, checks terminalOutputs or final results
  path: z.string().min(1).describe("JSON path or property name e.g. status, response.id, total"),
  operator: AssertionOperatorSchema.default("equals"),
  expectedValue: z.any().describe("Expected scalar or structure"),
  description: z.string().optional(),
});
export type WorkflowAssertion = z.infer<typeof WorkflowAssertionSchema>;

export const WorkflowTestCaseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  inputPayload: z.record(z.string(), z.any()).default({}),
  assertions: z.array(WorkflowAssertionSchema).min(1),
});
export type WorkflowTestCase = z.infer<typeof WorkflowTestCaseSchema>;

export const WorkflowContractSchema = z.object({
  id: z.string().min(1),
  workflowId: z.string().min(1),
  title: z.string().min(1),
  intent: z.string().min(1),
  testCases: z.array(WorkflowTestCaseSchema).default([]),
  sealedSha256: z.string().optional(),
  invariants: z.array(z.string()).default([]),
});
export type WorkflowContract = z.infer<typeof WorkflowContractSchema>;

export const WorkflowGraphSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(""),
  version: z.string().default("1.0.0"),
  nodes: z.array(WorkflowNodeSchema).default([]),
  edges: z.array(WorkflowEdgeSchema).default([]),
  contract: WorkflowContractSchema.optional(),
  variables: z.record(z.string(), z.any()).default({}),
  metadata: z.record(z.string(), z.any()).default({}),
});
export type WorkflowGraph = {
  id: string;
  name: string;
  description?: string;
  version?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  contract?: WorkflowContract;
  variables?: Record<string, any>;
  metadata?: Record<string, any>;
};

export const ExecutionStatusSchema = z.enum([
  "idle",
  "running",
  "completed",
  "failed",
  "paused",
]);
export type ExecutionStatus = z.infer<typeof ExecutionStatusSchema>;

export const NodeExecutionLogSchema = z.object({
  nodeId: z.string(),
  status: z.enum(["pending", "running", "success", "error", "skipped"]),
  inputs: z.record(z.string(), z.any()).optional(),
  outputs: z.record(z.string(), z.any()).optional(),
  error: z.string().optional(),
  startedAt: z.number(),
  finishedAt: z.number().optional(),
  durationMs: z.number().optional(),
});
export type NodeExecutionLog = z.infer<typeof NodeExecutionLogSchema>;

export const WorkflowExecutionResultSchema = z.object({
  workflowId: z.string(),
  status: ExecutionStatusSchema,
  logs: z.array(NodeExecutionLogSchema),
  finalOutputs: z.record(z.string(), z.any()).default({}),
  totalDurationMs: z.number(),
  error: z.string().optional(),
});
export type WorkflowExecutionResult = z.infer<typeof WorkflowExecutionResultSchema>;
