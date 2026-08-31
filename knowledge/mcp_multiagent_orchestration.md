---
type: Concept
title: "MCP Ecosystem & Multi-Agent Orchestration in Workflows"
description: "Soporte nativo para orquestar clientes MCP, exponer flujos como servidores MCP y delegar tareas complejas entre subagentes especializados."
tags: ["mcp", "multi-agent", "mcp-client", "mcp-server", "fastwebmcp", "kdd"]
---

# MCP Ecosystem & Multi-Agent Orchestration in Workflows

## Nodos Nativos del Ecosistema MCP

1. **MCP Client Call (`mcp_client_call`)**:
   - Permite que el flujo actúe como un **Cliente MCP**.
   - Invoca herramientas en servidores MCP remotos o locales (via SSE, stdio, HTTP o WebMCP en navegador).
   - Ingesta los argumentos y parsea los resultados para alimentar los siguientes nodos del grafo.

2. **MCP Server Exposer (`mcp_server_tool`)**:
   - Permite que el flujo completo o un subgrafo se exponga como una **Herramienta / Servidor MCP**.
   - Define el schema JSON de entrada (`inputSchema`) y el nombre de la herramienta para que clientes externos como Claude Desktop, Cursor o el CLI de Antigravity puedan invocar el flujo como una tool estándar.

3. **Multi-Agent Subagent Handoff (`agent_handoff`)**:
   - Permite la delegación causal entre agentes especializados (ej: Agente Investigador -> Agente Programador -> Agente Revisor QA de KDD).
   - Preserva el contexto causal y aplica las reglas de gobernanza KDD en cada traspaso.

## Enlaces
- [Esquema de Flujo](./workflow_schema.md)
- [Protocolo de Nodos](./node_protocol.md)
- [Integracion fastwebmcp](./webmcp_integration.md)
- [Manifiesto de Especificacion Universal](./universal_specification_manifest.md)
