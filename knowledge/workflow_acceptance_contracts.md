---
type: Concept
title: "KDD Workflow Acceptance Contracts and Frozen Oracles"
description: "Gobernanza determinista de flujos de IA mediante contratos de aceptacion con oraculos de pruebas congelados y sellados criptograficos sha256."
tags: ["kdd", "ccdd", "frozen-oracle", "contracts", "verification", "gates"]
---

# KDD Workflow Acceptance Contracts and Frozen Oracles

## El Problema en Motores de Automatizacion Tradicionales
En herramientas como n8n, Zapier o LangChain, las modificaciones visuales o ajustes de prompts realizados por agentes de IA carecen de garantias deterministas. Una alteracion en un prompt o en un mapeo de datos puede introducir regresiones silenciosas en produccion.

## La Solucion KDD: Contratos de Flujo y Oraculos Congelados
Cada automatizacion o flujo se gobierna mediante un **Contrato de Tarea KDD** (`.workflow.contract.md`):

1. **Casos de Prueba Dorados (Golden Test Cases)**:
   - Se definen pares de entrada/salida esperados (ej. casos estandar, casos de fraude, errores de borde).
   - Aserciones sobre nodos especificos o salidas terminales (`equals`, `contains`, `greater_than`, `matches_regex`).
2. **Sellado Criptografico (`tests_sha256`)**:
   - El conjunto de pruebas congeladas se sella mediante SHA256 (`computeContractSha256`).
   - Si el agente o usuario altera las pruebas sin autorizacion, el Gate detecta **Oracle Hash Drift** y rechaza la ejecucion.
3. **KDD Gate Determinista (`runFrozenOracleGate`)**:
   - Antes de exportar, desplegar o dar por buena una modificacion, el gate ejecuta el flujo sobre todos los casos congelados.
   - El veredicto es 100% matematico y reproducible (sin juicio subjetivo de LLMs).

## Enlaces
- [Esquema de Flujo](./workflow_schema.md)
- [Boveda Local de Credenciales](./zero_knowledge_vault.md)
- [Sintesis Dinamica de Nodos](./dynamic_node_synthesis.md)
