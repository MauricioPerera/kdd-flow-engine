---
type: 'Task Contract'
title: 'Workflow Runtime and Execution Engine'
description: 'Motor de ejecucion paso a paso en memoria para flujos de automatizacion gobernados por KDD.'
tags: ['ccdd', 'runtime', 'engine']

task: workflow_runtime
intent: "Ejecutar nodos en orden topologico propagando datos entre puertos y recolectando trazas."
target: src/runtime/engine.ts
signature: "export class WorkflowEngine"
test_command: "tsc -p tsconfig.json && node --test dist/tests_ts/runtime.test.js"
budget:
  cyclomatic_max: 12
  nesting_max: 4
tests: "tests_ts/runtime.test.ts"
tests_sha256: "89343bbaf975b97f93312ace583ad832933c2184f84ebee2b372a4977822bfba"
touch_only: ['src/runtime/engine.ts']
deps_allowed: ['src/schema/workflow.ts', 'src/validator/dag.ts']
forbids: ['network']
---

# Contract: Workflow Runtime and Execution Engine

## Intent
Implementar el motor de ejecucion en memoria capaz de validar la topologia del flujo, evaluar cada nodo en secuencia topologica, conectar las salidas de los nodos origen a las entradas de los nodos destino y notificar el progreso de ejecucion.

## Interface
```typescript
export class WorkflowEngine {
  public onStep(callback: (log: NodeExecutionLog) => void): void;
  public execute(graph: WorkflowGraph, initialPayload?: Record<string, any>): Promise<WorkflowExecutionResult>;
}
```

## Invariants
- Si el DAG es invalido, aborta de inmediato con estado `failed`.
- Si un nodo lanza un error, el motor captura el fallo, lo anota en el log y concluye con estado `failed`.

## Examples
- Flujo Trigger -> CodeScript -> AIAgent procesa el payload inicial y genera el resultado final.
- Flujo con script que arroja excepcion finaliza con status `failed` y mensaje explicativo.

## Do / Don't
- **DO:** Propagar correctamente los valores de puertos a traves de las aristas entrantes.
- **DON'T:** Ignorar errores de ejecucion en pasos individuales.

## Tests
El oraculo de pruebas esta congelado en `tests_ts/runtime.test.ts`.

## Constraints
PARAR y reportar si se altera la firma publica o se pierde la trazabilidad de pasos.
