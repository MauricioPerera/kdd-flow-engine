---
type: Concept
title: "Universal AI Specification Manifest (Language-Agnostic IR)"
description: "Paquete de especificacion semantica universal para que agentes de IA sinteticen codigo en cualquier lenguaje arbitrario (Elixir, Rust, C#, Zig, Solidity, Ruby, COBOL, etc.) sin depender de generadores hardcodeados."
tags: ["specification", "ai-first", "polyglot", "universal-ir", "webmcp", "kdd"]
---

# Universal AI Specification Manifest (Language-Agnostic IR)

## El Principio de Independencia de Lenguaje
En lugar de depender de una lista fija de compiladores hardcodeados en el repositorio, **KDD Flow Engine** emite un **Manifiesto de Especificación Semántica Universal** (`WorkflowSpecificationManifest`) a través de WebMCP (`get_complete_workflow_specification`).

## Información Proporcionada al Agente de IA:
1. **Grafo Causal y Secuencia Topológica**: Lista ordenada paso a paso de ejecución causal determinista.
2. **Contratos Tipados de Puertos y Enlaces de Datos**: Mapeo unívoco de qué puerto de origen alimenta qué puerto de destino (`incomingDataBindings`).
3. **Detalles de Endpoints y APIs Dinámicas**: Métodos HTTP (`POST`, `GET`), URLs, formatos de carga y referencias de autenticación opaca (`$vault:STRIPE_SECRET_KEY`).
4. **Catálogo de Secretos y Variables de Entorno Requeridas**: Identificadores requeridos para la ejecución sin exponer los valores secretos en texto plano.
5. **Oráculo de Pruebas Congelado y Aserciones Invariantes**: Casos de prueba dorados (`inputPayload` y aserciones esperadas) para que el agente sintetice también la suite de pruebas unitarias en el framework del lenguaje objetivo.

## Enlaces
- [Esquema de Flujo](./workflow_schema.md)
- [Contratos de Aceptacion KDD](./workflow_acceptance_contracts.md)
- [Boveda Local de Credenciales](./zero_knowledge_vault.md)
- [Sintesis Dinamica de Nodos](./dynamic_node_synthesis.md)
