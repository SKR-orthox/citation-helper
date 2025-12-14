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

  const messages = {
    en: {
      btnGenerate: "Fetch citation",
      btnCopy: "Copy",
      labelStyle: "Style:",
      labelLang: "Language:",
      placeholder: "Citation will be shown here.",
      errExtensionNotActive: "Open a PubMed article page and refresh it, then try again.",
      errNoArticle: "No article detected on this page.",
      errUnknown: "Something went wrong. Try reloading the page."
    },
    ko: {
      btnGenerate: "인용 불러오기",
      btnCopy: "복사하기",
      labelStyle: "형식:",
      labelLang: "언어:",
      placeholder: "이곳에 참고문헌 형식으로 표시됩니다",
      errExtensionNotActive: "PubMed 논문 상세 페이지를 열고 새로고침한 뒤 다시 시도해 주세요.",
      errNoArticle: "이 페이지에서 논문을 찾지 못했습니다.",
      errUnknown: "오류가 발생했습니다. 페이지 새로고침 후 다시 시도해 주세요."
    },
    ja: {
      btnGenerate: "引用を取得",
      btnCopy: "コピー",
      labelStyle: "形式:",
      labelLang: "言語:",
      placeholder: "ここに表示されます",
      errExtensionNotActive: "PubMedの論文詳細ページを開いて再読み込み後、再度お試しください。",
      errNoArticle: "このページでは論文を検出できませんでした。",
      errUnknown: "エラーが発生しました。再読み込みしてお試しください。"
    }
  };

  function m() {
    return messages[langSelect.value] || messages.en;
  }

  function setCitation(text, ok) {
    citationBox.textContent = text;
    canCopy = !!ok;
    currentCitation = ok ? text : "";
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

  function requestCitation() {
    statusEl.textContent = "";
    api.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs && tabs[0];
      if (!tab) return;

      api.tabs.sendMessage(tab.id, { type: "GET_CITATION_DATA" }, (resp) => {
        const err = api.runtime && api.runtime.lastError;
        if (err) {
          console.warn("[PCH popup] sendMessage error:", err);
          currentData = null;
          setCitation(m().errExtensionNotActive, false);
          return;
        }

        if (resp && resp.ok && resp.data) {
          currentData = resp.data;
          render();
          return;
        }

        currentData = null;
        setCitation(m().errNoArticle, false);
      });
    });
  }

  generateBtn.addEventListener("click", requestCitation);
  copyBtn.addEventListener("click", () => {
    if (!canCopy || !currentCitation) return;
    navigator.clipboard.writeText(currentCitation)
      .then(() => statusEl.textContent = "OK")
      .catch(() => statusEl.textContent = "Copy failed");
  });

  styleSelect.addEventListener("change", () => { if (currentData) render(); });
  langSelect.addEventListener("change", () => {
    api.storage.local.set({ uiLanguage: langSelect.value });
    applyLang();
    if (currentData) render();
  });

  document.addEventListener("DOMContentLoaded", () => {
    api.storage.local.get("uiLanguage", (d) => {
      const saved = d.uiLanguage || "en";
      langSelect.value = saved;
      applyLang();
      requestCitation();
    });
  });
})();