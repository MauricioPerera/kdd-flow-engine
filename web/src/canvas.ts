import { appState, selectNode, updateValidation } from "./state.js";
import { WorkflowNode, WorkflowEdge } from "../../src/schema/workflow.js";

export class FlowCanvas {
  private container: HTMLElement;
  private svg: SVGSVGElement;
  private edgesGroup: SVGGElement;
  private nodesContainer: HTMLElement;
  private connectingLine: SVGPathElement | null = null;
  private connectingStart: { nodeId: string; portId: string; x: number; y: number } | null = null;
  private draggingNode: { id: string; offsetX: number; offsetY: number } | null = null;

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Container #${containerId} not found`);
    this.container = el;

    this.container.innerHTML = `
      <div class="canvas-grid">
        <svg class="canvas-svg" width="100%" height="100%">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#6366f1" />
            </marker>
            <marker id="arrow-active" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
            </marker>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#6366f1" flood-opacity="0.3"/>
            </filter>
          </defs>
          <g class="edges-layer"></g>
          <path class="connecting-wire" d="" style="display:none; stroke:#6366f1; stroke-width:2; stroke-dasharray:4; fill:none;"></path>
        </svg>
        <div class="nodes-layer"></div>
      </div>
    `;

    this.svg = this.container.querySelector(".canvas-svg")!;
    this.edgesGroup = this.container.querySelector(".edges-layer")!;
    this.nodesContainer = this.container.querySelector(".nodes-layer")!;
    this.connectingLine = this.container.querySelector(".connecting-wire")!;

    this.initEvents();
  }

  private initEvents() {
    window.addEventListener("mousemove", (e) => this.onMouseMove(e));
    window.addEventListener("mouseup", (e) => this.onMouseUp(e));

    this.container.addEventListener("click", (e) => {
      if (e.target === this.container || (e.target as HTMLElement).classList.contains("canvas-grid")) {
        selectNode(null);
        this.render();
      }
    });

    appState.store.subscribe(() => {
      this.render();
    });

    window.addEventListener("simulation-step", () => this.render());
    window.addEventListener("simulation-finished", () => this.render());
    window.addEventListener("workflow-updated", () => this.render());
  }

  public render() {
    const graph = appState.store.getGraph();
    this.renderEdges(graph.edges, graph.nodes);
    this.renderNodes(graph.nodes);
  }

  private renderNodes(nodes: WorkflowNode[]) {
    this.nodesContainer.innerHTML = "";

    for (const node of nodes) {
      const nodeEl = document.createElement("div");
      const isSelected = appState.selectedNodeId === node.id;
      const isExecuting = appState.activeExecutingNodeId === node.id;
      const log = appState.lastExecutionResult?.logs?.find((l: any) => l.nodeId === node.id);

      let statusBadge = "";
      if (isExecuting) {
        statusBadge = `<span class="badge running">⚡ Running</span>`;
      } else if (log?.status === "success") {
        statusBadge = `<span class="badge success">✓ ${log.durationMs || 0}ms</span>`;
      } else if (log?.status === "error") {
        statusBadge = `<span class="badge error">✕ Failed</span>`;
      }

      const typeCategory = node.type.split("_")[0] || "custom";
      nodeEl.className = `flow-node ${isSelected ? "selected" : ""} ${isExecuting ? "executing" : ""} cat-${typeCategory}`;
      nodeEl.style.left = `${node.position.x}px`;
      nodeEl.style.top = `${node.position.y}px`;
      nodeEl.dataset.nodeId = node.id;

      // Inputs HTML
      const inputs = Object.values(node.inputs || {});
      const outputs = Object.values(node.outputs || {});

      let portsHtml = `<div class="ports-container">`;
      portsHtml += `<div class="ports-in">`;
      for (const inp of inputs) {
        portsHtml += `
          <div class="port-row in">
            <span class="port-dot port-in" data-node-id="${node.id}" data-port-id="${inp.id}" title="${inp.name} (${inp.type})"></span>
            <span class="port-name">${inp.name}</span>
          </div>`;
      }
      portsHtml += `</div><div class="ports-out">`;
      for (const out of outputs) {
        portsHtml += `
          <div class="port-row out">
            <span class="port-name">${out.name}</span>
            <span class="port-dot port-out" data-node-id="${node.id}" data-port-id="${out.id}" title="${out.name} (${out.type})"></span>
          </div>`;
      }
      portsHtml += `</div></div>`;

      nodeEl.innerHTML = `
        <div class="node-header">
          <div class="node-icon">${this.getNodeIcon(node.type)}</div>
          <div class="node-meta">
            <div class="node-title">${node.label}</div>
            <div class="node-type">${node.type}</div>
          </div>
          ${statusBadge}
        </div>
        ${portsHtml}
      `;

      // Node Dragging
      nodeEl.addEventListener("mousedown", (e) => {
        if ((e.target as HTMLElement).classList.contains("port-dot")) return;
        this.draggingNode = {
          id: node.id,
          offsetX: e.clientX - node.position.x,
          offsetY: e.clientY - node.position.y,
        };
        selectNode(node.id);
        this.render();
      });

      // Output Port Drag start (wire connection)
      const outDots = nodeEl.querySelectorAll(".port-out");
      outDots.forEach((dot) => {
        dot.addEventListener("mousedown", (e) => {
          e.stopPropagation();
          const pEl = dot as HTMLElement;
          const rect = pEl.getBoundingClientRect();
          const cRect = this.container.getBoundingClientRect();
          const x = rect.left + rect.width / 2 - cRect.left;
          const y = rect.top + rect.height / 2 - cRect.top;

          this.connectingStart = {
            nodeId: node.id,
            portId: pEl.dataset.portId!,
            x,
            y,
          };
          if (this.connectingLine) {
            this.connectingLine.style.display = "block";
            this.connectingLine.setAttribute("d", `M ${x} ${y} L ${x} ${y}`);
          }
        });
      });

      // Input Port Drop
      const inDots = nodeEl.querySelectorAll(".port-in");
      inDots.forEach((dot) => {
        dot.addEventListener("mouseup", (e) => {
          e.stopPropagation();
          if (this.connectingStart) {
            const targetPortId = (dot as HTMLElement).dataset.portId!;
            if (this.connectingStart.nodeId !== node.id) {
              const edgeId = `e_${this.connectingStart.nodeId}_${this.connectingStart.portId}_to_${node.id}_${targetPortId}`;
              appState.store.updateGraph((g) => {
                const exists = g.edges.some((edge) => edge.id === edgeId);
                if (!exists) {
                  g.edges.push({
                    id: edgeId,
                    sourceNodeId: this.connectingStart!.nodeId,
                    sourcePort: this.connectingStart!.portId,
                    targetNodeId: node.id,
                    targetPort: targetPortId,
                  });
                }
              });
              updateValidation();
            }
            this.cancelConnecting();
          }
        });
      });

      this.nodesContainer.appendChild(nodeEl);
    }
  }

  private renderEdges(edges: WorkflowEdge[], nodes: WorkflowNode[]) {
    this.edgesGroup.innerHTML = "";
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    for (const edge of edges) {
      const srcNode = nodeMap.get(edge.sourceNodeId);
      const tgtNode = nodeMap.get(edge.targetNodeId);
      if (!srcNode || !tgtNode) continue;

      const srcPos = this.getPortCoords(srcNode, edge.sourcePort, "out");
      const tgtPos = this.getPortCoords(tgtNode, edge.targetPort, "in");

      const dx = Math.abs(tgtPos.x - srcPos.x) * 0.5;
      const pathD = `M ${srcPos.x} ${srcPos.y} C ${srcPos.x + dx} ${srcPos.y}, ${tgtPos.x - dx} ${tgtPos.y}, ${tgtPos.x} ${tgtPos.y}`;

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pathD);
      path.setAttribute("class", "flow-edge");
      path.setAttribute("marker-end", "url(#arrow)");
      path.dataset.edgeId = edge.id;

      path.addEventListener("click", (e) => {
        e.stopPropagation();
        if (confirm(`Remove connection?`)) {
          appState.store.updateGraph((g) => {
            g.edges = g.edges.filter((e) => e.id !== edge.id);
          });
          updateValidation();
        }
      });

      this.edgesGroup.appendChild(path);
    }
  }

  private getPortCoords(node: WorkflowNode, portId: string, type: "in" | "out") {
    // Estimating node dimensions: width 240px, header 45px, row 24px
    const width = 240;
    const x = type === "in" ? node.position.x : node.position.x + width;
    const y = node.position.y + 60; // approximate port center
    return { x, y };
  }

  private onMouseMove(e: MouseEvent) {
    if (this.draggingNode) {
      const newX = Math.max(20, e.clientX - this.draggingNode.offsetX);
      const newY = Math.max(20, e.clientY - this.draggingNode.offsetY);
      appState.store.updateGraph((g) => {
        const n = g.nodes.find((item) => item.id === this.draggingNode!.id);
        if (n) {
          n.position.x = Math.round(newX / 10) * 10;
          n.position.y = Math.round(newY / 10) * 10;
        }
      });
    }

    if (this.connectingStart && this.connectingLine) {
      const cRect = this.container.getBoundingClientRect();
      const curX = e.clientX - cRect.left;
      const curY = e.clientY - cRect.top;
      const startX = this.connectingStart.x;
      const startY = this.connectingStart.y;
      const dx = Math.abs(curX - startX) * 0.5;
      const d = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${curX - dx} ${curY}, ${curX} ${curY}`;
      this.connectingLine.setAttribute("d", d);
    }
  }

  private onMouseUp(_e: MouseEvent) {
    if (this.draggingNode) {
      this.draggingNode = null;
      this.render();
    }
    if (this.connectingStart) {
      this.cancelConnecting();
    }
  }

  private cancelConnecting() {
    this.connectingStart = null;
    if (this.connectingLine) {
      this.connectingLine.style.display = "none";
    }
  }

  private getNodeIcon(type: string): string {
    if (type.startsWith("trigger_")) return "⚡";
    if (type.startsWith("ai_")) return "🤖";
    if (type === "condition_branch") return "🔀";
    if (type === "code_script") return "💻";
    if (type === "http_request") return "🌐";
    if (type === "data_transform") return "🔄";
    if (type === "iterator") return "🔁";
    if (type === "log_output") return "📋";
    return "📦";
  }
}
