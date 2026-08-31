# KDD Flow Engine Knowledge Base

Bienvenido a la base de conocimiento y gobernanza de **KDD Flow Engine**, una plataforma de automatizacion AI-First integrada con **fastwebmcp**.

## Especificaciones y Arquitectura (OKF)
- [Workflow Schema and Graph Representation](./workflow_schema.md) — Definicion del modelo de grafo, puertos y tipos de nodos.
- [Node Protocol and Standard Node Catalog](./node_protocol.md) — Protocolo para diseno y ejecucion de nodos de IA, control de flujo e integraciones.
- [Universal AI Specification Manifest (Language-Agnostic IR)](./universal_specification_manifest.md) — Paquete de especificacion semantica universal para sintesis en cualquier lenguaje arbitrario.
- [KDD Workflow Acceptance Contracts and Frozen Oracles](./workflow_acceptance_contracts.md) — Gobernanza determinista mediante oraculos congelados y sellados criptograficos.
- [Multilingual Support (Español, English, Português)](./multilingual_i18n.md) — Arquitectura de internacionalizacion reactiva para interfaz y WebMCP.
- [Dynamic Node Synthesis from API Documentation](./dynamic_node_synthesis.md) — Sintesis dinamica de nuevos nodos a partir de documentacion de APIs (e.g. Stripe).
- [Zero-Knowledge Local Credential Vault](./zero_knowledge_vault.md) — Boveda local de credenciales aislada para agentes de IA.
- [WebMCP Protocol and fastwebmcp Integration](./webmcp_integration.md) — Arquitectura de comunicacion con agentes via fastwebmcp.
- [Polyglot Code Synthesis and Execution Contracts](./polyglot_codegen.md) — Mecanismo de generacion automatica de codigo TypeScript y Python.

## Contratos de Desarrollo (CCDD)
- [Validacion DAG y Ordenamiento Topologico](./contracts/dag-validation.contract.md)
- [Motor de Ejecucion de Flujos](./contracts/workflow-runtime.contract.md)
- [Generador Poliglota de Codigo](./contracts/code-generator.contract.md)
- [Puente de Herramientas WebMCP con fastwebmcp](./contracts/webmcp-bridge.contract.md)
