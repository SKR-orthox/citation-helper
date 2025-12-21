(() => {
  const api = (typeof browser !== "undefined") ? browser : chrome;
  console.log("[PCH] popup loaded");

  // Ensure global namespace exists (reasons.js should also do this)
  globalThis.PCH = globalThis.PCH || {};

  // -------------------------
  // DOM
  // -------------------------
  const citationBox  = document.getElementById("citationBox");
  const generateBtn  = document.getElementById("generateBtn");
  const copyBtn      = document.getElementById("copyBtn");
  const statusEl     = document.getElementById("status");

  const styleSelect  = document.getElementById("styleSelect");
  const langSelect   = document.getElementById("langSelect");
  const presetSelect = document.getElementById("presetSelect");

  const styleLabel   = document.getElementById("styleLabel");
  const langLabel    = document.getElementById("langLabel");
  const presetLabel  = document.getElementById("presetLabel");

  // Guard (popup.html ids mismatch etc.)
  if (!citationBox || !generateBtn || !copyBtn || !statusEl || !styleSelect || !langSelect) {
    console.warn("[PCH] popup DOM missing. Check popup.html element ids.");
    return;
  }

  // -------------------------
  // State
  // -------------------------
  let rawData = null;
  let currentData = null;
  let currentCitation = "";
  let canCopy = false;

  let debugMode = false;
  let savedAuthorPreset = "default";

  // -------------------------
  // i18n messages
  // -------------------------
  const messages = {
    en: {
      btnGenerate: "Fetch citation",
      btnCopy: "Copy",
      labelStyle: "Style:",
      labelLang: "Language:",
      labelPreset: "Authors:",
      placeholder: "Citation will be shown here.",
      statusCopied: "Copied to clipboard.",
      statusCopyFailed: "Copy failed."
    },
    ko: {
      btnGenerate: "인용 불러오기",
      btnCopy: "복사하기",
      labelStyle: "형식:",
      labelLang: "언어:",
      labelPreset: "저자:",
      placeholder: "이곳에 참고문헌 형식으로 표시됩니다",
      statusCopied: "클립보드에 복사했습니다.",
      statusCopyFailed: "복사에 실패했습니다."
    },
    ja: {
      btnGenerate: "引用を取得",
      btnCopy: "コピー",
      labelStyle: "形式:",
      labelLang: "言語:",
      labelPreset: "著者:",
      placeholder: "ここに表示されます",
      statusCopied: "クリップボードにコピーしました。",
      statusCopyFailed: "コピーに失敗しました。"
    }
  };

  function m() {
    return messages[langSelect.value] || messages.en;
  }

  // -------------------------
  // Reasons (single source of truth)
  // -------------------------
  const R = globalThis.PCH?.REASONS || Object.freeze({
    UNSUPPORTED_SITE: "UNSUPPORTED_SITE",
    NO_ARTICLE: "NO_ARTICLE",
    SITE_CHANGED: "SITE_CHANGED",
    PARSE_FAILED: "PARSE_FAILED",
    EXTENSION_NOT_ACTIVE: "EXTENSION_NOT_ACTIVE",
    MISSING_FIELDS: "MISSING_FIELDS",
    UNKNOWN: "UNKNOWN"
  });

  const KNOWN_REASONS = new Set(Object.values(R));

  function normalizeReason(code) {
    return KNOWN_REASONS.has(code) ? code : R.UNKNOWN;
  }

  // -------------------------
  // Supported sites / URL classify
  // -------------------------
  const SITE_SPECS = [
    {
      id: "pubmed",
      hosts: ["pubmed.ncbi.nlm.nih.gov"],
      isArticleUrl: (u) => /\/\d+\/?$/.test(u.pathname) // /<PMID>/
    },
    {
      id: "nature",
      hosts: ["www.nature.com", "nature.com"],
      isArticleUrl: (u) => /\/(?:[a-z]{2}\/)?articles\/[^\/]+\/?$/.test(u.pathname)
    },
    {
      id: "springer",
      hosts: ["link.springer.com"],
      isArticleUrl: (u) => /^\/(article|chapter)\/.+/i.test(u.pathname)
    }
  ];

  function classifyByUrl(rawUrl) {
    try {
      const u = new URL(rawUrl);
      const host = (u.hostname || "").toLowerCase();
      const spec = SITE_SPECS.find(s => (s.hosts || []).includes(host));
      if (!spec) return { ok: false, reason: R.UNSUPPORTED_SITE };

      const isArticle = !!(spec.isArticleUrl && spec.isArticleUrl(u));
      if (!isArticle) return { ok: false, reason: R.NO_ARTICLE, siteId: spec.id };

      return { ok: true, siteId: spec.id };
    } catch {
      return { ok: false, reason: R.UNKNOWN };
    }
  }

  // -------------------------
  // UI helpers
  // -------------------------
  function setCitation(text, ok) {
    citationBox.textContent = String(text ?? "");
    canCopy = !!ok;
    currentCitation = ok ? String(text ?? "") : "";
  }

  function setStatus(code, text) {
    const t = String(text ?? "");
    if (!debugMode || !code) {
      statusEl.textContent = t;
      return;
    }
    statusEl.textContent = t ? `${t}\n[${code}]` : `[${code}]`;
  }

  function articleHintBySite(lang, siteId) {
    const L = String(lang || "en").toLowerCase();
    const HINTS = {
      en: {
        pubmed: "Open a PubMed article page like /<PMID>/ and try again.",
        nature: "Open a Nature article page under /articles/ and try again.",
        springer: "Open a SpringerLink /article/ or /chapter/ page and try again.",
        default: "Open an article detail page and try again."
      },
      ko: {
        pubmed: "PubMed 논문 상세 페이지(/<PMID>/)에서 다시 시도해 주세요.",
        nature: "Nature 논문 페이지(/articles/...)에서 다시 시도해 주세요.",
        springer: "SpringerLink 논문 페이지(/article/ 또는 /chapter/)에서 다시 시도해 주세요.",
        default: "논문 상세 페이지에서 다시 시도해 주세요."
      },
      ja: {
        pubmed: "PubMedの論文詳細ページ（/<PMID>/）で再度お試しください。",
        nature: "Natureの論文ページ（/articles/...）で再度お試しください。",
        springer: "SpringerLinkの論文ページ（/article/ または /chapter/）で再度お試しください。",
        default: "論文の詳細ページで再度お試しください。"
      }
    };
    const dict = HINTS[L] || HINTS.en;
    return dict[siteId] || dict.default;
  }

  function reasonMessage(code, ctx = {}) {
    const lang = langSelect?.value || "en";
    const siteId = ctx.siteId || "default";

    const T = {
      en: {
        [R.UNSUPPORTED_SITE]: {
          problem: "This site isn't supported yet.",
          action: "Open a supported site (PubMed, Nature, SpringerLink) and try again."
        },
        [R.NO_ARTICLE]: {
          problem: "No article detected on this page.",
          action: () => articleHintBySite("en", siteId)
        },
        [R.SITE_CHANGED]: {
          problem: "This looks like an article page, but extraction failed. The site structure may have changed.",
          action: "Reload the page and try again. If it still fails, please report the URL."
        },
        [R.PARSE_FAILED]: {
          problem: "Couldn't extract enough citation data from this page.",
          action: "Reload the page and try again. If it still fails, please report the URL."
        },
        [R.MISSING_FIELDS]: {
          problem: "Couldn't extract enough citation data from this page.",
          action: "Reload the page and try again. If it still fails, please report the URL."
        },
        [R.EXTENSION_NOT_ACTIVE]: {
          problem: "The extension isn't active on this tab.",
          action: "Reload the page, then try again."
        },
        [R.UNKNOWN]: {
          problem: "Something went wrong.",
          action: "Reload the page and try again."
        }
      },

      ko: {
        [R.UNSUPPORTED_SITE]: {
          problem: "아직 지원하지 않는 사이트입니다.",
          action: "지원 사이트(PubMed, Nature, SpringerLink)에서 다시 시도해 주세요."
        },
        [R.NO_ARTICLE]: {
          problem: "이 페이지에서 논문을 찾지 못했습니다.",
          action: () => articleHintBySite("ko", siteId)
        },
        [R.SITE_CHANGED]: {
          problem: "논문 페이지로 보이지만, 인용 정보 추출에 실패했습니다. 사이트 구조가 바뀌었을 수 있습니다.",
          action: "페이지를 새로고침한 뒤 다시 시도해 주세요. 계속 실패하면 URL을 공유해 주세요."
        },
        [R.PARSE_FAILED]: {
          problem: "이 페이지에서 인용 정보를 충분히 추출하지 못했습니다.",
          action: "페이지를 새로고침한 뒤 다시 시도해 주세요. 계속 실패하면 URL을 공유해 주세요."
        },
        [R.MISSING_FIELDS]: {
          problem: "이 페이지에서 인용 정보를 충분히 추출하지 못했습니다.",
          action: "페이지를 새로고침한 뒤 다시 시도해 주세요. 계속 실패하면 URL을 공유해 주세요."
        },
        [R.EXTENSION_NOT_ACTIVE]: {
          problem: "이 탭에서 확장 프로그램이 활성화되지 않았습니다.",
          action: "페이지를 새로고침한 뒤 다시 시도해 주세요."
        },
        [R.UNKNOWN]: {
          problem: "오류가 발생했습니다.",
          action: "페이지를 새로고침한 뒤 다시 시도해 주세요."
        }
      },

      ja: {
        [R.UNSUPPORTED_SITE]: {
          problem: "このサイトはまだ対応していません。",
          action: "対応サイト（PubMed / Nature / SpringerLink）で再度お試しください。"
        },
        [R.NO_ARTICLE]: {
          problem: "このページでは論文を検出できませんでした。",
          action: () => articleHintBySite("ja", siteId)
        },
        [R.SITE_CHANGED]: {
          problem: "論文ページに見えますが、引用情報の抽出に失敗しました。サイト構造が変更された可能性があります。",
          action: "再読み込みして再度お試しください。引き続き失敗する場合はURLを共有してください。"
        },
        [R.PARSE_FAILED]: {
          problem: "引用情報を十分に抽出できませんでした。",
          action: "再読み込みして再度お試しください。引き続き失敗する場合はURLを共有してください。"
        },
        [R.MISSING_FIELDS]: {
          problem: "引用情報を十分に抽出できませんでした。",
          action: "再読み込みして再度お試しください。引き続き失敗する場合はURLを共有してください。"
        },
        [R.EXTENSION_NOT_ACTIVE]: {
          problem: "このタブでは拡張機能が有効になっていません。",
          action: "ページを再読み込みしてから再度お試しください。"
        },
        [R.UNKNOWN]: {
          problem: "エラーが発生しました。",
          action: "再読み込みして再度お試しください。"
        }
      }
    };

    const dict = T[lang] || T.en;
    const safeCode = normalizeReason(code);
    const item = dict[safeCode] || dict[R.UNKNOWN];

    const problem = (typeof item.problem === "function") ? item.problem(ctx) : item.problem;
    const action  = (typeof item.action === "function") ? item.action(ctx) : item.action;

    return action ? `${problem}\n${action}` : String(problem || "");
  }

  function showFailure(code, ctx = {}) {
    const safe = normalizeReason(code);
    const text = reasonMessage(safe, ctx);
    rawData = null;
    currentData = null;
    setCitation(text, false);
    setStatus(safe, text);
  }

  // -------------------------
  // Clipboard
  // -------------------------
  function copyToClipboard(text) {
    const t = String(text ?? "");
    if (!t) return Promise.reject(new Error("empty"));

    const legacyCopy = () => {
      const ta = document.createElement("textarea");
      ta.value = t;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      ta.style.top = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      if (!ok) throw new Error("copy failed");
    };

    if (navigator?.clipboard?.writeText) {
      return navigator.clipboard.writeText(t).catch((e) => {
        try { legacyCopy(); return; } catch { throw e; }
      });
    }

    return new Promise((resolve, reject) => {
      try { legacyCopy(); resolve(); } catch (e) { reject(e); }
    });
  }

  // -------------------------
  // Author preset helpers
  // -------------------------
  function splitName(name) {
    const s = String(name || "").trim().replace(/\s+/g, " ");
    if (!s) return null;

    if (s.includes(",")) {
      const [familyRaw, givenRaw] = s.split(",", 2);
      return { family: (familyRaw || "").trim(), given: (givenRaw || "").trim() };
    }

    const parts = s.split(" ").filter(Boolean);
    if (parts.length === 1) return { family: parts[0], given: "" };
    return { family: parts[parts.length - 1], given: parts.slice(0, -1).join(" ") };
  }

  function initialsFromGiven(given, withDots) {
    const g = String(given || "").trim();
    if (!g) return "";

    const tokens = g
      .replace(/\./g, " ")
      .replace(/-/g, " ")
      .split(/\s+/)
      .filter(Boolean);

    const letters = tokens.map(t => t[0]).filter(Boolean);
    if (letters.length === 0) return "";

    return withDots ? letters.map(ch => `${ch}.`).join(" ") : letters.join("");
  }

  function buildDerivedAuthors(authors) {
    const list = Array.isArray(authors) ? authors : [];
    const parsed = list.map(splitName).filter(Boolean);

    const authorsVancouver = parsed.map(p => {
      const ini = initialsFromGiven(p.given, false);
      const family = (p.family || "").trim();
      return [family, ini].filter(Boolean).join(" ").trim();
    }).filter(Boolean);

    const authorsAPA = parsed.map(p => {
      const ini = initialsFromGiven(p.given, true);
      const family = (p.family || "").trim();
      if (!family) return "";
      return ini ? `${family}, ${ini}` : family;
    }).filter(Boolean);

    const authorsIEEE = parsed.map(p => {
      const ini = initialsFromGiven(p.given, true);
      const family = (p.family || "").trim();
      if (!family) return "";
      return ini ? `${ini} ${family}` : family;
    }).filter(Boolean);

    return { authorsVancouver, authorsAPA, authorsIEEE };
  }

  function applyAuthorPreset(data, presetId) {
    if (!data || typeof data !== "object") return data;

    // Raw: remove derived arrays so formatter falls back to data.authors
    if (presetId === "raw") {
      const out = { ...data };
      delete out.authorsVancouver;
      delete out.authorsAPA;
      delete out.authorsIEEE;
      return out;
    }

    // Auto initials: only generate derived arrays when missing
    if (presetId !== "autoInitials") return data;

    const hasAnyDerived =
      Array.isArray(data.authorsVancouver) ||
      Array.isArray(data.authorsAPA) ||
      Array.isArray(data.authorsIEEE);

    if (hasAnyDerived) return data;
    if (!Array.isArray(data.authors) || data.authors.length === 0) return data;

    const derived = buildDerivedAuthors(data.authors);
    return { ...data, ...derived };
  }

  // -------------------------
  // Export styles: preset locked to default
  // -------------------------
  const EXPORT_STYLES = new Set(["bibtex", "csljson", "ris"]);

  function isExportStyle(style) {
    return EXPORT_STYLES.has(String(style || "").toLowerCase());
  }

  function activePresetIdForStyle(style) {
    if (isExportStyle(style)) return "default";
    return presetSelect?.value || savedAuthorPreset || "default";
  }

  function updatePresetUIForStyle(style) {
    if (!presetSelect) return;
    const exportMode = isExportStyle(style);
    presetSelect.disabled = exportMode;
    presetSelect.value = exportMode ? "default" : (savedAuthorPreset || "default");
  }

  function effectiveData() {
    const style = styleSelect?.value || "vancouver";
    const presetId = activePresetIdForStyle(style);
    return applyAuthorPreset(rawData, presetId);
  }

  // -------------------------
  // Render
  // -------------------------
  function render() {
    if (!rawData) {
      setCitation(m().placeholder, false);
      return;
    }
    const style = styleSelect.value || "vancouver";
    const f = globalThis.PCH?.formatters?.[style] || globalThis.PCH?.formatters?.vancouver;
    currentData = effectiveData();
    const out = f ? f(currentData) : "";
    setCitation(out || reasonMessage(R.UNKNOWN), !!out);
  }

  function applyLang() {
    generateBtn.textContent = m().btnGenerate;
    copyBtn.textContent = m().btnCopy;
    styleLabel.textContent = m().labelStyle;
    langLabel.textContent = m().labelLang;
    if (presetLabel) presetLabel.textContent = m().labelPreset;

    if (!rawData) citationBox.textContent = m().placeholder;
  }

  // -------------------------
  // Promisified wrappers (Firefox + future Chrome)
  // -------------------------
  function tabsQuery(queryInfo) {
    try {
      const p = api.tabs.query(queryInfo);
      if (p && typeof p.then === "function") return p;
    } catch {}
    return new Promise((resolve, reject) => {
      api.tabs.query(queryInfo, (tabs) => {
        const err = api.runtime?.lastError;
        if (err) reject(err);
        else resolve(tabs);
      });
    });
  }

  function tabsSendMessage(tabId, message) {
    try {
      const p = api.tabs.sendMessage(tabId, message);
      if (p && typeof p.then === "function") return p;
    } catch {}
    return new Promise((resolve, reject) => {
      api.tabs.sendMessage(tabId, message, (resp) => {
        const err = api.runtime?.lastError;
        if (err) reject(err);
        else resolve(resp);
      });
    });
  }

  function tabsExecuteScript(tabId, details) {
  try {
    const p = api.tabs.executeScript(tabId, details);
    if (p && typeof p.then === "function") return p;
  } catch {}
  return new Promise((resolve, reject) => {
    api.tabs.executeScript(tabId, details, (res) => {
      const err = api.runtime?.lastError;
      if (err) reject(err);
      else resolve(res);
    });
  });
}

  async function getActiveTabUrl(tab) {
    let url = tab?.url || tab?.pendingUrl || "";
    if (url) return url;

    // Fallback: activeTab 권한으로 현재 페이지의 location.href 직접 가져오기
    try {
      const res = await tabsExecuteScript(tab.id, { code: "location.href" });
      if (Array.isArray(res) && typeof res[0] === "string") return res[0];
    } catch (e) {
      console.warn("[PCH] failed to read location.href via executeScript:", e);
    }
    return "";
  }

  function storageGet(keys) {
    try {
      const p = api.storage.local.get(keys);
      if (p && typeof p.then === "function") return p;
    } catch {}
    return new Promise((resolve) => api.storage.local.get(keys, resolve));
  }

  function storageSet(obj) {
    try {
      const p = api.storage.local.set(obj);
      if (p && typeof p.then === "function") return p;
    } catch {}
    return new Promise((resolve) => api.storage.local.set(obj, resolve));
  }

  // -------------------------
  // Fetch citation
  // -------------------------
  async function requestCitation() {
    setStatus("", "");

    let tab;
    try {
      const tabs = await tabsQuery({ active: true, currentWindow: true });
      tab = tabs && tabs[0];
    } catch (e) {
      console.warn("[PCH] tabs.query failed:", e);
      showFailure(R.UNKNOWN, {});
      return;
    }

    if (!tab) {
      showFailure(R.UNKNOWN, {});
      return;
    }

    const url = await getActiveTabUrl(tab);
    if (!url) {
      showFailure(R.UNKNOWN, {});
      return;
    }
    const pre = classifyByUrl(url);

    // ✅ IMPORTANT: DO NOT sendMessage when not article/unsupported
    if (!pre.ok) {
      showFailure(pre.reason || R.UNKNOWN, { siteId: pre.siteId, url });
      return;
    }

    // Article URL on supported host: sendMessage to content script
    let resp;
    try {
      resp = await tabsSendMessage(tab.id, { type: "GET_CITATION_DATA" });
    } catch (e) {
      console.warn("[PCH popup] sendMessage error:", e);
      // For supported + article url, sendMessage failing = extension not active on that tab (reload needed)
      showFailure(R.EXTENSION_NOT_ACTIVE, { siteId: pre.siteId, url });
      return;
    }

    if (resp && resp.ok && resp.data) {
      rawData = resp.data;
      currentData = effectiveData();

      if (debugMode) {
        try {
          await storageSet({
            lastCitationData: JSON.parse(JSON.stringify(currentData)),
            lastCitationUrl: url,
            lastCitationAt: Date.now()
          });
        } catch (e) {
          console.warn("[PCH debug] failed to store lastCitationData", e);
        }
      }

      render();
      return;
    }

    // Failure reported by content script
    if (debugMode) {
      globalThis.PCH = globalThis.PCH || {};
      globalThis.PCH.lastPopupResponse = resp ? JSON.parse(JSON.stringify(resp)) : null;
      console.log("[PCH debug] lastPopupResponse ready");
    }

    const code = resp && resp.errorCode ? String(resp.errorCode) : R.PARSE_FAILED;
    showFailure(code, { siteId: pre.siteId, url });
  }

  // -------------------------
  // Events
  // -------------------------
  generateBtn.addEventListener("click", () => { requestCitation(); });

  copyBtn.addEventListener("click", () => {
    if (!canCopy || !currentCitation) return;
    copyToClipboard(currentCitation)
      .then(() => setStatus("", m().statusCopied))
      .catch(() => setStatus("", m().statusCopyFailed));
  });

  styleSelect.addEventListener("change", () => {
    storageSet({ citationStyle: styleSelect.value });
    updatePresetUIForStyle(styleSelect.value);
    if (rawData) render();
  });

  presetSelect?.addEventListener("change", () => {
    const style = styleSelect?.value || "vancouver";
    if (isExportStyle(style)) {
      presetSelect.value = "default";
      return;
    }

    savedAuthorPreset = presetSelect.value || "default";
    storageSet({ authorPreset: savedAuthorPreset });

    if (rawData) render();
    else setStatus("", "");
  });

  langSelect.addEventListener("change", () => {
    storageSet({ uiLanguage: langSelect.value });
    applyLang();
    if (rawData) render();
    else setStatus("", "");
  });

  // -------------------------
  // Settings migration skeleton
  // -------------------------
  const SETTINGS_VERSION = 1;

  function migrateSettings(d) {
    const out = { ...(d || {}) };
    const currentRaw = Number(out.settingsVersion);
    const current = Number.isFinite(currentRaw) ? currentRaw : 0;

    let changed = false;

    const setIfMissing = (key, value) => {
      if (out[key] === undefined) {
        out[key] = value;
        changed = true;
      }
    };

    if (current < 1) {
      setIfMissing("uiLanguage", "en");
      setIfMissing("citationStyle", "vancouver");
      setIfMissing("authorPreset", "default");
      setIfMissing("debugMode", false);

      out.settingsVersion = 1;
      if (current !== 1) changed = true;
    }

    return { migrated: out, changed };
  }

  // -------------------------
  // Init
  // -------------------------
  document.addEventListener("DOMContentLoaded", async () => {
    const d = await storageGet(["settingsVersion", "uiLanguage", "debugMode", "authorPreset", "citationStyle"]);
    const { migrated, changed } = migrateSettings(d);

    if (changed) {
      await storageSet({
        settingsVersion: migrated.settingsVersion,
        uiLanguage: migrated.uiLanguage,
        citationStyle: migrated.citationStyle,
        authorPreset: migrated.authorPreset,
        debugMode: migrated.debugMode
      });
    }

    debugMode = !!migrated.debugMode;

    langSelect.value = migrated.uiLanguage || "en";
    styleSelect.value = migrated.citationStyle || "vancouver";

    savedAuthorPreset = migrated.authorPreset || "default";
    if (presetSelect) presetSelect.value = savedAuthorPreset;

    applyLang();
    updatePresetUIForStyle(styleSelect.value);

    // Auto fetch once when popup opens
    requestCitation();
  });
})();