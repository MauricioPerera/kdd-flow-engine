import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { TRANSLATIONS, getLocale, setLocale, t, Locale } from "../src/i18n/translations.js";
import { createWebMcpMock } from "fastwebmcp";
import { createFlowStore, registerFlowWebMcpTools } from "../src/mcp/tools.js";

describe("Multilingual i18n System (Spanish, English, Portuguese)", () => {
  let mock: ReturnType<typeof createWebMcpMock>;
  let store: ReturnType<typeof createFlowStore>;

  beforeEach(() => {
    mock = createWebMcpMock();
    (globalThis as any).document = mock.document;
    store = createFlowStore();
    registerFlowWebMcpTools(store);
  });

  it("Ensures all translation keys are present across es, en, and pt", () => {
    const locales: Locale[] = ["es", "en", "pt"];
    const baseKeys = Object.keys(TRANSLATIONS.en).sort();

    for (const loc of locales) {
      const locDict = TRANSLATIONS[loc];
      const locKeys = Object.keys(locDict).sort();

      assert.deepEqual(locKeys, baseKeys, `Locale '${loc}' has mismatched keys compared to 'en'`);
      for (const [k, val] of Object.entries(locDict)) {
        assert.ok(typeof val === "string" && val.length > 0, `Key '${k}' in locale '${loc}' is empty`);
      }
    }
  });

  it("Switches language reactively and retrieves localized strings", () => {
    // 1. Spanish
    setLocale("es");
    assert.equal(getLocale(), "es");
    assert.equal(t().btnValidateDag, "🛡️ Validar DAG");
    assert.equal(t().btnRunSimulation, "▶ Ejecutar Simulación");

    // 2. English
    setLocale("en");
    assert.equal(getLocale(), "en");
    assert.equal(t().btnValidateDag, "🛡️ Validate DAG");
    assert.equal(t().btnRunSimulation, "▶ Run Simulation");

    // 3. Portuguese
    setLocale("pt");
    assert.equal(getLocale(), "pt");
    assert.equal(t().btnValidateDag, "🛡️ Validar DAG");
    assert.equal(t().btnVault, "🔐 Cofre");
    assert.equal(t().btnRunSimulation, "▶ Executar Simulação");
  });

  it("Updates language via WebMCP agent tool 'set_agent_language'", async () => {
    const res = (await mock.invokeTool("set_agent_language", { locale: "pt" })) as any;
    assert.equal(res.success, true);
    assert.equal(res.currentLocale, "pt");
    assert.equal(getLocale(), "pt");
  });
});
