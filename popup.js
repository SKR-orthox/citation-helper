// popup.js

const api = typeof browser !== "undefined" ? browser : chrome;

const citationBox = document.getElementById("citationBox");
const generateBtn = document.getElementById("generateBtn");
const copyBtn = document.getElementById("copyBtn");
const statusEl = document.getElementById("status");

const styleVancouver = document.getElementById("styleVancouver");
const styleReport = document.getElementById("styleReport");

let canCopy = false;
let currentCitation = "";
let currentData = null;

let currentStyleKey = "vancouver";

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
  if (!currentData) {
    setCitation("논문 감지 불가", false, "이 페이지에서 논문 정보를 찾을 수 없습니다.");
    return;
  }
  const formatted = formatByStyle(currentStyleKey, currentData);
  setCitation(formatted, true, "");
}

function requestCitation() {
  api.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab) {
      setCitation("논문 감지 불가", false, "활성 탭을 찾을 수 없습니다.");
      return;
    }

    api.tabs.sendMessage(tab.id, { type: "GET_CITATION_DATA" }, (response) => {
      // content-script 미로딩 / 에러 대비
      if (api.runtime && api.runtime.lastError) {
        console.error("[PCH popup] sendMessage error:", api.runtime.lastError);
        currentData = null;
        setCitation(
          "논문 감지 불가",
          false,
          "이 탭에서는 확장 프로그램이 동작하지 않습니다.\n논문 상세 페이지인지 확인해 주세요."
        );
        return;
      }

      console.log("[PCH popup] response:", response);

      // ✅ 성공 케이스
      if (response && response.ok && response.data) {
        currentData = response.data;
        renderCitation();
        return;
      }

      // ❌ 실패 케이스: errorCode에 따라 다른 안내
      currentData = null;

      const errorCode = response && response.errorCode;
      let msg = "";

      switch (errorCode) {
        case "UNSUPPORTED_SITE":
          msg =
            "지원하지 않는 사이트입니다.\n" +
            "PubMed, SpringerLink, New Phytologist, Cell, The Lancet 등\n" +
            "일반적인 저널 사이트에서 사용 가능합니다.";
          break;
        case "NO_ARTICLE":
          msg =
            "이 페이지에서 논문 정보를 찾을 수 없습니다.\n" +
            "논문 상세 페이지인지, 혹은 인용 정보가 보이는 화면인지 확인해 주세요.";
          break;
        case "DYNAMIC_SITE":
          msg =
            "이 사이트는 로그인 또는 동적 로딩에 크게 의존해서\n" +
            "자동 인용 추출이 어렵습니다.\n" +
            "해당 사이트 자체의 'Cite' / '인용' 버튼을 이용해 주세요.";
          break;
        case "UNKNOWN_ERROR":
        default:
          msg =
            "인용 정보를 가져오는 중 알 수 없는 오류가 발생했습니다.\n" +
            "페이지를 새로고침한 뒤 다시 시도해 보세요.";
          break;
      }

      setCitation("논문 감지 불가", false, msg);
    });
  });
}

generateBtn.addEventListener("click", () => {
  requestCitation();
});

copyBtn.addEventListener("click", () => {
  if (!canCopy || !currentCitation) return;
  navigator.clipboard.writeText(currentCitation)
    .then(() => {
      statusEl.textContent = "클립보드로 복사됨";
    })
    .catch(err => {
      console.error("[PCH popup] clipboard error:", err);
      statusEl.textContent = "복사에 실패했습니다";
    });
});

styleVancouver.addEventListener("change", () => {
  if (styleVancouver.checked) {
    currentStyleKey = "vancouver";
    renderCitation();
  }
});

styleReport.addEventListener("change", () => {
  if (styleReport.checked) {
    currentStyleKey = "report";
    renderCitation();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  currentStyleKey = styleVancouver.checked ? "vancouver" : "report";
  requestCitation();
});