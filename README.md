# KDD Flow Engine ⚡

[![Deploy to GitHub Pages](https://github.com/MauricioPerera/kdd-flow-engine/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/MauricioPerera/kdd-flow-engine/actions/workflows/deploy-pages.yml)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-brightgreen?logo=github)](https://mauricioperera.github.io/kdd-flow-engine/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![WebMCP](https://img.shields.io/badge/WebMCP-fastwebmcp-purple)](https://github.com/MauricioPerera/fastwebmcp)
[![KDD Methodology](https://img.shields.io/badge/Methodology-KDD%20%26%20CCDD-orange)](https://github.com/MauricioPerera/KDD)
[![i18n](https://img.shields.io/badge/i18n-ES%20%7C%20EN%20%7C%20PT-informational)](#-multilingual-support-i18n)

> **AI-First Automation & Workflow Orchestration Engine** with deterministic **KDD Governance**, in-browser agent tools via **fastwebmcp (WebMCP)**, **Dynamic On-the-fly API Synthesis**, a **Zero-Knowledge Local Credential Vault**, and **Polyglot Code Generation** (TypeScript, Python, PHP, Go, Elixir, Rust, etc.).

🌐 **Live Web Application**: [https://mauricioperera.github.io/kdd-flow-engine/](https://mauricioperera.github.io/kdd-flow-engine/)

---

## 🚀 Key Architectural Innovations

```mermaid
flowchart LR
    User["👤 User / Visual Canvas"] <--> WebMCP["🤖 fastwebmcp\n(WebMCP Bridge)"]
    WebMCP <--> Agent["🧠 Browser AI Agent\n(Claude / Gemini / GPT)"]
    
    subgraph Engine ["⚡ KDD Flow Engine"]
        DAG["🛡️ Deterministic DAG Validator\n(Kahn / Cycle Detection)"]
        Vault["🔐 Zero-Knowledge Vault\n(Client-side Isolated Secrets)"]
        Dynamic["✨ Dynamic Node Synthesizer\n(cURL / OpenAPI to Typed Nodes)"]
        Gate["🧪 Frozen Acceptance Gate\n(Cryptographic SHA256 Oracles)"]
    end
    
    WebMCP --> Engine
    Engine --> CodeGen["📦 Polyglot Code Generation\n(TS, Python, PHP 8.2+, Go, IR Manifest)"]
```

### 1. 🤖 AI-First Agent Control via WebMCP (`fastwebmcp`)
- The visual canvas registers **15 specialized WebMCP tools** directly to `document.modelContext`.
- Browser AI agents can programmatically construct DAGs, inspect topology, connect ports, run simulations, and export code without human friction.

### 2. ✨ Dynamic On-the-Fly API Synthesis (e.g. Stripe, WhatsApp)
- No precompiled plugins or static packages needed.
- Provide any API documentation (cURL, OpenAPI, markdown), and the engine synthesizes a strongly-typed node with input/output ports, authentication templates, and native polyglot code generation.

### 3. 🔐 Zero-Knowledge Local Credential Vault
- Secrets are stored **strictly in local browser memory / session**.
- The AI agent only receives blind references (`$vault:STRIPE_SECRET_KEY`) and **can never extract or inspect raw secret values**.
- Runtime logs and outputs automatically redact secrets (`[REDACTED:$vault:KEY]`).
- One-click `.env` export for local environments.

### 4. 🧪 KDD Frozen Acceptance Gates (`runFrozenOracleGate`)
- Workflows are governed by **KDD Task Contracts** (`.contract.md`).
- Golden test cases and invariant assertions prevent regressions.
- Cryptographic SHA256 sealing (`tests_sha256`) blocks unauthorized test drift.

### 5. 📦 Universal Specification Manifest & Polyglot Code Generation
- Generates clean, typed, zero-dependency production code for:
  - **TypeScript (Node.js)**
  - **Python (asyncio)**
  - **PHP 8.2+ (strict types & PHPUnit)**
  - **Go (Golang structs & testing)**
- Emits a **Universal AI Specification Package** allowing an LLM agent to synthesize code in **any arbitrary language** (Elixir, Rust, Zig, Solidity, Ruby, Kotlin, C#, etc.).

### 6. 🌐 Full Multilingual Support (i18n)
- 🇪🇸 **Español**
- 🇬🇧 **English**
- 🇧🇷 **Português**

---

## 🛠️ Tech Stack & Protocols

| Layer | Technology |
| :--- | :--- |
| **Methodology** | [KDD (Knowledge-Driven Development)](https://github.com/MauricioPerera/KDD) & CCDD |
| **Agent Protocol** | [fastwebmcp (WebMCP for Web Browsers)](https://github.com/MauricioPerera/fastwebmcp) |
| **Schemas & Types** | TypeScript 5.7, Zod |
| **Frontend UI** | Reactive SVG Canvas, Pure CSS, Vite |
| **Runtime & Tests** | Node.js Test Runner (`node:test`), Python `unittest`, PHPUnit, Go `testing` |
| **Deployment** | GitHub Pages (Automated CI/CD via GitHub Actions), Cloudflare Pages Ready |

---

## ⚡ Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/MauricioPerera/kdd-flow-engine.git
cd kdd-flow-engine
npm install
```

### 2. Run Locally
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your browser.

### 3. Execute Complete Validation Suite
```bash
npm run validate
```
Runs 31 unit, E2E, polyglot binary execution, and KDD gate tests.

---

## 🏛️ Knowledge Base & Contract Governance (OKF)
- `knowledge/` contains 14 formal **Open Knowledge Format (OKF)** architecture specifications.
- `knowledge/contracts/` contains 4 cryptographically sealed **CCDD Task Contracts**.

---

## 📄 License
Released under the [MIT License](LICENSE).
