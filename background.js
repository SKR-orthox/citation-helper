// background.js
const api = typeof browser !== "undefined" ? browser : chrome;

function normalizeDOI(raw) {
  if (!raw) return "";
  let doi = String(raw).trim();
  doi = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  doi = doi.replace(/^doi\s*:\s*/i, "");
  return doi.trim();
}

function crossrefToCitationData(msg) {
  // Crossref: message object
  const title = Array.isArray(msg.title) ? (msg.title[0] || "") : (msg.title || "");
  const journal = Array.isArray(msg["container-title"]) ? (msg["container-title"][0] || "") : (msg["container-title"] || "");
  const authors = Array.isArray(msg.author)
    ? msg.author
        .map(a => {
          const given = a.given ? String(a.given).trim() : "";
          const family = a.family ? String(a.family).trim() : "";
          return [given, family].filter(Boolean).join(" ");
        })
        .filter(Boolean)
    : [];

  let year = "";
  const issued = msg.issued && msg.issued["date-parts"] && msg.issued["date-parts"][0];
  if (issued && issued[0]) year = String(issued[0]);

  const volume = msg.volume ? String(msg.volume) : "";
  const issue = msg.issue ? String(msg.issue) : "";
  const pages = msg.page ? String(msg.page) : "";

  return {
    title,
    authors,
    journalFull: journal,
    journalAbbrev: "",
    year,
    volume,
    issue,
    pages,
    doi: msg.DOI ? String(msg.DOI) : ""
  };
}

api.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req?.type !== "FETCH_CROSSREF") return;

  const doi = normalizeDOI(req.doi);
  if (!doi) {
    sendResponse({ ok: false, error: "NO_DOI" });
    return true;
  }

  const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;

  fetch(url, {
    method: "GET",
    headers: { "Accept": "application/json" }
  })
    .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
    .then(json => {
      const msg = json && json.message;
      if (!msg) throw new Error("NO_MESSAGE");
      sendResponse({ ok: true, data: crossrefToCitationData(msg) });
    })
    .catch(err => {
      console.warn("[PCH] Crossref fetch failed:", err);
      sendResponse({ ok: false, error: String(err?.message || err) });
    });

  return true; // async
});