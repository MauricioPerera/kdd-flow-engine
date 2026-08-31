---
type: 'Task Contract'
title: 'DAG Validation and Topological Ordering'
description: 'Validador determinista de topologia de grafos aciclicos dirigidos (DAG), deteccion de ciclos y ordenamiento topologico.'
tags: ['ccdd', 'dag', 'validation']

task: dag_validation
intent: "Garantizar que todo flujo sea un DAG valido sin ciclos, bucles propios ni referencias colgantes."
target: src/validator/dag.ts
signature: "export function validateDAG(graph: WorkflowGraph): ValidationResult"
test_command: "tsc -p tsconfig.json && node --test dist/tests_ts/dag.test.js"
budget:
  cyclomatic_max: 10
  nesting_max: 3
tests: "tests_ts/dag.test.ts"
tests_sha256: "40ea4e8c986f63bace8b4e70288551ccf2f882b4c2260637e3f0a308de78a9f6"
touch_only: ['src/validator/dag.ts']
deps_allowed: ['src/schema/workflow.ts']
forbids: ['network', 'subprocess']
---

# Contract: DAG Validation and Topological Ordering

## Intent
Proveer un validador determinista que inspeccione la estructura del grafo del flujo, identifique ciclos, auto-referencias, aristas invalidas y devuelva el orden topologico de ejecucion.

## Interface
```typescript
export interface ValidationError {
  code: string;
  message: string;
  nodeId?: string;
  edgeId?: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  topologicalOrder: string[];
}

export function validateDAG(graph: WorkflowGraph): ValidationResult;
```

## Invariants
- Devuelve `valid: false` si existe cualquier ciclo o nodo inexistente en las conexiones.
- Si el grafo es valido, `topologicalOrder` contiene todos los IDs de nodos ordenados segun sus dependencias.

## Examples
- Grafo A -> B -> C devuelve `valid: true` y orden `["A", "B", "C"]`.
- Grafo A -> B -> A devuelve `valid: false` con error `CYCLIC_DEPENDENCY`.

## Do / Don't
- **DO:** Usar el algoritmo de Kahn o DFS con grados de entrada para resolver dependencias.
- **DON'T:** Ejecutar operaciones asincronas o llamadas a red durante la validacion.

## Tests
El oraculo de pruebas esta congelado en `tests_ts/dag.test.ts`.

## Constraints
PARAR y reportar si se introduce indeterminismo o se permiten ciclos en grafos declarados como validos.
