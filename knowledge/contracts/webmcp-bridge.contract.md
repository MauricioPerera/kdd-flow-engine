---
type: 'Task Contract'
title: 'fastwebmcp WebMCP Tools Bridge'
description: 'Registro e integracion de herramientas WebMCP para interaccion AI-First con la interfaz y el canvas.'
tags: ['ccdd', 'webmcp', 'fastwebmcp']

task: webmcp_bridge
intent: "Exponer herramientas WebMCP fuertemente tipadas con esquemas Zod para la manipulacion agéntica del flujo."
target: src/mcp/tools.ts
signature: "export function registerFlowWebMcpTools(store: FlowStore): void"
test_command: "tsc -p tsconfig.json && node --test dist/tests_ts/webmcp.test.js"
budget:
  cyclomatic_max: 8
  nesting_max: 3
tests: "tests_ts/webmcp.test.ts"
tests_sha256: "b7eaf64156157695917b120dbf22b7df3e3220c2840662a25f85e7de387eeb51"
touch_only: ['src/mcp/tools.ts']
deps_allowed: ['fastwebmcp', 'zod', 'src/schema/workflow.ts', 'src/validator/dag.ts', 'src/runtime/engine.ts', 'src/generator/polyglot.ts', 'src/nodes/catalog.ts']
forbids: ['network']
---

# Contract: fastwebmcp WebMCP Tools Bridge

## Intent
Integrar la libreria `fastwebmcp` para registrar el catalogo de herramientas de automatizacion ante el protocolo WebMCP del navegador (`document.modelContext`), permitiendo que cualquier agente cree, edite, conecte y simule flujos.

## Interface
```typescript
export interface FlowStore {
  graph: WorkflowGraph;
  listeners: Array<(graph: WorkflowGraph) => void>;
  updateGraph: (modifier: (g: WorkflowGraph) => void) => void;
  getGraph: () => WorkflowGraph;
  subscribe: (cb: (g: WorkflowGraph) => void) => () => void;
}

export function registerFlowWebMcpTools(store: FlowStore): void;
```

## Invariants
- Todas las herramientas validan sus entradas mediante esquemas Zod antes de modificar el estado.
- Degradacion elegante y segura si WebMCP no esta soportado de forma nativa en el navegador.

## Examples
- Invocacion de `create_workflow` reinicia el canvas con el nuevo ID y titulo.
- Invocacion de `add_node` inserta un nodo y emite el evento de actualizacion a los suscriptores.

## Do / Don't
- **DO:** Usar `registerTool` de `fastwebmcp` para derivar automaticamente el JSON Schema.
- **DON'T:** Modificar el estado del store sin notificar a los suscriptores reactivos.

## Tests
El oraculo de pruebas esta congelado en `tests_ts/webmcp.test.ts`.

## Constraints
PARAR y reportar si las herramientas WebMCP rompen la validacion de tipos o fallan al sincronizar con el canvas.
