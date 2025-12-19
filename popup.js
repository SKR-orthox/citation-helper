(() => {
  const api = (typeof browser !== "undefined") ? browser : chrome;
  console.log("[PCH] popup loaded");

  const citationBox = document.getElementById("citationBox");
  const generateBtn = document.getElementById("generateBtn");
  const copyBtn = document.getElementById("copyBtn");
  const statusEl = document.getElementById("status");
  const styleSelect = document.getElementById("styleSelect");
  const langSelect = document.getElementById("langSelect");
  const styleLabel = document.getElementById("styleLabel");
  const langLabel = document.getElementById("langLabel");

  let currentData = null;
  let currentCitation = "";
  let canCopy = false;
  let debugMode = true;

  const messages = {
    en: {
      btnGenerate: "Fetch citation",
      btnCopy: "Copy",
      labelStyle: "Style:",
      labelLang: "Language:",
      placeholder: "Citation will be shown here.",
      statusCopied: "Copied to clipboard.",
      statusCopyFailed: "Copy failed.",
      errExtensionNotActive: "Open an article page and refresh it, then try again.",
      errNoArticle: "No article detected on this page.",
      errUnsupportedSite: "This site is not supported yet.",
      errParseFailed: "Couldn't extract enough citation data from this page.",
      errSiteChanged: "This page looks like an article, but the site structure may have changed.",
      errUnknown: "Something went wrong. Try reloading the page."
    },
    ko: {
      btnGenerate: "인용 불러오기",
      btnCopy: "복사하기",
      labelStyle: "형식:",
      labelLang: "언어:",
      placeholder: "이곳에 참고문헌 형식으로 표시됩니다",
      statusCopied: "클립보드에 복사했습니다.",
      statusCopyFailed: "복사에 실패했습니다.",
      errExtensionNotActive: "논문 상세 페이지를 열고 새로고침한 뒤 다시 시도해 주세요.",
      errNoArticle: "이 페이지에서 논문을 찾지 못했습니다.",
      errUnsupportedSite: "아직 지원하지 않는 사이트입니다.",
      errParseFailed: "이 페이지에서 인용 정보를 충분히 추출하지 못했습니다.",
      errSiteChanged: "논문 페이지로 보이지만 사이트 구조가 바뀌었을 수 있습니다.",
      errUnknown: "오류가 발생했습니다. 페이지 새로고침 후 다시 시도해 주세요."
    },
    ja: {
      btnGenerate: "引用を取得",
      btnCopy: "コピー",
      labelStyle: "形式:",
      labelLang: "言語:",
      placeholder: "ここに表示されます",
      statusCopied: "クリップボードにコピーしました。",
      statusCopyFailed: "コピーに失敗しました。",
      errExtensionNotActive: "論文詳細ページを開いて再読み込み後、再度お試しください。",
      errNoArticle: "このページでは論文を検出できませんでした。",
      errUnsupportedSite: "このサイトはまだ対応していません。",
      errParseFailed: "引用情報を十分に抽出できませんでした。",
      errSiteChanged: "論文ページに見えますが、サイト構造が変更された可能性があります。",
      errUnknown: "エラーが発生しました。再読み込みしてお試しください。"
    }
  };

  function m() {
    return messages[langSelect.value] || messages.en;
  }

  // --- Supported sites registry (popup-side precheck) ---
  const SITE_SPECS = [
    {
      id: "pubmed",
      hosts: ["pubmed.ncbi.nlm.nih.gov"],
      isArticleUrl: (u) => /\/\d+\/?$/.test(u.pathname)
    },
    {
      id: "nature",
      hosts: ["www.nature.com", "nature.com"],
      // /articles/<id> or /en/articles/<id>
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
      if (!spec) return { ok: false, errorCode: "UNSUPPORTED_SITE" };
      const isArticle = !!(spec.isArticleUrl && spec.isArticleUrl(u));
      if (!isArticle) return { ok: false, errorCode: "NO_ARTICLE", siteId: spec.id };
      return { ok: true, siteId: spec.id };
    } catch {
      return { ok: false, errorCode: "UNKNOWN" };
    }
  }

  function setCitation(text, ok) {
    citationBox.textContent = text;
    canCopy = !!ok;
    currentCitation = ok ? text : "";
  }

  function setStatus(code, text) {
    const t = text || "";
    if (!code || !debugMode) {
      statusEl.textContent = t;
      return;
    }
    statusEl.textContent = t ? `${t}\n[${code}]` : `[${code}]`;
  }

  function errorTextByCode(code) {
    switch (code) {
      case "UNSUPPORTED_SITE": return m().errUnsupportedSite;
      case "NO_ARTICLE": return m().errNoArticle;
      case "SITE_CHANGED": return m().errSiteChanged;
      case "PARSE_FAILED":
      case "MISSING_FIELDS": return m().errParseFailed;
      case "EXTENSION_NOT_ACTIVE": return m().errExtensionNotActive;
      default: return m().errUnknown;
    }
  }

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
        try {
          legacyCopy();
          return;
        } catch {
          throw e;
        }
      });
    }

    return new Promise((resolve, reject) => {
      try {
        legacyCopy();
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

  function render() {
    if (!currentData) {
      setCitation(m().placeholder, false);
      return;
    }
    const style = styleSelect.value || "vancouver";
    const f = window.PCH?.formatters?.[style] || window.PCH?.formatters?.vancouver;
    const out = f ? f(currentData) : "";
    setCitation(out || m().errUnknown, !!out);
  }

  function applyLang() {
    generateBtn.textContent = m().btnGenerate;
    copyBtn.textContent = m().btnCopy;
    styleLabel.textContent = m().labelStyle;
    langLabel.textContent = m().labelLang;
    if (!currentData) citationBox.textContent = m().placeholder;
  }

  function showFailure(code) {
    const text = errorTextByCode(code);
    currentData = null;
    setCitation(text, false);
    setStatus(code, text);
  }

  function requestCitation() {
    setStatus("", "");

    api.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs && tabs[0];
      if (!tab) return;

      // 1) Popup-side precheck (URL only)
      const pre = classifyByUrl(tab.url || "");
      if (!pre.ok) {
        showFailure(pre.errorCode || "UNKNOWN");
        return;
      }

      // 2) Ask content script
      api.tabs.sendMessage(tab.id, { type: "GET_CITATION_DATA" }, (resp) => {
        const err = api.runtime && api.runtime.lastError;
        if (err) {
          console.warn("[PCH popup] sendMessage error:", err);
          showFailure("EXTENSION_NOT_ACTIVE");
          return;
        }

        if (resp && resp.ok && resp.data) {
          currentData = resp.data;

          if (debugMode) {
            try {
              api.storage.local.set({
                lastCitationData: JSON.parse(JSON.stringify(currentData)),
                lastCitationUrl: tab.url || "",
                lastCitationAt: Date.now()
              });
            } catch (e) {
              console.warn("[PCH debug] failed to store lastCitationData", e);
            }
          }
          render();
          return;
        }

        if (debugMode) {
          window.PCH = window.PCH || {};
          window.PCH.lastPopupResponse = resp ? JSON.parse(JSON.stringify(resp)) : null;
          console.log("[PCH debug] lastPopupResponse ready");
        }

        const code = resp && resp.errorCode ? String(resp.errorCode) : "NO_ARTICLE";
        showFailure(code);
      });
    });
  }

  generateBtn.addEventListener("click", requestCitation);

  copyBtn.addEventListener("click", () => {
    if (!canCopy || !currentCitation) return;
    copyToClipboard(currentCitation)
      .then(() => setStatus("", m().statusCopied))
      .catch(() => setStatus("", m().statusCopyFailed));
  });

  styleSelect.addEventListener("change", () => {
    if (currentData) render();
  });

  langSelect.addEventListener("change", () => {
    api.storage.local.set({ uiLanguage: langSelect.value });
    applyLang();
    if (currentData) render();
    else setStatus("", "");
  });

  document.addEventListener("DOMContentLoaded", () => {
    api.storage.local.get(["uiLanguage", "debugMode"], (d) => {
      debugMode = !!d.debugMode;
      const saved = d.uiLanguage || "en";
      langSelect.value = saved;
      applyLang();
      requestCitation();
    });
  });
})();