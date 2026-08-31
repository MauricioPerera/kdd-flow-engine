import { DynamicNodeDefinition, PortDefinition } from "../schema/workflow.js";

export class DynamicNodeRegistry {
  private static instance: DynamicNodeRegistry;
  private nodes: Map<string, DynamicNodeDefinition> = new Map();

  public static getInstance(): DynamicNodeRegistry {
    if (!DynamicNodeRegistry.instance) {
      DynamicNodeRegistry.instance = new DynamicNodeRegistry();
    }
    return DynamicNodeRegistry.instance;
  }

  public register(nodeDef: DynamicNodeDefinition): void {
    this.nodes.set(nodeDef.typeId, nodeDef);
  }

  public get(typeId: string): DynamicNodeDefinition | undefined {
    return this.nodes.get(typeId);
  }

  public getAll(): DynamicNodeDefinition[] {
    return Array.from(this.nodes.values());
  }

  public remove(typeId: string): boolean {
    return this.nodes.delete(typeId);
  }
}

export interface ApiDocInput {
  serviceName: string;
  operationName: string;
  description: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  endpointUrl: string;
  authType?: "bearer" | "api_key" | "basic" | "none";
  authSecretPlaceholder?: string;
  rawDocOrCurl?: string;
  detectedFields?: Array<{ name: string; type: "string" | "number" | "boolean" | "object" | "array"; required?: boolean; description?: string }>;
  detectedOutputs?: Array<{ name: string; type: "string" | "number" | "boolean" | "object" | "array"; description?: string }>;
}

export function synthesizeNodeFromApiDoc(input: ApiDocInput): DynamicNodeDefinition {
  const typeId = `dynamic_${sanitizeId(input.serviceName)}_${sanitizeId(input.operationName)}`;
  const label = `${capitalize(input.serviceName)}: ${capitalize(input.operationName)}`;

  // Derive inputs
  const inputs: Record<string, PortDefinition> = {};
  if (input.detectedFields && input.detectedFields.length > 0) {
    for (const f of input.detectedFields) {
      inputs[f.name] = {
        id: f.name,
        name: formatPortLabel(f.name),
        type: f.type || "string",
        required: f.required ?? false,
        description: f.description || `Parameter ${f.name} for ${input.serviceName}`,
      };
    }
  } else {
    // Default sensible fallback ports if raw text only
    inputs["payload"] = {
      id: "payload",
      name: "Request Payload",
      type: "object",
      required: true,
      description: "Data object for API call",
    };
  }

  // Derive outputs
  const outputs: Record<string, PortDefinition> = {
    response: {
      id: "response",
      name: "API Response",
      type: "object",
      description: "Parsed JSON response payload",
    },
    status: {
      id: "status",
      name: "HTTP Status",
      type: "number",
      description: "Response status code (e.g. 200, 201)",
    },
  };

  if (input.detectedOutputs) {
    for (const out of input.detectedOutputs) {
      outputs[out.name] = {
        id: out.name,
        name: formatPortLabel(out.name),
        type: out.type || "string",
        description: out.description,
      };
    }
  }

  const nodeDef: DynamicNodeDefinition = {
    typeId,
    label,
    category: "api",
    description: input.description || `Auto-synthesized node for ${input.serviceName} API`,
    documentationSummary: input.rawDocOrCurl,
    endpoint: {
      url: input.endpointUrl,
      method: input.method || "POST",
      authType: input.authType || "bearer",
      authHeaderKey: input.authType === "bearer" ? "Authorization" : "x-api-key",
      authSecretPlaceholder: input.authSecretPlaceholder || `${input.serviceName.toUpperCase()}_API_KEY`,
    },
    inputs,
    outputs,
    defaultConfig: {
      service: input.serviceName,
      endpointUrl: input.endpointUrl,
      method: input.method || "POST",
    },
  };

  DynamicNodeRegistry.getInstance().register(nodeDef);
  return nodeDef;
}

function sanitizeId(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9_]/g, "_");
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatPortLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}
