---
type: 'Task Contract'
title: 'Polyglot Code Generator'
description: 'Generador de implementaciones ejecutables en TypeScript y Python a partir de grafos de flujo KDD.'
tags: ['ccdd', 'generator', 'polyglot']

task: code_generator
intent: "Sintetizar codigo fuente tipado y suites de pruebas unitarias congeladas para cualquier flujo valido."
target: src/generator/polyglot.ts
signature: "export function generatePolyglotCode(graph: WorkflowGraph, targetLang?: 'typescript' | 'python'): GeneratedCode"
test_command: "tsc -p tsconfig.json && node --test dist/tests_ts/codegen.test.js"
budget:
  cyclomatic_max: 10
  nesting_max: 3
tests: "tests_ts/codegen.test.ts"
tests_sha256: "cedff7ab2a49fdafe30febc0169afb9f6a4a4d1ceeea07a78a3f2c8da824bf98"
touch_only: ['src/generator/polyglot.ts']
deps_allowed: ['src/schema/workflow.ts', 'src/validator/dag.ts']
forbids: ['network', 'subprocess']
---

# Contract: Polyglot Code Generator

## Intent
Traducir la definicion declarativa de un flujo de trabajo en codigo limpio, tipado y completamente ejecutable en TypeScript o Python, incluyendo su correspondiente suite de pruebas unitarias.

## Interface
```typescript
export interface GeneratedCode {
  language: "typescript" | "python";
  sourceCode: string;
  testCode: string;
  workflowId: string;
  workflowName: string;
}

export function generatePolyglotCode(
  graph: WorkflowGraph,
  targetLang?: "typescript" | "python"
): GeneratedCode;
```

## Invariants
- Rechaza grafos invalidos con una excepcion explicativa.
- El codigo generado respeta el orden topologico de las dependencias.

## Examples
- Flujo Webhook -> AIAgent genera una funcion TypeScript asincrona `run_<Name>` y su archivo de test con `node:test`.
- Mismo flujo con target `python` genera una corrutina `async def run_<Name>` y su suite `unittest`.

## Do / Don't
- **DO:** Sanitizar nombres de identificadores para evitar errores de sintaxis en el codigo destino.
- **DON'T:** Generar codigo con dependencias externas ocultas no declaradas.

## Tests
El oraculo de pruebas esta congelado en `tests_ts/codegen.test.ts`.

## Constraints
PARAR y reportar si el codigo generado no compila o carece de pruebas unitarias oraculo.
