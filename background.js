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
  function pickFirstStr(v) {
    if (!v) return "";
    if (Array.isArray(v)) return String(v[0] || "").trim();
    return String(v).trim();
  }

  function getCrossrefYear(m) {
    const candidates = [
      m.issued,
      m["published-print"],
      m["published-online"],
      m.created,
      m.deposited
    ];

    for (const c of candidates) {
      const dp = c && c["date-parts"] && c["date-parts"][0];
      if (dp && dp[0]) return String(dp[0]);
    }
    return "";
  }

  const title = pickFirstStr(msg.title);
  const journalFull = pickFirstStr(msg["container-title"]);

  const authors = Array.isArray(msg.author)
    ? msg.author
        .map(a => {
          const given = a && a.given ? String(a.given).trim() : "";
          const family = a && a.family ? String(a.family).trim() : "";
          return [given, family].filter(Boolean).join(" ");
        })
        .filter(Boolean)
    : [];

  const year = getCrossrefYear(msg);

  const volume = msg && msg.volume ? String(msg.volume).trim() : "";
  const issue  = msg && msg.issue  ? String(msg.issue).trim()  : "";
  const pages  = msg && msg.page   ? String(msg.page).trim()   : "";

  const doi = msg && msg.DOI ? String(msg.DOI).trim() : "";

  return {
    title,
    authors,
    journalFull,
    journalAbbrev: "",
    year,
    volume,
    issue,
    pages,
    doi
  };
}