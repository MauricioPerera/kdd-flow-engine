---
type: Concept
title: "Workflow Schema and Graph Representation"
description: "Definicion del modelo de grafo, puertos, tipos de nodos y ejecucion en KDD Flow Engine."
tags: ["schema", "workflow", "dag", "kdd"]
---

# Workflow Schema and Graph Representation

## Introduccion
El motor de flujos KDD representa cualquier automatizacion como un Grafo Aciclico Dirigido (DAG) tipado y determinista.

## Estructura del Grafo
Un flujo se compone de:
- **`nodes`**: Coleccion de instancias de nodos con posicion en el canvas, configuracion de parametros y puertos de entrada/salida.
- **`edges`**: Conexiones dirigidas entre un puerto de salida de un nodo origen y un puerto de entrada de un nodo destino.
- **`variables`**: Variables globales y de entorno disponibles para la interpolacion.
- **`metadata`**: Informacion de versionado y trazabilidad.

## Enlaces
- [Protocolo de Nodos](./node_protocol.md)
- [Integracion WebMCP](./webmcp_integration.md)
- [Generacion Poliglota de Codigo](./polyglot_codegen.md)
- [Contrato: Validacion DAG](./contracts/dag-validation.contract.md)
- [Contrato: Motor de Ejecucion](./contracts/workflow-runtime.contract.md)
