---
type: Concept
title: "Node Protocol and Standard Node Catalog"
description: "Protocolo para el diseno y ejecucion de nodos de IA, control de flujo, integraciones y transformaciones."
tags: ["node", "catalog", "ai-agent", "protocol"]
---

# Node Protocol and Standard Node Catalog

## Categorias de Nodos
1. **Triggers (`trigger_*`)**: Disparadores manuales, webhooks y cron.
2. **AI First (`ai_*`)**:
   - `ai_agent`: Ejecucion de prompts contextuales y llamadas a modelos LLM.
   - `ai_router`: Clasificacion semantica de intenciones.
   - `ai_extractor`: Extraccion de entidades JSON estructuradas.
3. **Logic & Flow Control**:
   - `condition_branch`: Ramificacion condicional `true_branch` / `false_branch`.
   - `iterator`: Iteracion sobre colecciones.
4. **Actions & Data**:
   - `http_request`: Llamadas REST / API.
   - `code_script`: Evaluacion de logica Javascript o Python.
   - `data_transform`: Mapeo declarativo de datos.
   - `log_output`: Trazabilidad y depuracion.

## Enlaces
- [Esquema de Flujo](./workflow_schema.md)
- [Integracion WebMCP](./webmcp_integration.md)
- [Contrato: Motor de Ejecucion](./contracts/workflow-runtime.contract.md)
