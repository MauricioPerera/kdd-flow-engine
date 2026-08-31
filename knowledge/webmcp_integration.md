---
type: Architecture
title: "WebMCP Protocol and fastwebmcp Integration"
description: "Arquitectura de comunicacion bidireccional entre el Agente de IA y la interfaz de automatizacion via fastwebmcp."
tags: ["webmcp", "fastwebmcp", "architecture", "agent-ui"]
---

# WebMCP Protocol and fastwebmcp Integration

## Proposito
Permitir que un agente de IA interactue en tiempo real con el canvas visual, construyendo flujos, agregando nodos y simulando ejecuciones a traves de herramientas WebMCP tipadas (`registerTool`).

## Herramientas Registradas
- `create_workflow`: Inicializa o reinicia un flujo.
- `add_node`: Anade un nodo al canvas con su configuracion.
- `connect_nodes`: Conecta dos nodos mediante puertos.
- `configure_node`: Modifica parametros y prompts.
- `get_workflow_graph`: Obtiene la representacion completa del grafo.
- `validate_workflow`: Valida la topologia DAG.
- `simulate_execution`: Ejecuta el flujo en memoria.
- `export_code`: Sintetiza codigo fuente ejecutable.

## Enlaces
- [Esquema de Flujo](./workflow_schema.md)
- [Generacion Poliglota de Codigo](./polyglot_codegen.md)
- [Contrato: WebMCP Bridge](./contracts/webmcp-bridge.contract.md)
