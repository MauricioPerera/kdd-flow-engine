export const CODE_SNIPPETS: Record<string, string> = {
  ts: `// TypeScript (Node.js) - Synthesized from KDD Flow Engine
import { executeStep } from "./runtime";

export async function runWorkflow(initialPayload: Record<string, any>) {
  // Step 1: Webhook Ingest
  const webhook = { payload: initialPayload };

  // Step 2: Dynamic Stripe API (Authenticated via local Vault)
  const stripeCharge = await executeStep("stripe_charge", {
    amount: webhook.payload.amount,
    currency: "usd",
    apiKey: process.env.STRIPE_SECRET_KEY
  });

  // Step 3: Terminal Log Output
  console.log("[FULFILLED]", stripeCharge);
  return { status: 200, chargeId: stripeCharge.id };
}`,
  py: `# Python (asyncio) - Synthesized from KDD Flow Engine
import os
import httpx

async def run_workflow(initial_payload: dict) -> dict:
    # Step 1: Webhook Ingest
    webhook_data = {"payload": initial_payload}
    
    # Step 2: Dynamic Stripe API (Authenticated via local Vault)
    stripe_key = os.getenv("STRIPE_SECRET_KEY", "mock_key")
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.stripe.com/v1/charges",
            headers={"Authorization": f"Bearer {stripe_key}"},
            json={"amount": webhook_data["payload"].get("amount", 5000)}
        )
    return {"status": 200, "response": resp.json()}`,
  php: `<?php
declare(strict_types=1);

namespace KddFlow\\Workflows;

class PaymentFraudWorkflow
{
    public static function runWorkflow(array $initialPayload): array
    {
        $webhook = ['payload' => $initialPayload];
        $stripeKey = getenv('STRIPE_SECRET_KEY') ?: 'mock_key';
        
        // Execute dynamic Stripe charge step
        $stripeCharge = [
            'status' => 200,
            'charge_id' => 'ch_' . bin2hex(random_bytes(8)),
            'amount' => $webhook['payload']['amount'] ?? 0
        ];
        
        return ['workflow_id' => 'wf_payment', 'results' => $stripeCharge];
    }
}`,
  go: `// Go (Golang) - Synthesized from KDD Flow Engine
package workflows

import (
	"os"
)

type WorkflowResult struct {
	WorkflowID string                 \`json:"workflow_id"\`
	Status     int                    \`json:"status"\`
	Outputs    map[string]interface{} \`json:"outputs"\`
}

func RunWorkflow(initialPayload map[string]interface{}) (*WorkflowResult, error) {
	stripeKey := os.Getenv("STRIPE_SECRET_KEY")
	_ = stripeKey

	return &WorkflowResult{
		WorkflowID: "wf_payment_lead",
		Status:     200,
		Outputs:    initialPayload,
	}, nil
}`,
  ir: `{
  "specificationVersion": "kdd-spec-v1.0",
  "workflowId": "wf_payment_lead",
  "topologicalOrder": ["webhook_1", "stripe_charge_1", "log_1"],
  "semanticExecutionSteps": [
    {
      "stepIndex": 1,
      "nodeId": "webhook_1",
      "nodeType": "trigger_webhook",
      "algorithmicLogicSummary": "Entry point for incoming webhook"
    },
    {
      "stepIndex": 2,
      "nodeId": "stripe_charge_1",
      "nodeType": "dynamic_stripe_charge",
      "dynamicApiDetails": {
        "httpMethod": "POST",
        "endpointUrl": "https://api.stripe.com/v1/charges",
        "authSecretReference": "$vault:STRIPE_SECRET_KEY"
      }
    }
  ],
  "frozenTestCases": [
    {
      "name": "Standard Charge",
      "inputPayload": { "amount": 9900 },
      "assertions": [{ "path": "status", "operator": "equals", "expectedValue": 200 }]
    }
  ]
}`
};

export const LANDING_I18N = {
  es: {
    badge: "⚡ Plataforma AI-First de Automatización con Gobernanza KDD",
    heroTitle: "Automatizaciones de IA Robustas, Gobernadas y Políglotas",
    heroSubtitle: "Diseña flujos visuales interactivos mediante WebMCP. Sintetiza APIs dinámicas desde cURL al instante, aísla tus secretos con una bóveda de Conocimiento Cero y compila a cualquier lenguaje con oráculos de prueba congelados.",
    btnLaunchApp: "🚀 Abrir Plataforma en Vivo",
    btnGithub: "⭐ Ver en GitHub",
    btnDocs: "📚 Documentación",
    navFeatures: "Características",
    navArch: "Arquitectura",
    navCompare: "Comparativa",
    navCode: "Código Políglota",
    previewTitle: "Orquestación en Tiempo Real con fastwebmcp",
    step1Title: "1. Ingesta de Webhook",
    step1Desc: "Recibe cargas útiles tipadas desde cualquier fuente externa.",
    step2Title: "2. Agente de IA",
    step2Desc: "Clasificación semántica con Gemini / Claude / GPT.",
    step3Title: "3. API Dinámica (Stripe)",
    step3Desc: "Sintetizada al vuelo desde cURL con secretos protegidos.",
    step4Title: "4. KDD Gate",
    step4Desc: "Verificación determinista con sellado criptográfico SHA256.",
    featuresTag: "Innovaciones Técnicas",
    featuresTitle: "Diseñado para Desarrolladores y Agentes Autónomos",
    featuresDesc: "Una arquitectura formal que une la flexibilidad visual con la verificación formal matemática.",
    f1Title: "🤖 Protocolo Nativo WebMCP",
    f1Text: "Los agentes de IA interactúan directamente con el DOM y el canvas mediante fastwebmcp para construir, validar y simular grafos.",
    f2Title: "✨ Síntesis Dinámica de APIs",
    f2Text: "Pega cualquier documentación cURL u OpenAPI de Stripe o WhatsApp: el sistema sintetiza un nodo tipado sin plugins precompilados.",
    f3Title: "🔐 Bóveda Zero-Knowledge",
    f3Text: "Tus claves privadas nunca se transmiten a la IA. El agente opera con identificadores ciegos ($vault:KEY) y los logs se redactan automáticamente.",
    f4Title: "🧪 Oráculos de Prueba KDD",
    f4Text: "Garantía determinista: suites de prueba congeladas con SHA256 que bloquean regresiones y alucinaciones en el código generado.",
    f5Title: "📦 Compilación Políglota",
    f5Text: "Exporta código nativo libre de dependencias para TypeScript, Python, PHP 8.2+, Go o emite el manifiesto IR para cualquier lenguaje.",
    f6Title: "🔗 URLs Custom sin Backend",
    f6Text: "Comparte flujos completos mediante un enlace comprimido URL-Safe (#flow=...) sin bases de datos externas ni fuga de secretos.",
    compareTag: "Benchmark de Arquitectura",
    compareTitle: "¿Por qué KDD Flow Engine frente a herramientas tradicionales?",
    compareDesc: "Comparativa técnica frente a plataformas de automatización convencionales.",
    compColFeature: "Característica",
    compColTrad: "Automatización Tradicional (n8n / Zapier)",
    compColKdd: "KDD Flow Engine (AI-First)",
    compR1: "Control por Agentes de IA",
    compR1Trad: "Asistentes de chat laterales no vinculados al motor",
    compR1Kdd: "Nativo en DOM via WebMCP (fastwebmcp)",
    compR2: "Nuevos Nodos de APIs",
    compR2Trad: "Requiere crear paquetes npm o plugins compilados",
    compR2Kdd: "Síntesis en segundos desde cURL/OpenAPI",
    compR3: "Manejo de Credenciales",
    compR3Trad: "Almacenadas en bases de datos del servidor",
    compR3Kdd: "Bóveda local Zero-Knowledge en cliente ($vault)",
    compR4: "Verificación de Calidad",
    compR4Trad: "Prueba manual o scripts ad-hoc",
    compR4Kdd: "KDD Frozen Acceptance Gates con SHA256",
    compR5: "Exportación de Código",
    compR5Trad: "Ejecución propietaria atada a su propio runtime",
    compR5Kdd: "Código nativo TypeScript, Python, PHP, Go o IR",
    codeTag: "Generación de Código",
    codeTitle: "Exportación a Cualquier Stack Tecnológico",
    codeDesc: "Inspecciona el código limpio y los oráculos de prueba que el sistema sintetiza automáticamente.",
    ctaTitle: "¿Listo para construir automatizaciones AI-First?",
    ctaSubtitle: "Accede al canvas visual interactivo de inmediato o integra tu agente mediante WebMCP.",
    ctaBtn: "🚀 Comenzar Ahora (Gratis y sin Registro)"
  },
  en: {
    badge: "⚡ AI-First Automation Platform with KDD Governance",
    heroTitle: "Robust, Governed & Polyglot AI Automations",
    heroSubtitle: "Design interactive visual flows via WebMCP. Synthesize dynamic APIs from cURL on the fly, isolate secrets with a Zero-Knowledge Vault, and compile to any language with frozen test oracles.",
    btnLaunchApp: "🚀 Launch Live Platform",
    btnGithub: "⭐ View on GitHub",
    btnDocs: "📚 Documentation",
    navFeatures: "Features",
    navArch: "Architecture",
    navCompare: "Comparison",
    navCode: "Polyglot Code",
    previewTitle: "Real-Time Orchestration with fastwebmcp",
    step1Title: "1. Webhook Ingest",
    step1Desc: "Receives typed payloads from any external source.",
    step2Title: "2. AI Agent",
    step2Desc: "Semantic classification with Gemini / Claude / GPT.",
    step3Title: "3. Dynamic API (Stripe)",
    step3Desc: "Synthesized on the fly from cURL with protected secrets.",
    step4Title: "4. KDD Gate",
    step4Desc: "Deterministic verification with SHA256 cryptographic seal.",
    featuresTag: "Technical Innovations",
    featuresTitle: "Built for Developers and Autonomous Agents",
    featuresDesc: "A formal architecture combining visual flexibility with mathematical verification.",
    f1Title: "🤖 Native WebMCP Protocol",
    f1Text: "AI agents interact directly with DOM and canvas via fastwebmcp to build, validate, and simulate DAGs.",
    f2Title: "✨ Dynamic API Synthesis",
    f2Text: "Paste any cURL or OpenAPI documentation from Stripe or WhatsApp: synthesized typed nodes without precompiled plugins.",
    f3Title: "🔐 Zero-Knowledge Vault",
    f3Text: "Your private keys are never transmitted to the AI. The agent operates with blind identifiers ($vault:KEY).",
    f4Title: "🧪 KDD Test Oracles",
    f4Text: "Deterministic guarantee: frozen test suites with SHA256 preventing regressions in generated code.",
    f5Title: "📦 Polyglot Compilation",
    f5Text: "Export zero-dependency native code for TypeScript, Python, PHP 8.2+, Go, or emit the IR manifest.",
    f6Title: "🔗 Zero-Backend Custom URLs",
    f6Text: "Share complete workflows via a compressed URL-safe link (#flow=...) with no external DB and 0 secret leaks.",
    compareTag: "Architecture Benchmark",
    compareTitle: "Why KDD Flow Engine over Traditional Tools?",
    compareDesc: "Technical comparison against conventional automation platforms.",
    compColFeature: "Feature",
    compColTrad: "Traditional Automation (n8n / Zapier)",
    compColKdd: "KDD Flow Engine (AI-First)",
    compR1: "AI Agent Control",
    compR1Trad: "Sidecar chat assistants disconnected from engine",
    compR1Kdd: "DOM Native via WebMCP (fastwebmcp)",
    compR2: "New API Nodes",
    compR2Trad: "Requires creating npm packages or plugins",
    compR2Kdd: "Synthesized in seconds from cURL/OpenAPI",
    compR3: "Credential Security",
    compR3Trad: "Stored in server databases",
    compR3Kdd: "Local Zero-Knowledge client vault ($vault)",
    compR4: "Quality Verification",
    compR4Trad: "Manual test clicks or ad-hoc scripts",
    compR4Kdd: "KDD Frozen Acceptance Gates with SHA256",
    compR5: "Code Export",
    compR5Trad: "Proprietary execution locked to vendor runtime",
    compR5Kdd: "Native TypeScript, Python, PHP, Go, or IR",
    codeTag: "Code Generation",
    codeTitle: "Export to Any Tech Stack",
    codeDesc: "Inspect the clean code and test oracles synthesized by the system.",
    ctaTitle: "Ready to Build AI-First Automations?",
    ctaSubtitle: "Access the interactive visual canvas immediately or wire your AI agent via WebMCP.",
    ctaBtn: "🚀 Get Started Now (Free & No Signup)"
  },
  pt: {
    badge: "⚡ Plataforma AI-First de Automação com Governança KDD",
    heroTitle: "Automações de IA Robustas, Governadas e Poliglotas",
    heroSubtitle: "Projete fluxos visuais interativos via WebMCP. Sintetize APIs dinâmicas a partir de cURL instantaneamente, isole segredos com um Cofre Zero-Knowledge e compile para qualquer linguagem com oráculos de teste congelados.",
    btnLaunchApp: "🚀 Abrir Plataforma ao Vivo",
    btnGithub: "⭐ Ver no GitHub",
    btnDocs: "📚 Documentação",
    navFeatures: "Recursos",
    navArch: "Arquitetura",
    navCompare: "Comparação",
    navCode: "Código Poliglota",
    previewTitle: "Orquestração em Tempo Real com fastwebmcp",
    step1Title: "1. Entrada de Webhook",
    step1Desc: "Recebe cargas tipadas de qualquer fonte externa.",
    step2Title: "2. Agente de IA",
    step2Desc: "Classificação semântica com Gemini / Claude / GPT.",
    step3Title: "3. API Dinâmica (Stripe)",
    step3Desc: "Sintetizada instantaneamente de cURL com segredos protegidos.",
    step4Title: "4. KDD Gate",
    step4Desc: "Verificação determinística com selo criptográfico SHA256.",
    featuresTag: "Inovações Técnicas",
    featuresTitle: "Construído para Desenvolvedores e Agentes Autônomos",
    featuresDesc: "Uma arquitetura formal que une flexibilidade visual com verificação matemática.",
    f1Title: "🤖 Protocolo Nativo WebMCP",
    f1Text: "Agentes de IA interagem diretamente com o DOM e o canvas via fastwebmcp para criar, validar e simular grafos.",
    f2Title: "✨ Síntese Dinâmica de APIs",
    f2Text: "Cole qualquer cURL ou OpenAPI do Stripe ou WhatsApp: o sistema sintetiza nós tipados sem plugins pré-compilados.",
    f3Title: "🔐 Cofre Zero-Knowledge",
    f3Text: "Suas chaves privadas nunca são transmitidas para a IA. O agente opera com identificadores cegos ($vault:KEY).",
    f4Title: "🧪 Oráculos de Teste KDD",
    f4Text: "Garantia determinística: suites de teste congeladas com SHA256 bloqueando regressões no código gerado.",
    f5Title: "📦 Compilação Poliglota",
    f5Text: "Exporte código nativo sem dependências para TypeScript, Python, PHP 8.2+, Go ou emita o manifesto IR.",
    f6Title: "🔗 URLs Custom sem Backend",
    f6Text: "Compartilhe fluxos completos via link comprimido URL-Safe (#flow=...) sem bancos de dados externos.",
    compareTag: "Benchmark de Arquitetura",
    compareTitle: "Por que KDD Flow Engine em vez de ferramentas tradicionais?",
    compareDesc: "Comparativo técnico contra plataformas de automação convencionais.",
    compColFeature: "Recurso",
    compColTrad: "Automação Tradicional (n8n / Zapier)",
    compColKdd: "KDD Flow Engine (AI-First)",
    compR1: "Controle por Agentes de IA",
    compR1Trad: "Assistentes de chat laterais desconectados do motor",
    compR1Kdd: "Nativo no DOM via WebMCP (fastwebmcp)",
    compR2: "Novos Nós de APIs",
    compR2Trad: "Requer criar pacotes npm ou plugins",
    compR2Kdd: "Sintetizado em segundos a partir de cURL/OpenAPI",
    compR3: "Segurança de Credenciais",
    compR3Trad: "Armazenadas em bancos de dados do servidor",
    compR3Kdd: "Cofre local Zero-Knowledge no cliente ($vault)",
    compR4: "Verificação de Qualidade",
    compR4Trad: "Cliques de teste manuais ou scripts ad-hoc",
    compR4Kdd: "KDD Frozen Acceptance Gates com SHA256",
    compR5: "Exportação de Código",
    compR5Trad: "Execução proprietária presa ao runtime do fornecedor",
    compR5Kdd: "Código nativo TypeScript, Python, PHP, Go ou IR",
    codeTag: "Geração de Código",
    codeTitle: "Exportação para Qualquer Stack",
    codeDesc: "Inspecione o código limpo e os oráculos sintetizados automaticamente.",
    ctaTitle: "Pronto para construir automações AI-First?",
    ctaSubtitle: "Acesse o canvas visual imediatamente ou conecte seu agente de IA via WebMCP.",
    ctaBtn: "🚀 Começar Agora (Grátis e sem Cadastro)"
  }
};

document.addEventListener("DOMContentLoaded", () => {
  // Code Tabs
  const tabs = document.querySelectorAll(".code-tab");
  const codeBox = document.getElementById("code-display");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const lang = tab.getAttribute("data-lang") || "ts";
      if (codeBox) {
        codeBox.textContent = CODE_SNIPPETS[lang] || "";
      }
    });
  });

  // Language Selector
  const langSel = document.getElementById("landing-lang-selector") as HTMLSelectElement;
  let currentLang = "es";

  const applyLang = (lang: "es" | "en" | "pt") => {
    currentLang = lang;
    const texts = LANDING_I18N[lang] || LANDING_I18N.es;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n") as keyof typeof texts;
      if (key && texts[key]) {
        el.textContent = texts[key];
      }
    });
  };

  if (langSel) {
    langSel.addEventListener("change", (e) => {
      const val = (e.target as HTMLSelectElement).value as "es" | "en" | "pt";
      applyLang(val);
    });
  }

  applyLang("es");
});
