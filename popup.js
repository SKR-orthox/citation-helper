// popup.js (PubMed MVP)

const api = typeof browser !== "undefined" ? browser : chrome;
console.log("[PCH] popup loaded");

const citationBox = document.getElementById("citationBox");
const generateBtn = document.getElementById("generateBtn");
const copyBtn = document.getElementById("copyBtn");
const statusEl = document.getElementById("status");

const styleSelect = document.getElementById("styleSelect");
const styleLabel = document.getElementById("styleLabel");

const langLabel = document.getElementById("langLabel");
const langSelect = document.getElementById("langSelect");

let canCopy = false;
let currentCitation = "";
let currentData = null;

let currentStyleKey = "vancouver";
let currentLang = "en";

// ------------------------------------------
// 다국어 메시지
// ------------------------------------------
const messages = {
  ko: {
    btnGenerate: "인용 불러오기",
    labelStyle: "형식:",
    labelLang: "언어:",
    btnCopy: "복사하기",
    placeholder: "이곳에 참고문헌 형식으로 표시됩니다",
    notDetectedTitle: "논문 감지 불가",

    // style option labels
    styleVancouver: "Vancouver",
    styleApa7: "APA 7th",
    styleIeee: "IEEE",
    styleBibtex: "BibTeX",

    errNoActiveTab: "활성 탭을 찾을 수 없습니다.",
    errExtensionNotActive:
      "이 탭에서는 확장 프로그램이 동작하지 않습니다.\nPubMed 논문 상세 페이지인지 확인해 주세요.",
    errUnsupported:
      "현재는 PubMed만 지원합니다.\nPubMed 논문 상세 페이지에서 사용해 주세요.",
    errNoArticle:
      "이 페이지에서 논문 정보를 찾을 수 없습니다.\nPubMed 논문 상세 페이지인지 확인해 주세요.",
    errUnknown:
      "인용 정보를 가져오는 중 알 수 없는 오류가 발생했습니다.\n페이지를 새로고침한 뒤 다시 시도해 보세요.",

    statusCopied: "클립보드로 복사됨",
    statusCopyFailed: "복사에 실패했습니다"
  },

  en: {
    btnGenerate: "Fetch citation",
    labelStyle: "Style:",
    labelLang: "Language:",
    btnCopy: "Copy",
    placeholder: "Citation will be shown here.",
    notDetectedTitle: "No article detected",

    styleVancouver: "Vancouver",
    styleApa7: "APA 7th",
    styleIeee: "IEEE",
    styleBibtex: "BibTeX",

    errNoActiveTab: "Could not find the active tab.",
    errExtensionNotActive:
      "This extension does not run on this tab.\nPlease open a PubMed article detail page.",
    errUnsupported:
      "Currently, only PubMed is supported.\nPlease use this on a PubMed article detail page.",
    errNoArticle:
      "Could not find article information on this page.\nPlease open a PubMed article detail page.",
    errUnknown:
      "An unknown error occurred while fetching citation information.\nPlease reload the page and try again.",

    statusCopied: "Copied to clipboard",
    statusCopyFailed: "Failed to copy"
  },

  ja: {
    btnGenerate: "引用を取得",
    labelStyle: "形式:",
    labelLang: "言語:",
    btnCopy: "コピー",
    placeholder: "ここに参考文献形式で表示されます",
    notDetectedTitle: "論文を検出できません",

    styleVancouver: "Vancouver",
    styleApa7: "APA第7版",
    styleIeee: "IEEE",
    styleBibtex: "BibTeX",

    errNoActiveTab: "アクティブなタブを見つけられませんでした。",
    errExtensionNotActive:
      "このタブでは拡張機能が動作していません。\nPubMedの論文詳細ページを開いてください。",
    errUnsupported:
      "現在はPubMedのみ対応しています。\nPubMedの論文詳細ページで利用してください。",
    errNoArticle:
      "このページから論文情報を取得できませんでした。\nPubMedの論文詳細ページか確認してください。",
    errUnknown:
      "引用情報の取得中に不明なエラーが発生しました。\nページを再読み込みしてから再度お試しください。",

    statusCopied: "クリップボードにコピーしました",
    statusCopyFailed: "コピーに失敗しました"
  }
};

// ------------------------------------------
// 공통 유틸
// ------------------------------------------
function safeText(v) {
  if (!v) return "";
  return String(v).replace(/\s+/g, " ").trim();
}

function tidyString(str) {
  if (!str) return str;
  return String(str)
    .replace(/\s+/g, " ")
    .replace(/\s*:\s*/g, ": ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s*\.\s*/g, ". ")
    .trim()
    .replace(/\.\s*\./g, ".");
}

function joinAuthors(authors) {
  if (!Array.isArray(authors)) return "";
  const cleaned = authors.map(a => safeText(a)).filter(Boolean);
  return cleaned.join(", ");
}

function firstAuthorEtAl(authors) {
  if (!Array.isArray(authors) || authors.length === 0) return "";
  const first = safeText(authors[0]);
  if (!first) return "";
  return authors.length > 1 ? `${first} et al.` : first;
}

function makePages(data) {
  // PubMed extractor might provide: firstPage/lastPage OR pages/eLocator
  const firstPage = safeText(data.firstPage || "");
  const lastPage = safeText(data.lastPage || "");
  const pages = safeText(data.pages || "");
  const eloc = safeText(data.elocationId || data.eLocator || "");

  if (pages) return pages;
  if (firstPage && lastPage) return `${firstPage}-${lastPage}`;
  if (firstPage) return firstPage;
  if (eloc) return eloc;
  return "";
}

function getJournal(data) {
  return safeText(data.journalAbbrev || data.journalFull || data.journal || "");
}

function getYear(data) {
  // prefer explicit year, else try parse from date
  const y = safeText(data.year || "");
  if (y) return y;
  const date = safeText(data.publishedDate || data.date || "");
  const m = date.match(/^(\d{4})/);
  return m ? m[1] : "";
}

function getDoi(data) {
  const doi = safeText(data.doi || "");
  return doi.replace(/^doi:\s*/i, "");
}

function getUrl(data) {
  return safeText(data.url || "");
}

// ------------------------------------------
// 포맷터들
// ------------------------------------------
function formatVancouver(data) {
  const authorsPart = joinAuthors(data.authors);
  const title = safeText(data.title);
  const journal = getJournal(data);
  const year = getYear(data);
  const volume = safeText(data.volume || "");
  const issue = safeText(data.issue || "");
  const pages = makePages(data);
  const pmid = safeText(data.pmid || "");

  let out = `${authorsPart}. ${title}. ${journal}. ${year}`;
  if (volume) {
    out += `;${volume}`;
    if (issue) out += `(${issue})`;
  }
  if (pages) out += `:${pages}`;
  out += ".";
  if (pmid) out += ` PMID: ${pmid}.`;

  return tidyString(out);
}

function formatAPA7(data) {
  // Minimal APA 7th for journal article
  // Authors. (Year). Title. Journal, volume(issue), pages. https://doi.org/...
  const authorPart = joinAuthors(data.authors); // (이미 "성 이니셜" 형태라면 그대로 사용)
  const year = getYear(data);
  const title = safeText(data.title);
  const journal = getJournal(data);

  const volume = safeText(data.volume || "");
  const issue = safeText(data.issue || "");
  const pages = makePages(data);

  const doi = getDoi(data);
  const url = getUrl(data);

  let out = `${authorPart}. (${year}). ${title}. ${journal}`;
  if (volume) {
    out += `, ${volume}`;
    if (issue) out += `(${issue})`;
  }
  if (pages) out += `, ${pages}`;
  out += ".";

  if (doi) out += ` https://doi.org/${doi}`;
  else if (url) out += ` ${url}`;

  return tidyString(out);
}

function formatIEEE(data) {
  // Minimal IEEE for journal article
  // A. Author, "Title," Journal, vol. X, no. Y, pp. Z, Year, doi:...
  const authorsPart = joinAuthors(data.authors);
  const title = safeText(data.title);
  const journal = getJournal(data);

  const volume = safeText(data.volume || "");
  const issue = safeText(data.issue || "");
  const pages = makePages(data);
  const year = getYear(data);

  const doi = getDoi(data);
  const url = getUrl(data);

  let out = `${authorsPart}, "${title}," ${journal}`;
  if (volume) out += `, vol. ${volume}`;
  if (issue) out += `, no. ${issue}`;
  if (pages) out += `, pp. ${pages}`;
  if (year) out += `, ${year}`;
  if (doi) out += `, doi:${doi}`;
  else if (url) out += `, ${url}`;
  out += ".";

  return tidyString(out);
}

function formatBibTeX(data) {
  // Minimal BibTeX @article
  const authors = Array.isArray(data.authors) ? data.authors.map(safeText).filter(Boolean) : [];
  const title = safeText(data.title);
  const journal = getJournal(data);
  const year = getYear(data);

  const volume = safeText(data.volume || "");
  const number = safeText(data.issue || "");
  const pages = makePages(data);

  const doi = getDoi(data);
  const url = getUrl(data);
  const pmid = safeText(data.pmid || "");

  // key: firstAuthorYearJournal (simple)
  const keyBase =
    (authors[0] ? authors[0].split(/\s+/).slice(-1)[0] : "article") +
    (year ? year : "") +
    (journal ? journal.replace(/\W+/g, "").slice(0, 16) : "");
  const key = keyBase || "article";

  const lines = [];
  lines.push(`@article{${key},`);
  if (authors.length) lines.push(`  author = {${authors.join(" and ")}},`);
  if (title) lines.push(`  title = {${title}},`);
  if (journal) lines.push(`  journal = {${journal}},`);
  if (year) lines.push(`  year = {${year}},`);
  if (volume) lines.push(`  volume = {${volume}},`);
  if (number) lines.push(`  number = {${number}},`);
  if (pages) lines.push(`  pages = {${pages}},`);
  if (doi) lines.push(`  doi = {${doi}},`);
  if (url) lines.push(`  url = {${url}},`);
  if (pmid) lines.push(`  note = {PMID: ${pmid}},`);

  // remove trailing comma on last field
  if (lines.length > 1) {
    const last = lines[lines.length - 1];
    lines[lines.length - 1] = last.replace(/,\s*$/, "");
  }
  lines.push("}");

  return lines.join("\n");
}

function formatByStyle(style, data) {
  if (!data) return "";

  const P = window.PCH;
  const f =
    (P && P.formatters && P.formatters[style]) ||
    (P && P.formatters && P.formatters.vancouver);

  return f ? f(data) : "";
}

// ------------------------------------------
// UI / 언어 관련
// ------------------------------------------
function setCitation(text, copiable, statusMessage) {
  citationBox.textContent = text;
  canCopy = copiable;
  currentCitation = copiable ? text : "";
  statusEl.textContent = statusMessage || "";
}

function applyLanguage() {
  const m = messages[currentLang] || messages.en;

  generateBtn.textContent = m.btnGenerate;
  styleLabel.textContent = m.labelStyle;
  langLabel.textContent = m.labelLang;
  copyBtn.textContent = m.btnCopy;

  // styleSelect 옵션 텍스트 갱신
  if (styleSelect) {
    for (const opt of styleSelect.options) {
      if (opt.value === "vancouver") opt.textContent = m.styleVancouver || "Vancouver";
      if (opt.value === "apa7") opt.textContent = m.styleApa7 || "APA 7th";
      if (opt.value === "ieee") opt.textContent = m.styleIeee || "IEEE";
      if (opt.value === "bibtex") opt.textContent = m.styleBibtex || "BibTeX";
    }
  }

  // 초기 상태면 placeholder 갱신
  if (!currentData && !currentCitation && !canCopy) {
    citationBox.textContent = m.placeholder;
    statusEl.textContent = "";
  }
}

function renderCitation() {
  const m = messages[currentLang] || messages.en;

  if (!currentData) {
    setCitation(m.notDetectedTitle, false, m.errNoArticle);
    return;
  }

  const formatted = formatByStyle(currentStyleKey, currentData);
  setCitation(formatted, true, "");
}

// ------------------------------------------
// content-script 에 인용 데이터 요청 (폴백 없음)
// ------------------------------------------
function requestCitation() {
  const m = messages[currentLang] || messages.en;

  function sendCitationRequest(tabId, cb) {
    api.tabs.sendMessage(tabId, { type: "GET_CITATION_DATA" }, (response) => {
      const lastErr = api.runtime && api.runtime.lastError;
      cb(response, lastErr);
    });
  }

  api.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab) {
      currentData = null;
      setCitation(m.notDetectedTitle, false, m.errNoActiveTab);
      return;
    }

    sendCitationRequest(tab.id, (response, lastErr) => {
      if (lastErr) {
        console.warn("[PCH popup] sendMessage error:", lastErr);
        currentData = null;
        setCitation(m.notDetectedTitle, false, m.errExtensionNotActive);
        return;
      }

      if (response && response.ok && response.data) {
        currentData = response.data;
        renderCitation();
        return;
      }

      currentData = null;

      const errorCode = response && response.errorCode;
      let msg = "";

      switch (errorCode) {
        case "UNSUPPORTED_SITE":
          msg = m.errUnsupported;
          break;
        case "NO_ARTICLE":
          msg = m.errNoArticle;
          break;
        default:
          msg = m.errUnknown;
          break;
      }

      setCitation(m.notDetectedTitle, false, msg);
    });
  });
}

// ------------------------------------------
// 이벤트 등록
// ------------------------------------------
generateBtn.addEventListener("click", () => {
  requestCitation();
});

copyBtn.addEventListener("click", () => {
  if (!canCopy || !currentCitation) return;
  navigator.clipboard.writeText(currentCitation)
    .then(() => {
      statusEl.textContent = (messages[currentLang] || messages.en).statusCopied;
    })
    .catch(err => {
      console.error("[PCH popup] clipboard error:", err);
      statusEl.textContent = (messages[currentLang] || messages.en).statusCopyFailed;
    });
});

styleSelect.addEventListener("change", () => {
  currentStyleKey = styleSelect.value || "vancouver";
  if (currentData) renderCitation();
});

langSelect.addEventListener("change", () => {
  currentLang = langSelect.value || "en";
  api.storage.local.set({ uiLanguage: currentLang });
  applyLanguage();
  if (currentData) renderCitation();
});

document.addEventListener("DOMContentLoaded", () => {
  currentStyleKey = (styleSelect && styleSelect.value) || "vancouver";

  api.storage.local.get("uiLanguage", (data) => {
    const savedLang = data.uiLanguage || (langSelect && langSelect.value) || "en";
    currentLang = savedLang;
    if (langSelect) langSelect.value = savedLang;

    applyLanguage();
    requestCitation();
  });
});