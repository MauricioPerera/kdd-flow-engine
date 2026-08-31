---
type: Concept
title: "Zero-Knowledge Local Credential Vault"
description: "Arquitectura de boveda local de credenciales aislada para agentes de IA: uso de referencias opacas sin exponer claves en el contexto de chat ni servidores externos."
tags: ["security", "vault", "zero-knowledge", "credentials", "privacy", "kdd"]
---

# Zero-Knowledge Local Credential Vault

## El Problema de Seguridad con Agentes de IA
En plataformas tradicionales de IA, solicitar credenciales (e.g. `STRIPE_SECRET_KEY`, `OPENAI_API_KEY`) al usuario provoca que el secreto viaje en el prompt / historial del chat con el modelo LLM, quedando expuesto en logs de proveedores y telemetria.

## La Solucion: Boveda Local de Conocimiento Cero
1. **Aislamiento en Memoria del Cliente**: Las credenciales se almacenan exclusivamente en la sesion del navegador / runtime local (`CredentialVault`). Nunca se envian a una base de datos externa ni a servidores remotos.
2. **Referencias Opacas para el Agente**:
   - El agente de IA solo interactua con identificadores ciegos (e.g. `$vault:STRIPE_SECRET_KEY`).
   - La herramienta WebMCP `list_vault_secret_keys` solo devuelve los nombres de las claves y su estado booleano (`isSet: true`), omitiendo estrictamente los valores reales.
3. **Inyeccion Segura en la Frontera de Ejecucion**:
   - El runtime sustituye las referencias `$vault:KEY` por los valores reales justo antes de ejecutar la peticion HTTP local.
   - Las respuestas y trazas de ejecucion visibles para el agente pasan por un filtro de redaccion (`[REDACTED:$vault:KEY]`).
4. **Exportacion Local `.env`**: El usuario puede exportar directamente un archivo `.env` a su equipo local.

## Enlaces
- [Esquema de Flujo](./workflow_schema.md)
- [Sintesis Dinamica de Nodos](./dynamic_node_synthesis.md)
- [Integracion WebMCP](./webmcp_integration.md)
