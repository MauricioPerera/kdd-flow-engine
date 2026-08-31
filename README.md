# KDD Flow Engine ⚡

**AI-First Automation & Workflow Orchestration Platform** built with **KDD (Knowledge-Driven Development)** methodology and **fastwebmcp (WebMCP)**.

---

## 🌟 Key Features

1. **AI-First Visual Workflow Canvas**:
   - Interactive SVG node-and-wire canvas.
   - 12+ standard node types (AI Agent, Router, Extractor, Condition, Script, Webhook, Transform, Iterator, Log).
   - Live step-by-step simulation with real-time execution highlighting.

2. **Dynamic API Node Synthesis (Stripe, WhatsApp, Custom APIs)**:
   - Paste any API documentation (cURL, OpenAPI, markdown).
   - The engine automatically synthesizes typed input/output ports, authentication schemes, and native code without needing precompiled plugins.

3. **Zero-Knowledge Local Credential Vault**:
   - 100% client-side memory isolation.
   - The AI agent only sees opaque references (`$vault:STRIPE_SECRET_KEY`) and can **never** extract raw secret values.
   - Automatic log redaction and one-click `.env` export.

4. **KDD Frozen Acceptance Gates & Contract Governance**:
   - Deterministic verification: golden test cases and invariant assertions.
   - Cryptographic SHA256 test sealing (`tests_sha256`) to prevent unauthorized test drift.

5. **Universal AI Specification Package & Polyglot Synthesis**:
   - Language-agnostic functional Intermediate Representation (IR).
   - Direct export to **TypeScript (Node.js)**, **Python (asyncio)**, **PHP 8.2+**, **Go**, or any arbitrary target language (Elixir, Rust, C#, Kotlin, Solidity, etc.).

6. **Full Multilingual Support (i18n)**:
   - 🇪🇸 **Español**
   - 🇬🇧 **English**
   - 🇧🇷 **Português**

7. **Native WebMCP Protocol via fastwebmcp**:
   - 15 WebMCP tools registered directly to `document.modelContext` for browser AI agents.

---

## 🚀 Quick Start

### Installation
```bash
git clone https://github.com/MauricioPerera/kdd-flow-engine.git
cd kdd-flow-engine
npm install
```

### Run Locally (Dev Server)
```bash
npm run dev
```
Open `http://localhost:5173/` in your browser.

### Run Verification & Test Suite
```bash
npm run validate
```

---

## 🏛️ Architecture & Knowledge Base (OKF & CCDD)
- `knowledge/` contains 14 formal Open Knowledge Format (OKF) nodes.
- `knowledge/contracts/` contains 4 cryptographically sealed CCDD Task Contracts.

---

## 📜 License
MIT License.
