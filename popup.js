// popup.js

const api = typeof browser !== "undefined" ? browser : chrome;

const citationBox   = document.getElementById("citationBox");
const generateBtn   = document.getElementById("generateBtn");
const copyBtn       = document.getElementById("copyBtn");
const statusEl      = document.getElementById("status");

const styleVancouver = document.getElementById("styleVancouver");
const styleReport    = document.getElementById("styleReport");

const styleLabel      = document.getElementById("styleLabel");
const labelVancouver  = document.getElementById("labelVancouver");
const labelReport     = document.getElementById("labelReport");
const langLabel       = document.getElementById("langLabel");
const langSelect      = document.getElementById("langSelect");

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
    labelStyle:  "형식:",
    labelVancouver: "Vancouver",
    labelReport: "보고서 형식",
    labelLang: "Language:",
    btnCopy: "복사하기",
    placeholder: "이곳에 참고문헌 형식으로 표시됩니다",

    notDetectedTitle: "논문 감지 불가",

    errNoActiveTab: "활성 탭을 찾을 수 없습니다.",
    errExtensionNotActive:
      "이 탭에서는 확장 프로그램이 동작하지 않습니다.\n논문 상세 페이지인지 확인해 주세요.",
    errUnsupported:
      "지원하지 않는 사이트입니다.\n" +
      "PubMed, SpringerLink, New Phytologist, Cell, The Lancet 등\n" +
      "일반적인 저널 사이트에서 사용 가능합니다.",
    errNoArticle:
      "이 페이지에서 논문 정보를 찾을 수 없습니다.\n" +
      "논문 상세 페이지인지, 혹은 인용 정보가 보이는 화면인지 확인해 주세요.",
    errDynamic:
      "이 사이트는 로그인 또는 동적 로딩에 크게 의존해서\n" +
      "자동 인용 추출이 어렵습니다.\n" +
      "해당 사이트 자체의 'Cite' / '인용' 버튼을 이용해 주세요.",
    errUnknown:
      "인용 정보를 가져오는 중 알 수 없는 오류가 발생했습니다.\n" +
      "페이지를 새로고침한 뒤 다시 시도해 보세요.",

    statusCopied: "클립보드로 복사됨",
    statusCopyFailed: "복사에 실패했습니다"
  },

  en: {
    btnGenerate: "Fetch citation",
    labelStyle:  "Style:",
    labelVancouver: "Vancouver",
    labelReport: "Report style",
    labelLang: "Language:",
    btnCopy: "Copy",
    placeholder: "Citation will be shown here.",

    notDetectedTitle: "No article detected",

    errNoActiveTab: "Could not find the active tab.",
    errExtensionNotActive:
      "This extension does not run on this tab.\n" +
      "Please make sure this is a paper detail page.",
    errUnsupported:
      "This site is not supported.\n" +
      "You can use this extension on common journal sites such as\n" +
      "PubMed, SpringerLink, New Phytologist, Cell, and The Lancet.",
    errNoArticle:
      "Could not find article information on this page.\n" +
      "Please check that this is a full article page\n" +
      "or a page where citation information is visible.",
    errDynamic:
      "This site heavily relies on login or dynamic loading,\n" +
      "so automatic citation extraction is difficult.\n" +
      "Please use the site's own \"Cite\" / \"Export citation\" feature.",
    errUnknown:
      "An unknown error occurred while fetching citation information.\n" +
      "Please reload the page and try again.",

    statusCopied: "Copied to clipboard",
    statusCopyFailed: "Failed to copy"
  },

  ja: {
    btnGenerate: "引用を取得",
    labelStyle:  "形式:",
    labelVancouver: "Vancouver",
    labelReport: "レポート形式",
    labelLang: "Language:",
    btnCopy: "コピー",
    placeholder: "ここに参考文献形式で表示されます",

    notDetectedTitle: "論文を検出できません",

    errNoActiveTab: "アクティブなタブを見つけられませんでした。",
    errExtensionNotActive:
      "このタブでは拡張機能が動作していません。\n" +
      "論文の詳細ページかどうか確認してください。",
    errUnsupported:
      "対応していないサイトです。\n" +
      "PubMed, SpringerLink, New Phytologist, Cell, The Lancet など\n" +
      "一般的なジャーナルサイトで利用できます。",
    errNoArticle:
      "このページから論文情報を取得できませんでした。\n" +
      "論文の本文ページか、引用情報が表示されている画面か確認してください。",
    errDynamic:
      "このサイトはログインや動的読み込みへの依存度が高く、\n" +
      "自動での引用情報取得が困難です。\n" +
      "サイト内の「Cite」「引用」ボタンを利用してください。",
    errUnknown:
      "引用情報を取得中に原因不明のエラーが発生しました。\n" +
      "ページを再読み込みしてから再度お試しください。",

    statusCopied: "クリップボードにコピーしました",
    statusCopyFailed: "コピーに失敗しました"
  }
};

// ------------------------------------------
// 공통 유틸
// ------------------------------------------

function tidyString(str) {
  if (!str) return str;
  return str
    .replace(/\s+/g, " ")
    .replace(/\s*:\s*/g, ": ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s*\.\s*/g, ". ")
    .replace(/\s+PMID/, " PMID")
    .trim()
    .replace(/\.\s*\./g, ".");
}

function makePages(data) {
  const { firstPage, lastPage } = data;
  if (firstPage && lastPage) return `${firstPage}-${lastPage}`;
  if (firstPage) return firstPage;
  return "";
}

// ------------------------------------------
// 인용 포맷팅
// ------------------------------------------

function formatVancouver(data) {
  const authorsPart = data.authors.join(", ");
  const journal = data.journalAbbrev || data.journalFull || "";
  const pages = makePages(data);

  let out = `${authorsPart}. ${data.title}. ${journal}. ${data.year}`;
  if (data.volume) {
    out += `;${data.volume}`;
    if (data.issue) out += `(${data.issue})`;
  }
  if (pages) out += `:${pages}`;
  out += ".";
  if (data.pmid) out += ` PMID: ${data.pmid}.`;

  return tidyString(out);
}

function formatReport(data) {
  const firstAuthorRaw = data.authors[0] || "";
  const hasMoreAuthors = data.authors.length > 1;

  const firstAuthor = firstAuthorRaw.replace(/\s+$/, "");
  const authorPart = hasMoreAuthors ? `${firstAuthor} et al.` : firstAuthor;

  const journal = data.journalAbbrev || data.journalFull || "";
  const pages = makePages(data);

  let out = `${authorPart}. ${data.title}. ${journal}`;

  if (data.volume) {
    out += ` ${data.volume}`;
    if (data.issue) {
      out += `(${data.issue})`;
    }
  }
  if (pages) {
    if (data.volume) {
      out += `:${pages}`;
    } else {
      out += ` ${pages}`;
    }
  }

  if (data.year) {
    out += `. ${data.year}.`;
  } else {
    out += ".";
  }

  return tidyString(out);
}

function formatByStyle(style, data) {
  if (!data) return "";
  switch (style) {
    case "vancouver":
      return formatVancouver(data);
    case "report":
      return formatReport(data);
    default:
      return formatVancouver(data);
  }
}

// ------------------------------------------
// UI / 언어 관련
// ------------------------------------------

function applyLanguage() {
  const m = messages[currentLang];

  generateBtn.textContent = m.btnGenerate;
  styleLabel.textContent = m.labelStyle;
  labelVancouver.textContent = m.labelVancouver;
  labelReport.textContent = m.labelReport;
  langLabel.textContent = m.labelLang;
  copyBtn.textContent = m.btnCopy;

  // 아직 인용이 없고 에러도 아닌 초기 상태라면 플레이스홀더 갱신
  if (!currentData && !currentCitation && !canCopy) {
    citationBox.textContent = m.placeholder;
    statusEl.textContent = "";
  }
}

/**
 * 텍스트/복사 가능 여부/상태 메시지를 동시에 설정
 */
function setCitation(text, copiable, statusMessage) {
  citationBox.textContent = text;
  canCopy = copiable;
  currentCitation = copiable ? text : "";
  statusEl.textContent = statusMessage || "";
}

function renderCitation() {
  const m = messages[currentLang];

  if (!currentData) {
    setCitation(m.notDetectedTitle, false, m.errNoArticle);
    return;
  }
  const formatted = formatByStyle(currentStyleKey, currentData);
  setCitation(formatted, true, "");
}

// ------------------------------------------
// content-script 에 인용 데이터 요청
// ------------------------------------------

function requestCitation() {
  const m = messages[currentLang];

  api.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab) {
      setCitation(m.notDetectedTitle, false, m.errNoActiveTab);
      return;
    }

    api.tabs.sendMessage(tab.id, { type: "GET_CITATION_DATA" }, (response) => {
      // content-script 미로딩 / 에러 대비
      if (api.runtime && api.runtime.lastError) {
        console.error("[PCH popup] sendMessage error:", api.runtime.lastError);
        currentData = null;
        setCitation(
          m.notDetectedTitle,
          false,
          m.errExtensionNotActive
        );
        return;
      }

      console.log("[PCH popup] response:", response);

      // 성공 케이스
      if (response && response.ok && response.data) {
        currentData = response.data;
        renderCitation();
        return;
      }

      // 실패 케이스
      currentData = null;

      const errorCode = response && response.errorCode;
      let msg = "";

      switch (errorCode) {
        case "UNSUPPORTED_SITE":
          msg = messages[currentLang].errUnsupported;
          break;
        case "NO_ARTICLE":
          msg = messages[currentLang].errNoArticle;
          break;
        case "DYNAMIC_SITE":
          msg = messages[currentLang].errDynamic;
          break;
        case "UNKNOWN_ERROR":
        default:
          msg = messages[currentLang].errUnknown;
          break;
      }

      setCitation(messages[currentLang].notDetectedTitle, false, msg);
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
      statusEl.textContent = messages[currentLang].statusCopied;
    })
    .catch(err => {
      console.error("[PCH popup] clipboard error:", err);
      statusEl.textContent = messages[currentLang].statusCopyFailed;
    });
});

styleVancouver.addEventListener("change", () => {
  if (styleVancouver.checked) {
    currentStyleKey = "vancouver";
    if (currentData) renderCitation();
  }
});

styleReport.addEventListener("change", () => {
  if (styleReport.checked) {
    currentStyleKey = "report";
    if (currentData) renderCitation();
  }
});

langSelect.addEventListener("change", () => {
  currentLang = langSelect.value || "en";
  applyLanguage();
  // 인용이 이미 있다면, 형식은 같지만 언어에 맞춰 메시지만 자연스럽게 유지
  if (currentData && canCopy && currentCitation) {
    renderCitation();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  currentStyleKey = styleVancouver.checked ? "vancouver" : "report";
  currentLang = langSelect.value || "en";
  applyLanguage();
  requestCitation();
});