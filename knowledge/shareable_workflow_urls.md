---
type: Concept
title: "Zero-Backend Shareable Workflow URLs"
description: "Mecanismo de serializacion y comparticion de flujos de trabajo mediante fragmentos de URL (#flow=...) sin bases de datos externas y preservando la privacidad."
tags: ["sharing", "url-serialization", "zero-backend", "privacy", "kdd"]
---

# Zero-Backend Shareable Workflow URLs

## El Principio de Compartición sin Backend
Para compartir automatizaciones y flujos visuales sin requerir una base de datos centralizada ni comprometer la privacidad del usuario, **KDD Flow Engine** serializa el estado completo del grafo en un fragmento de URL (`#flow=<base64_url_safe>`).

## Características Clave:
1. **Serialización Segura Base64 URL-Safe**: El grafo JSON (`WorkflowGraphSchema`), sus nodos, puertos, conexiones causales y contratos KDD se codifican de forma compacta.
2. **Cero Exposición de Secretos**: Los secretos de la bóveda local (`$vault:KEY`) se mantienen como referencias opacas. La URL nunca contiene valores secretos reales.
3. **Carga Reactiva Instantánea**: Al abrir cualquier enlace con `#flow=...`, la SPA deserializa el grafo, ejecuta la validación DAG determinista y renderiza el flujo en el canvas al instante.
4. **Herramienta WebMCP (`generate_shareable_workflow_url`)**: Permite a los agentes de IA generar enlaces compartibles directamente en sus respuestas.

## Enlaces
- [Esquema de Flujo](./workflow_schema.md)
- [Boveda Local de Credenciales](./zero_knowledge_vault.md)
- [Manifiesto de Especificacion Universal](./universal_specification_manifest.md)
