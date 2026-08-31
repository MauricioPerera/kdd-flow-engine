import { registerFlowWebMcpTools } from "../../src/mcp/tools.js";
import { supportsWebMcp } from "fastwebmcp";
import { appState } from "./state.js";

export function initWebMcpBridge() {
  const isSupported = supportsWebMcp();
  const badge = document.getElementById("webmcp-status-badge");

  if (badge) {
    if (isSupported) {
      badge.innerHTML = `<span class="dot active"></span> WebMCP Connected (document.modelContext)`;
      badge.className = "webmcp-badge supported";
    } else {
      badge.innerHTML = `<span class="dot warn"></span> fastwebmcp active (Safe Mock/Degraded Mode)`;
      badge.className = "webmcp-badge fallback";
    }
  }

  // Register all WebMCP tools so browser agents can interact with the live canvas
  registerFlowWebMcpTools(appState.store);
  console.log("[fastwebmcp] Flow tools successfully registered for AI Agents.");
}
