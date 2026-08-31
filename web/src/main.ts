import { FlowCanvas } from "./canvas.js";
import { appState, selectNode, updateValidation, addNodeFromCatalog, removeSelectedNode, runSimulation, updateGeneratedCode, createAndAddDynamicNode } from "./state.js";
import { initWebMcpBridge } from "./mcp-bridge.js";
import { NODE_CATALOG } from "../../src/nodes/catalog.js";
import { DynamicNodeRegistry } from "../../src/nodes/dynamic.js";
import { CredentialVault } from "../../src/vault/vault.js";
import { runFrozenOracleGate, generateKddContractMarkdown } from "../../src/oracle/evaluator.js";
import { getLocale, setLocale, Locale, t } from "../../src/i18n/translations.js";
import { serializeWorkflowToUrl } from "../../src/sharing/url_serializer.js";

document.addEventListener("DOMContentLoaded", () => {
  const canvas = new FlowCanvas("canvas-container");
  updateValidation();
  canvas.render();
  initWebMcpBridge();

  const applyTranslations = () => {
    const tr = t();
    const loc = getLocale();
    document.documentElement.lang = loc;

    // Header buttons
    const elKdd = document.getElementById("label-btn-kdd-gate"); if (elKdd) elKdd.innerText = tr.btnKddGate;
    const elVault = document.getElementById("label-btn-vault"); if (elVault) elVault.innerText = tr.btnVault;
    const elApi = document.getElementById("label-btn-api"); if (elApi) elApi.innerText = tr.btnSynthesizeApi;
    const elVal = document.getElementById("label-btn-validate"); if (elVal) elVal.innerText = tr.btnValidateDag;
    const elShare = document.getElementById("label-btn-share"); if (elShare) elShare.innerText = tr.btnShareFlow;
    const elExp = document.getElementById("label-btn-export"); if (elExp) elExp.innerText = tr.btnExportCode;
    const elRun = document.getElementById("label-btn-run"); if (elRun) elRun.innerText = tr.btnRunSimulation;

    // Sidebar titles
    const elPal = document.getElementById("palette-header-title"); if (elPal) elPal.innerText = tr.nodeLibraryTitle;
    const elInsp = document.getElementById("inspector-header-title"); if (elInsp) elInsp.innerText = tr.nodeInspectorTitle;

    // Modals
    const elApiTitle = document.getElementById("api-modal-title"); if (elApiTitle) elApiTitle.innerText = tr.apiModalTitle;
    const elApiDesc = document.getElementById("api-modal-desc"); if (elApiDesc) elApiDesc.innerText = tr.apiModalDesc;
    const elApiCreate = document.getElementById("label-btn-create-api"); if (elApiCreate) elApiCreate.innerText = tr.btnSynthesizeAndAdd;

    const elVaultTitle = document.getElementById("vault-modal-title"); if (elVaultTitle) elVaultTitle.innerText = tr.vaultModalTitle;
    const elVaultDesc = document.getElementById("vault-modal-desc"); if (elVaultDesc) elVaultDesc.innerText = tr.vaultModalDesc;
    const elVaultAdd = document.getElementById("vault-add-secret-title"); if (elVaultAdd) elVaultAdd.innerText = tr.addSecretTitle;
    const elVaultSave = document.getElementById("label-btn-save-vault"); if (elVaultSave) elVaultSave.innerText = tr.btnSaveVault;
    const elVaultActive = document.getElementById("vault-active-secrets-title"); if (elVaultActive) elVaultActive.innerText = tr.activeSecretsTitle;
    const elVaultNotice = document.getElementById("vault-security-notice"); if (elVaultNotice) elVaultNotice.innerText = tr.vaultSecurityNotice;
    const elVaultExp = document.getElementById("label-btn-export-dotenv"); if (elVaultExp) elVaultExp.innerText = tr.btnExportDotEnv;

    const elGateTitle = document.getElementById("kdd-gate-modal-title"); if (elGateTitle) elGateTitle.innerText = tr.kddGateTitle;
    const elGateDesc = document.getElementById("kdd-gate-modal-desc"); if (elGateDesc) elGateDesc.innerText = tr.kddGateDesc;
    const elGateRun = document.getElementById("label-btn-run-gate"); if (elGateRun) elGateRun.innerText = tr.btnRunGate;
    const elGateExp = document.getElementById("label-btn-export-contract"); if (elGateExp) elGateExp.innerText = tr.btnExportKddContract;
    const elGateTc = document.getElementById("kdd-frozen-test-cases-title"); if (elGateTc) elGateTc.innerText = tr.frozenTestCasesTitle;

    renderPalette();
    renderInspector(appState.selectedNodeId);
  };

  const renderPalette = () => {
    const tr = t();
    const paletteContainer = document.getElementById("node-palette")!;
    paletteContainer.innerHTML = "";

    // 1. Standard Nodes
    for (const [key, tpl] of Object.entries(NODE_CATALOG)) {
      const btn = document.createElement("button");
      btn.className = "palette-item";
      btn.innerHTML = `
        <span class="icon">${getCategoryIcon(tpl.category)}</span>
        <span class="label">${tpl.label}</span>
      `;
      btn.title = tpl.description;
      btn.addEventListener("click", () => {
        addNodeFromCatalog(key, 150 + Math.random() * 200, 150 + Math.random() * 150);
      });
      paletteContainer.appendChild(btn);
    }

    // 2. Dynamic Synthesized Nodes
    const dynamicNodes = DynamicNodeRegistry.getInstance().getAll();
    if (dynamicNodes.length > 0) {
      const sectionTitle = document.createElement("div");
      sectionTitle.className = "palette-section-title";
      sectionTitle.innerText = tr.customApiNodesTitle;
      paletteContainer.appendChild(sectionTitle);

      for (const dNode of dynamicNodes) {
        const btn = document.createElement("button");
        btn.className = "palette-item dynamic";
        btn.innerHTML = `
          <span class="icon">✨</span>
          <span class="label">${dNode.label}</span>
        `;
        btn.title = dNode.description;
        btn.addEventListener("click", () => {
          addNodeFromCatalog(dNode.typeId, 250, 200);
        });
        paletteContainer.appendChild(btn);
      }
    }
  };

  // Language Selector Change
  const langSelector = document.getElementById("lang-selector") as HTMLSelectElement;
  if (langSelector) {
    langSelector.value = getLocale();
    langSelector.addEventListener("change", (e) => {
      setLocale((e.target as HTMLSelectElement).value as Locale);
      applyTranslations();
    });
  }

  window.addEventListener("locale-changed", () => applyTranslations());
  window.addEventListener("dynamic-node-registered", () => renderPalette());

  applyTranslations();

  // Setup Header Actions
  document.getElementById("btn-run")?.addEventListener("click", async () => {
    const tr = t();
    const btn = document.getElementById("btn-run") as HTMLButtonElement;
    btn.disabled = true;
    btn.innerHTML = `<span>${tr.btnSimulating}</span>`;
    await runSimulation({ message: "Triggered from AI-First Canvas" });
    btn.disabled = false;
    btn.innerHTML = `<span>${tr.btnRunSimulation}</span>`;
  });

  document.getElementById("btn-validate")?.addEventListener("click", () => {
    updateValidation();
    const val = appState.validation;
    if (val.valid) {
      alert(`✅ KDD Gate Validation PASSED!\nTopological Order: ${val.topologicalOrder.join(" -> ")}`);
    } else {
      alert(`❌ KDD Validation FAILED:\n` + val.errors.map((e) => `- [${e.code}] ${e.message}`).join("\n"));
    }
  });

  // Share Flow Handler
  document.getElementById("btn-share-flow")?.addEventListener("click", async () => {
    const tr = t();
    const graph = appState.store.getGraph();
    const shareUrl = serializeWorkflowToUrl(graph, window.location.href);

    // Update browser URL without reloading
    window.history.replaceState(null, "", shareUrl);

    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert(`${tr.shareCopiedToast}\n\n${shareUrl}`);
    } catch {
      prompt("Copy your shareable workflow URL:", shareUrl);
    }
  });

  document.getElementById("btn-export")?.addEventListener("click", () => {
    updateGeneratedCode();
    renderCodeModal();
  });

  document.getElementById("btn-add-api-node")?.addEventListener("click", () => {
    document.getElementById("api-modal")!.style.display = "flex";
  });

  document.getElementById("btn-close-api-modal")?.addEventListener("click", () => {
    document.getElementById("api-modal")!.style.display = "none";
  });

  document.getElementById("btn-create-api-node")?.addEventListener("click", () => {
    const serviceName = (document.getElementById("api-service-name") as HTMLInputElement).value || "stripe";
    const operationName = (document.getElementById("api-op-name") as HTMLInputElement).value || "create_charge";
    const endpointUrl = (document.getElementById("api-endpoint-url") as HTMLInputElement).value || "https://api.stripe.com/v1/charges";
    const method = (document.getElementById("api-method") as HTMLSelectElement).value as any || "POST";
    const docText = (document.getElementById("api-doc-text") as HTMLTextAreaElement).value || "";

    createAndAddDynamicNode({
      serviceName,
      operationName,
      description: `${serviceName} API operation: ${operationName}`,
      endpointUrl,
      method,
      rawDocOrCurl: docText,
      detectedFields: [
        { name: "amount", type: "number", required: true, description: "Charge amount in cents" },
        { name: "currency", type: "string", required: true, description: "3-letter ISO code e.g. usd" },
        { name: "customer", type: "string", required: false, description: "Customer ID" },
        { name: "source", type: "string", required: false, description: "Card token" },
      ],
      detectedOutputs: [
        { name: "charge_id", type: "string", description: "Created charge ID" },
        { name: "status", type: "string", description: "succeeded | pending | failed" },
      ],
    });

    document.getElementById("api-modal")!.style.display = "none";
  });

  // Vault Modal Wiring
  const renderVaultKeysList = () => {
    const tr = t();
    const container = document.getElementById("vault-keys-list")!;
    const keys = CredentialVault.getInstance().listKeys();
    if (keys.length === 0) {
      container.innerHTML = `<div style="color: var(--text-muted); font-size: 0.8rem; padding: 6px;">${tr.noSecretsConfigured}</div>`;
      return;
    }

    container.innerHTML = "";
    for (const item of keys) {
      const row = document.createElement("div");
      row.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: #0f172a; border: 1px solid var(--border); border-radius: 4px; padding: 6px 10px; font-size: 0.8rem;";
      row.innerHTML = `
        <div>
          <span style="font-weight: 600; color: #a5b4fc;" class="font-mono">$vault:${item.key}</span>
          <span style="color: var(--text-muted); margin-left: 8px;">(${item.description || "No description"})</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="font-mono" style="color: #64748b;">${item.maskedHint}</span>
          <button class="btn-icon danger" style="padding: 2px 6px; font-size: 0.7rem;" data-key="${item.key}">✕</button>
        </div>
      `;
      row.querySelector(".btn-icon")?.addEventListener("click", () => {
        CredentialVault.getInstance().deleteSecret(item.key);
        renderVaultKeysList();
      });
      container.appendChild(row);
    }
  };

  document.getElementById("btn-open-vault")?.addEventListener("click", () => {
    renderVaultKeysList();
    document.getElementById("vault-modal")!.style.display = "flex";
  });

  document.getElementById("btn-close-vault-modal")?.addEventListener("click", () => {
    document.getElementById("vault-modal")!.style.display = "none";
  });

  document.getElementById("btn-save-vault-secret")?.addEventListener("click", () => {
    const keyInput = document.getElementById("vault-key-input") as HTMLInputElement;
    const valInput = document.getElementById("vault-val-input") as HTMLInputElement;
    const descInput = document.getElementById("vault-desc-input") as HTMLInputElement;

    const key = keyInput.value.trim();
    const val = valInput.value.trim();
    const desc = descInput.value.trim();

    if (!key || !val) {
      alert("Please provide both Key Name and Secret Value.");
      return;
    }

    CredentialVault.getInstance().setSecret(key, val, desc);
    keyInput.value = "";
    valInput.value = "";
    descInput.value = "";
    renderVaultKeysList();
  });

  document.getElementById("btn-export-dotenv")?.addEventListener("click", () => {
    const dotEnvContent = CredentialVault.getInstance().exportDotEnv();
    const blob = new Blob([dotEnvContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = ".env";
    a.click();
    URL.revokeObjectURL(url);
  });

  // KDD Gate Modal Wiring
  const renderKddGateModal = (verdict?: any) => {
    const tr = t();
    const graph = appState.store.getGraph();
    const contract = graph.contract;

    const shaBadge = document.getElementById("kdd-gate-sha-badge")!;
    shaBadge.innerText = contract?.sealedSha256 ? `SHA256: ${contract.sealedSha256.substring(0, 16)}...` : tr.shaUnsealed;

    const banner = document.getElementById("kdd-gate-verdict-banner")!;
    if (verdict) {
      banner.style.display = "block";
      if (verdict.passed) {
        banner.style.background = "rgba(16, 185, 129, 0.2)";
        banner.style.color = "#34d399";
        banner.style.border = "1px solid rgba(16, 185, 129, 0.4)";
        banner.innerText = `✅ ${verdict.verdictSummary}`;
      } else {
        banner.style.background = "rgba(239, 68, 68, 0.2)";
        banner.style.color = "#f87171";
        banner.style.border = "1px solid rgba(239, 68, 68, 0.4)";
        banner.innerText = `❌ ${verdict.verdictSummary}`;
      }
    } else {
      banner.style.display = "none";
    }

    const listContainer = document.getElementById("kdd-test-cases-list")!;
    listContainer.innerHTML = "";

    const testCases = contract?.testCases || [];
    for (const tc of testCases) {
      const tcResult = verdict?.testCaseResults?.find((r: any) => r.testCaseId === tc.id);
      const isPassed = tcResult ? tcResult.passed : null;

      const card = document.createElement("div");
      card.style.cssText = "background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; padding: 10px;";
      
      let badge = `<span class="badge" style="background: #334155; color: #94a3b8;">${tr.statusPending}</span>`;
      if (isPassed === true) badge = `<span class="badge success">${tr.statusPass}</span>`;
      if (isPassed === false) badge = `<span class="badge error">${tr.statusFail}</span>`;

      let assertionsHtml = `<div style="display: flex; flex-direction: column; gap: 4px; margin-top: 6px;">`;
      for (const a of tc.assertions) {
        const aRes = tcResult?.assertionResults?.find((r: any) => r.assertion.path === a.path);
        const aStatus = aRes ? (aRes.passed ? "✓" : `✕ (${aRes.error || "failed"})`) : "•";
        const aColor = aRes ? (aRes.passed ? "#34d399" : "#f87171") : "#94a3b8";

        assertionsHtml += `
          <div style="font-size: 0.75rem; color: ${aColor}; font-family: var(--font-mono);">
            ${aStatus} ${a.targetNodeId ? `[${a.targetNodeId}] ` : ""}${a.path} ${a.operator} ${JSON.stringify(a.expectedValue)}
          </div>
        `;
      }
      assertionsHtml += `</div>`;

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="font-size: 0.85rem;">${tc.name}</strong>
          ${badge}
        </div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
          Input: <span class="font-mono">${JSON.stringify(tc.inputPayload)}</span>
        </div>
        ${assertionsHtml}
      `;
      listContainer.appendChild(card);
    }
  };

  document.getElementById("btn-open-kdd-gate")?.addEventListener("click", () => {
    renderKddGateModal();
    document.getElementById("kdd-gate-modal")!.style.display = "flex";
  });

  document.getElementById("btn-close-gate-modal")?.addEventListener("click", () => {
    document.getElementById("kdd-gate-modal")!.style.display = "none";
  });

  document.getElementById("btn-execute-kdd-gate")?.addEventListener("click", async () => {
    const verdict = await runFrozenOracleGate(appState.store.getGraph());
    renderKddGateModal(verdict);
  });

  document.getElementById("btn-export-kdd-contract")?.addEventListener("click", () => {
    const graph = appState.store.getGraph();
    if (!graph.contract) {
      alert("No contract defined for this workflow.");
      return;
    }
    const md = generateKddContractMarkdown(graph, graph.contract);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${graph.id}.contract.md`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Setup Inspector Listeners
  window.addEventListener("node-selected", (e: any) => {
    renderInspector(e.detail.nodeId);
  });
  renderInspector(appState.selectedNodeId);

  // Workflow title editing
  const titleInput = document.getElementById("workflow-title-input") as HTMLInputElement;
  if (titleInput) {
    titleInput.value = appState.store.getGraph().name;
    titleInput.addEventListener("input", (e) => {
      appState.store.updateGraph((g) => {
        g.name = (e.target as HTMLInputElement).value;
      });
    });
  }

  // Setup Code Modal tabs
  document.getElementById("tab-ts")?.addEventListener("click", () => {
    appState.targetLang = "typescript";
    updateGeneratedCode();
    renderCodeModal();
  });
  document.getElementById("tab-py")?.addEventListener("click", () => {
    appState.targetLang = "python";
    updateGeneratedCode();
    renderCodeModal();
  });
  document.getElementById("tab-php")?.addEventListener("click", () => {
    appState.targetLang = "php";
    updateGeneratedCode();
    renderCodeModal();
  });
  document.getElementById("tab-go")?.addEventListener("click", () => {
    appState.targetLang = "go";
    updateGeneratedCode();
    renderCodeModal();
  });
  document.getElementById("btn-close-modal")?.addEventListener("click", () => {
    document.getElementById("code-modal")!.style.display = "none";
  });
});

function renderInspector(nodeId: string | null) {
  const tr = t();
  const inspector = document.getElementById("inspector-content")!;
  if (!nodeId) {
    inspector.innerHTML = `<div class="empty-state">${tr.selectNodePrompt}</div>`;
    return;
  }

  const node = appState.store.getGraph().nodes.find((n) => n.id === nodeId);
  if (!node) {
    inspector.innerHTML = `<div class="empty-state">Node not found</div>`;
    return;
  }

  let configFields = "";
  if (node.type.startsWith("dynamic_") || node.dynamicDef) {
    const def = node.dynamicDef || DynamicNodeRegistry.getInstance().get(node.type);
    configFields = `
      <div class="form-group">
        <label>API Endpoint</label>
        <input type="text" class="input-control font-mono" value="${def?.endpoint?.url || ""}" disabled />
      </div>
      <div class="form-group">
        <label>HTTP Method</label>
        <input type="text" class="input-control" value="${def?.endpoint?.method || "POST"}" disabled />
      </div>
      <div class="form-group">
        <label>Auth Credential Reference</label>
        <input type="text" class="input-control font-mono" value="$vault:${def?.endpoint?.authSecretPlaceholder || "API_KEY"}" disabled />
      </div>
      <div class="form-group">
        <label>Documentation Summary</label>
        <textarea class="input-control font-mono" rows="3" disabled>${def?.documentationSummary || "Generated dynamically from API Doc"}</textarea>
      </div>
    `;
  } else if (node.type === "ai_agent") {
    configFields = `
      <div class="form-group">
        <label>Model</label>
        <select id="cfg-model" class="input-control">
          <option value="gemini-2.5-flash" ${node.config.model === "gemini-2.5-flash" ? "selected" : ""}>Gemini 2.5 Flash</option>
          <option value="gemini-2.5-pro" ${node.config.model === "gemini-2.5-pro" ? "selected" : ""}>Gemini 2.5 Pro</option>
          <option value="claude-3-7-sonnet" ${node.config.model === "claude-3-7-sonnet" ? "selected" : ""}>Claude 3.7 Sonnet</option>
          <option value="gpt-4o" ${node.config.model === "gpt-4o" ? "selected" : ""}>GPT-4o</option>
        </select>
      </div>
      <div class="form-group">
        <label>System Prompt</label>
        <textarea id="cfg-sysprompt" class="input-control" rows="3">${node.config.systemPrompt || ""}</textarea>
      </div>
      <div class="form-group">
        <label>User Prompt Template (use {{input}})</label>
        <textarea id="cfg-prompt" class="input-control" rows="3">${node.config.userPromptTemplate || ""}</textarea>
      </div>
    `;
  } else if (node.type === "condition_branch") {
    configFields = `
      <div class="form-group">
        <label>Condition Expression</label>
        <input type="text" id="cfg-expr" class="input-control" value="${node.config.expression || ""}" />
      </div>
    `;
  } else if (node.type === "code_script") {
    configFields = `
      <div class="form-group">
        <label>JavaScript / Logic Code</label>
        <textarea id="cfg-code" class="input-control font-mono" rows="6">${node.config.code || ""}</textarea>
      </div>
    `;
  } else {
    configFields = `
      <div class="form-group">
        <label>Node Config (JSON)</label>
        <textarea id="cfg-json" class="input-control font-mono" rows="4">${JSON.stringify(node.config, null, 2)}</textarea>
      </div>
    `;
  }

  inspector.innerHTML = `
    <div class="inspector-header">
      <div class="inspector-badge">${node.type}</div>
      <button id="btn-delete-node" class="btn-icon danger" title="${tr.deleteNode}">🗑️</button>
    </div>
    <div class="form-group">
      <label>${tr.nodeLabel}</label>
      <input type="text" id="node-label-input" class="input-control" value="${node.label}" />
    </div>
    <div class="form-group">
      <label>${tr.nodeId}</label>
      <input type="text" class="input-control font-mono" value="${node.id}" disabled />
    </div>
    <hr class="divider"/>
    <h4>${tr.parametersAndLogic}</h4>
    ${configFields}
  `;

  // Bind inspector inputs
  document.getElementById("node-label-input")?.addEventListener("input", (e) => {
    appState.store.updateGraph((g) => {
      const n = g.nodes.find((item) => item.id === nodeId);
      if (n) n.label = (e.target as HTMLInputElement).value;
    });
  });

  document.getElementById("btn-delete-node")?.addEventListener("click", () => {
    if (confirm(`${tr.confirmDeleteNode} '${node.label}'?`)) {
      removeSelectedNode();
    }
  });
}

function renderCodeModal() {
  const modal = document.getElementById("code-modal")!;
  modal.style.display = "flex";

  const code = appState.generatedCode;
  if (!code) return;

  const tabTs = document.getElementById("tab-ts");
  const tabPy = document.getElementById("tab-py");
  const tabPhp = document.getElementById("tab-php");
  const tabGo = document.getElementById("tab-go");

  if (tabTs) tabTs.className = `tab-btn ${code.language === "typescript" ? "active" : ""}`;
  if (tabPy) tabPy.className = `tab-btn ${code.language === "python" ? "active" : ""}`;
  if (tabPhp) tabPhp.className = `tab-btn ${code.language === "php" ? "active" : ""}`;
  if (tabGo) tabGo.className = `tab-btn ${code.language === "go" ? "active" : ""}`;

  const srcPre = document.getElementById("code-source")!;
  const testPre = document.getElementById("code-test")!;
  srcPre.textContent = code.sourceCode;
  testPre.textContent = code.testCode;
}

function getCategoryIcon(category: string): string {
  switch (category) {
    case "trigger": return "⚡";
    case "ai": return "🤖";
    case "logic": return "🔀";
    case "action": return "⚙️";
    case "data": return "📊";
    case "api": return "🔌";
    default: return "📦";
  }
}
