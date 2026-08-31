export type Locale = "es" | "en" | "pt";

export interface TranslationDictionary {
  appTitle: string;
  defaultWorkflowTitle: string;
  // Header Buttons
  btnKddGate: string;
  btnVault: string;
  btnSynthesizeApi: string;
  btnValidateDag: string;
  btnExportCode: string;
  btnRunSimulation: string;
  btnSimulating: string;
  // WebMCP Status
  webmcpConnected: string;
  webmcpDegraded: string;
  // Palette & Sidebar
  nodeLibraryTitle: string;
  customApiNodesTitle: string;
  nodeInspectorTitle: string;
  selectNodePrompt: string;
  nodeLabel: string;
  nodeId: string;
  parametersAndLogic: string;
  // Common Actions
  close: string;
  deleteNode: string;
  confirmDeleteNode: string;
  confirmRemoveConnection: string;
  // Modals - Code Export
  codeExportTitle: string;
  tabTypeScript: string;
  tabPython: string;
  synthesizedImplementation: string;
  frozenTestOracle: string;
  // Modals - API Synthesis
  apiModalTitle: string;
  apiModalDesc: string;
  serviceNameLabel: string;
  operationNameLabel: string;
  endpointUrlLabel: string;
  httpMethodLabel: string;
  docOrCurlLabel: string;
  btnSynthesizeAndAdd: string;
  // Modals - Vault
  vaultModalTitle: string;
  vaultModalDesc: string;
  addSecretTitle: string;
  keyNamePlaceholder: string;
  secretValuePlaceholder: string;
  secretDescPlaceholder: string;
  btnSaveVault: string;
  activeSecretsTitle: string;
  noSecretsConfigured: string;
  vaultSecurityNotice: string;
  btnExportDotEnv: string;
  // Modals - KDD Gate
  kddGateTitle: string;
  kddGateDesc: string;
  btnRunGate: string;
  btnExportKddContract: string;
  frozenTestCasesTitle: string;
  shaUnsealed: string;
  statusPending: string;
  statusPass: string;
  statusFail: string;
  // Node Categories
  catTrigger: string;
  catAi: string;
  catLogic: string;
  catAction: string;
  catData: string;
  catApi: string;
}

export const TRANSLATIONS: Record<Locale, TranslationDictionary> = {
  es: {
    appTitle: "KDD Flow Engine",
    defaultWorkflowTitle: "Flujo de Automatización AI",
    btnKddGate: "🧪 KDD Gate",
    btnVault: "🔐 Vault",
    btnSynthesizeApi: "✨ Sintetizar Nodo API",
    btnValidateDag: "🛡️ Validar DAG",
    btnExportCode: "📦 Exportar Código",
    btnRunSimulation: "▶ Ejecutar Simulación",
    btnSimulating: "⏳ Simulando...",
    webmcpConnected: "WebMCP Conectado (document.modelContext)",
    webmcpDegraded: "fastwebmcp Activo (Modo Seguro Local)",
    nodeLibraryTitle: "Biblioteca de Nodos",
    customApiNodesTitle: "Nodos de API Personalizados",
    nodeInspectorTitle: "Inspector del Nodo",
    selectNodePrompt: "Selecciona un nodo en el canvas para configurar sus propiedades y parámetros de IA.",
    nodeLabel: "Etiqueta del Nodo",
    nodeId: "ID del Nodo",
    parametersAndLogic: "Parámetros y Lógica",
    close: "Cerrar",
    deleteNode: "Eliminar Nodo",
    confirmDeleteNode: "¿Eliminar este nodo?",
    confirmRemoveConnection: "¿Eliminar esta conexión?",
    codeExportTitle: "Código Sintetizado y Oráculos",
    tabTypeScript: "TypeScript (Node.js)",
    tabPython: "Python (asyncio)",
    synthesizedImplementation: "Implementación Sintetizada",
    frozenTestOracle: "Oráculo de Pruebas Congelado",
    apiModalTitle: "✨ Sintetizar Nodo Dinámico desde Documentación de API",
    apiModalDesc: "Pega documentación de API, cURL o especificación OpenAPI. El motor de IA sintetiza un nodo tipado al instante.",
    serviceNameLabel: "Nombre del Servicio (ej. Stripe, WhatsApp, GitHub)",
    operationNameLabel: "Operación (ej. create_charge, send_message)",
    endpointUrlLabel: "URL del Endpoint",
    httpMethodLabel: "Método HTTP",
    docOrCurlLabel: "Documentación de la API / Fragmento cURL",
    btnSynthesizeAndAdd: "✨ Sintetizar y Añadir al Canvas",
    vaultModalTitle: "🔐 Bóveda Local de Credenciales de Conocimiento Cero",
    vaultModalDesc: "Las credenciales se guardan exclusivamente en la memoria local de tu navegador. El agente de IA solo recibe referencias ciegas ($vault:CLAVE) y nunca puede leer tus secretos reales.",
    addSecretTitle: "Agregar / Actualizar Clave Secreta",
    keyNamePlaceholder: "NOMBRE_CLAVE (ej. STRIPE_SECRET_KEY)",
    secretValuePlaceholder: "Valor Secreto (ej. sk_test_...)",
    secretDescPlaceholder: "Descripción (ej. Clave Secreta de Pruebas Stripe)",
    btnSaveVault: "💾 Guardar en Bóveda",
    activeSecretsTitle: "Secretos Locales Activos",
    noSecretsConfigured: "No hay credenciales configuradas aún.",
    vaultSecurityNotice: "🔒 100% en tu máquina. Nunca se envía a bases de datos remotas ni al chat con la IA.",
    btnExportDotEnv: "📥 Exportar Archivo .env",
    kddGateTitle: "🧪 KDD Frozen Oracle Acceptance Gate",
    kddGateDesc: "Verificación determinista: Toda modificación del flujo debe satisfacer el 100% de los casos de prueba congelados.",
    btnRunGate: "▶ Ejecutar KDD Gate",
    btnExportKddContract: "📜 Exportar Contrato KDD",
    frozenTestCasesTitle: "Casos de Prueba Congelados",
    shaUnsealed: "SHA256: Sin sellar",
    statusPending: "Pendiente",
    statusPass: "✓ APROBADO",
    statusFail: "✕ FALLÓ",
    catTrigger: "Disparadores",
    catAi: "Inteligencia Artificial",
    catLogic: "Control de Flujo",
    catAction: "Acciones & Código",
    catData: "Transformación de Datos",
    catApi: "Integraciones API",
  },
  en: {
    appTitle: "KDD Flow Engine",
    defaultWorkflowTitle: "AI Automation Workflow",
    btnKddGate: "🧪 KDD Gate",
    btnVault: "🔐 Vault",
    btnSynthesizeApi: "✨ Synthesize API Node",
    btnValidateDag: "🛡️ Validate DAG",
    btnExportCode: "📦 Export Code",
    btnRunSimulation: "▶ Run Simulation",
    btnSimulating: "⏳ Simulating...",
    webmcpConnected: "WebMCP Connected (document.modelContext)",
    webmcpDegraded: "fastwebmcp Active (Safe Local Mode)",
    nodeLibraryTitle: "Node Library",
    customApiNodesTitle: "Custom API Nodes",
    nodeInspectorTitle: "Node Inspector",
    selectNodePrompt: "Select a node on the canvas to configure properties and AI parameters.",
    nodeLabel: "Node Label",
    nodeId: "Node ID",
    parametersAndLogic: "Parameters & Logic",
    close: "Close",
    deleteNode: "Delete Node",
    confirmDeleteNode: "Delete this node?",
    confirmRemoveConnection: "Remove this connection?",
    codeExportTitle: "Synthesized Code & Oracles",
    tabTypeScript: "TypeScript (Node.js)",
    tabPython: "Python (asyncio)",
    synthesizedImplementation: "Synthesized Implementation",
    frozenTestOracle: "Frozen Test Oracle",
    apiModalTitle: "✨ Synthesize Dynamic Node from API Documentation",
    apiModalDesc: "Paste API documentation, cURL, or OpenAPI spec. The AI engine synthesizes a typed node instantly.",
    serviceNameLabel: "Service Name (e.g. Stripe, WhatsApp, GitHub)",
    operationNameLabel: "Operation (e.g. create_charge, send_message)",
    endpointUrlLabel: "Endpoint URL",
    httpMethodLabel: "HTTP Method",
    docOrCurlLabel: "API Documentation / cURL Snippet",
    btnSynthesizeAndAdd: "✨ Synthesize & Add to Canvas",
    vaultModalTitle: "🔐 Zero-Knowledge Local Credential Vault",
    vaultModalDesc: "Secrets are stored exclusively in your local browser session memory. The AI agent only receives blind references ($vault:KEY) and can never read your actual secrets.",
    addSecretTitle: "Add / Update Secret Key",
    keyNamePlaceholder: "KEY_NAME (e.g. STRIPE_SECRET_KEY)",
    secretValuePlaceholder: "Secret Value (e.g. sk_test_...)",
    secretDescPlaceholder: "Description (e.g. Stripe Test Secret Key)",
    btnSaveVault: "💾 Save to Vault",
    activeSecretsTitle: "Active Local Secrets",
    noSecretsConfigured: "No credentials configured yet.",
    vaultSecurityNotice: "🔒 100% Client-Side. Never transmitted to remote databases or AI chat.",
    btnExportDotEnv: "📥 Export .env File",
    kddGateTitle: "🧪 KDD Frozen Oracle Acceptance Gate",
    kddGateDesc: "Deterministic verification: Workflow modifications must satisfy 100% of the frozen acceptance test cases.",
    btnRunGate: "▶ Run KDD Gate",
    btnExportKddContract: "📜 Export KDD Contract",
    frozenTestCasesTitle: "Frozen Acceptance Test Cases",
    shaUnsealed: "SHA256: Unsealed",
    statusPending: "Pending",
    statusPass: "✓ PASS",
    statusFail: "✕ FAIL",
    catTrigger: "Triggers",
    catAi: "Artificial Intelligence",
    catLogic: "Flow Control",
    catAction: "Actions & Code",
    catData: "Data Transformation",
    catApi: "API Integrations",
  },
  pt: {
    appTitle: "KDD Flow Engine",
    defaultWorkflowTitle: "Fluxo de Automação IA",
    btnKddGate: "🧪 KDD Gate",
    btnVault: "🔐 Cofre",
    btnSynthesizeApi: "✨ Sintetizar Nó de API",
    btnValidateDag: "🛡️ Validar DAG",
    btnExportCode: "📦 Exportar Código",
    btnRunSimulation: "▶ Executar Simulação",
    btnSimulating: "⏳ Simulando...",
    webmcpConnected: "WebMCP Conectado (document.modelContext)",
    webmcpDegraded: "fastwebmcp Ativo (Modo Local Seguro)",
    nodeLibraryTitle: "Biblioteca de Nós",
    customApiNodesTitle: "Nós de API Personalizados",
    nodeInspectorTitle: "Inspetor do Nó",
    selectNodePrompt: "Selecione um nó no canvas para configurar propriedades e parâmetros de IA.",
    nodeLabel: "Rótulo do Nó",
    nodeId: "ID do Nó",
    parametersAndLogic: "Parâmetros e Lógica",
    close: "Fechar",
    deleteNode: "Excluir Nó",
    confirmDeleteNode: "Deseja excluir este nó?",
    confirmRemoveConnection: "Remover esta conexão?",
    codeExportTitle: "Código Sintetizado e Oráculos",
    tabTypeScript: "TypeScript (Node.js)",
    tabPython: "Python (asyncio)",
    synthesizedImplementation: "Implementação Sintetizada",
    frozenTestOracle: "Oráculo de Testes Congelado",
    apiModalTitle: "✨ Sintetizar Nó Dinâmico a partir da Documentação de API",
    apiModalDesc: "Cole a documentação da API, cURL ou especificação OpenAPI. O motor de IA sintetiza um nó tipado instantaneamente.",
    serviceNameLabel: "Nome do Serviço (ex: Stripe, WhatsApp, GitHub)",
    operationNameLabel: "Operação (ex: create_charge, send_message)",
    endpointUrlLabel: "URL do Endpoint",
    httpMethodLabel: "Método HTTP",
    docOrCurlLabel: "Documentação da API / Trecho cURL",
    btnSynthesizeAndAdd: "✨ Sintetizar e Adicionar ao Canvas",
    vaultModalTitle: "🔐 Cofre Local de Credenciais de Conhecimento Zero",
    vaultModalDesc: "Os segredos são armazenados exclusivamente na memória da sessão local do seu navegador. O agente de IA recebe apenas referências cegas ($vault:CHAVE) e nunca pode ler seus segredos reais.",
    addSecretTitle: "Adicionar / Atualizar Chave Secreta",
    keyNamePlaceholder: "NOME_CHAVE (ex: STRIPE_SECRET_KEY)",
    secretValuePlaceholder: "Valor Secreto (ex: sk_test_...)",
    secretDescPlaceholder: "Descrição (ex: Chave Secreta de Testes Stripe)",
    btnSaveVault: "💾 Salvar no Cofre",
    activeSecretsTitle: "Segredos Locais Ativos",
    noSecretsConfigured: "Nenhuma credencial configurada ainda.",
    vaultSecurityNotice: "🔒 100% no seu computador. Nunca transmitido para bancos de dados remotos ou chat de IA.",
    btnExportDotEnv: "📥 Exportar Arquivo .env",
    kddGateTitle: "🧪 KDD Frozen Oracle Acceptance Gate",
    kddGateDesc: "Verificação determinística: Qualquer modificação no fluxo deve satisfazer 100% dos casos de teste congelados.",
    btnRunGate: "▶ Executar KDD Gate",
    btnExportKddContract: "📜 Exportar Contrato KDD",
    frozenTestCasesTitle: "Casos de Teste Congelados",
    shaUnsealed: "SHA256: Não selado",
    statusPending: "Pendente",
    statusPass: "✓ APROVADO",
    statusFail: "✕ FALHOU",
    catTrigger: "Disparadores",
    catAi: "Inteligência Artificial",
    catLogic: "Controle de Fluxo",
    catAction: "Ações & Código",
    catData: "Transformação de Dados",
    catApi: "Integrações de API",
  },
};

let currentLocale: Locale = "es";

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale): void {
  if (locale in TRANSLATIONS) {
    currentLocale = locale;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("locale-changed", { detail: { locale } }));
    }
  }
}

export function t(): TranslationDictionary {
  return TRANSLATIONS[currentLocale];
}
