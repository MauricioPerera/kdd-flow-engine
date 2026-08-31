---
type: Concept
title: "Dynamic Node Synthesis from API Documentation"
description: "Mecanismo AI-First para crear nodos fuertemente tipados a partir de documentacion OpenAPI, cURL o texto de cualquier API externa (e.g. Stripe)."
tags: ["dynamic-nodes", "api-synthesis", "stripe", "fastwebmcp", "kdd"]
---

# Dynamic Node Synthesis from API Documentation

## Vision AI-First
En los motores de automatizacion tradicionales (n8n, Zapier), la integracion de una API externa requiere paquetes de codigo precompilados o nodos HTTP genericos sin tipado de negocio.

En **KDD Flow Engine**, el agente de IA sintetiza nodos a demanda:
1. **Ingesta de Documentacion**: Se proporciona texto de documentacion de la API (cURL, OpenAPI, Swagger o markdown).
2. **Inferencia de Contrato**: La herramienta `generate_node_from_api_doc` infiere:
   - Identificador unico (`typeId`).
   - Puertos de entrada requeridos y opcionales con sus tipos (`amount: number`, `currency: string`, etc.).
   - Puertos de salida estructurados (`charge_id: string`, `status: string`, `response: object`).
   - Metodo HTTP, URL y credenciales de autenticacion (`Authorization: Bearer {{STRIPE_SECRET_KEY}}`).
3. **Registro Reactivo en el Canvas**: El nodo sintetizado se registra instantaneamente en la paleta y puede ser arrastrado o conectado por el agente de IA.
4. **Sintesis Poliglota**: El generador de codigo produce la llamada nativa limpia tanto en TypeScript como en Python.

## Enlaces
- [Esquema de Flujo](./workflow_schema.md)
- [Protocolo de Nodos](./node_protocol.md)
- [Integracion WebMCP](./webmcp_integration.md)
