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


function setCitation(text, copiable) {
  citationBox.textContent = text;
  canCopy = copiable;
  currentCitation = copiable ? text : "";
  if (!copiable) {
    statusEl.textContent = "논문 감지 불가";
  } else {
    statusEl.textContent = "";
  }
}

function renderCitation() {
  if (!currentData) {
    setCitation("논문 감지 불가", false);
    return;
  }
  const formatted = formatByStyle(currentStyleKey, currentData);
  setCitation(formatted, true);
}

function requestCitation() {
  api.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab) {
      setCitation("논문 감지 불가", false);
      return;
    }

    api.tabs.sendMessage(tab.id, { type: "GET_CITATION_DATA" }, (response) => {
      // 크롬에서 content-script가 없거나 에러일 때를 대비
      if (api.runtime && api.runtime.lastError) {
        console.error("[PCH popup] sendMessage error:", api.runtime.lastError);
        currentData = null;
        setCitation("논문 감지 불가", false);
        return;
      }

      console.log("[PCH popup] response:", response);

      if (response && response.ok && response.data) {
        currentData = response.data;
        renderCitation();
      } else {
        currentData = null;
        setCitation("논문 감지 불가", false);
      }
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
