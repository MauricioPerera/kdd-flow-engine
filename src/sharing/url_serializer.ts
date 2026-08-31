import { WorkflowGraph, WorkflowGraphSchema } from "../schema/workflow.js";
import { validateDAG } from "../validator/dag.js";

/**
 * Encodes a UTF-8 string into a URL-safe Base64 string.
 */
export function encodeUrlSafeBase64(str: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }
  // Browser fallback
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Decodes a URL-safe Base64 string into a UTF-8 string.
 */
export function decodeUrlSafeBase64(base64Str: string): string {
  let normalized = base64Str.replace(/-/g, "+").replace(/_/g, "/");
  while (normalized.length % 4 !== 0) {
    normalized += "=";
  }

  if (typeof Buffer !== "undefined") {
    return Buffer.from(normalized, "base64").toString("utf8");
  }

  // Browser fallback
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Sanitizes graph to guarantee NO plain text secrets are exported in shareable URLs.
 */
export function sanitizeGraphForSharing(graph: WorkflowGraph): WorkflowGraph {
  const sanitized: WorkflowGraph = JSON.parse(JSON.stringify(graph));
  
  // Clean variables or configs that might accidentally have raw tokens
  for (const node of sanitized.nodes) {
    if (node.dynamicDef?.endpoint?.authSecretPlaceholder) {
      // Keep only placeholder reference
      delete (node.dynamicDef.endpoint as any).apiKey;
    }
  }

  return sanitized;
}

/**
 * Serializes a workflow graph into a shareable URL with a hash fragment.
 */
export function serializeWorkflowToUrl(
  graph: WorkflowGraph,
  baseUrl: string = "https://mauricioperera.github.io/kdd-flow-engine/"
): string {
  const cleanGraph = sanitizeGraphForSharing(graph);
  const jsonStr = JSON.stringify(cleanGraph);
  const encoded = encodeUrlSafeBase64(jsonStr);

  const cleanBase = baseUrl.split("#")[0].split("?")[0];
  return `${cleanBase}#flow=${encoded}`;
}

/**
 * Deserializes a workflow graph from a URL hash or search string.
 */
export function deserializeWorkflowFromUrl(urlOrHash: string): WorkflowGraph | null {
  try {
    let rawPayload = "";

    if (urlOrHash.includes("#flow=")) {
      rawPayload = urlOrHash.split("#flow=")[1].split("&")[0];
    } else if (urlOrHash.includes("?flow=")) {
      rawPayload = urlOrHash.split("?flow=")[1].split("&")[0];
    } else if (urlOrHash.startsWith("#") || urlOrHash.startsWith("flow=")) {
      rawPayload = urlOrHash.replace(/^(#|flow=)/, "");
    } else {
      rawPayload = urlOrHash;
    }

    if (!rawPayload) return null;

    const jsonStr = decodeUrlSafeBase64(rawPayload);
    const parsed = JSON.parse(jsonStr);
    const graph = WorkflowGraphSchema.parse(parsed);

    const validation = validateDAG(graph);
    if (!validation.valid) {
      console.warn("Shared workflow graph has DAG validation warnings:", validation.errors);
    }

    return graph;
  } catch (err: any) {
    console.error("Failed to deserialize workflow from URL:", err.message);
    return null;
  }
}
