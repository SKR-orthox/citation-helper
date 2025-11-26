const api = typeof browser !== "undefined" ? browser : chrome;

console.log("[PCH] content script loaded:", location.href);

function getMeta(name) {
  const el = document.querySelector(`meta[name="${name}"]`);
  return el ? el.content.trim() : "";
}

function getMetas(name) {
  const els = document.querySelectorAll(`meta[name="${name}"]`);
  return Array.from(els).map(el => el.content.trim()).filter(Boolean);
}

function getAuthors() {
  let authors = getMetas("citation_author");
  if (authors.length > 0) return authors;

  const domAuthors = [...document.querySelectorAll("a.full-name")]
    .map(el => el.textContent.trim())
    .filter(Boolean);

  return domAuthors;
}

function getTitle() {
  return (
    getMeta("citation_title") ||
    document.querySelector("h1")?.textContent.trim() ||
    ""
  );
}

function getJournal() {
  return (
    getMeta("citation_journal_abbrev") ||
    getMeta("citation_journal_title") ||
    document.querySelector(".journal-actions .journal")?.textContent.trim() ||
    ""
  );
}

function getYear() {
  let y = getMeta("citation_year");
  if (y) return y;

  const text = document.body.textContent;
  const m = text.match(/\b(19|20)\d{2}\b/);
  return m ? m[0] : "";
}

function getPages() {
  const first = getMeta("citation_firstpage");
  const last = getMeta("citation_lastpage");
  if (first && last) return `${first}-${last}`;
  return "";
}

function getPMID() {
  let pmid = getMeta("citation_pmid");
  if (pmid) return pmid;

  const m = location.pathname.match(/\/(\d+)\//);
  return m ? m[1] : "";
}

function buildCitationData() {
  if (!location.hostname.includes("pubmed")) return null;

  const authors = getAuthors();
  const title = getTitle();
  const journalFull = getMeta("citation_journal_title") || getJournal();
  const journalAbbrev = getMeta("citation_journal_abbrev");
  const year = getYear();
  const volume = getMeta("citation_volume");
  const issue = getMeta("citation_issue");
  const pages = getPages();
  const pmid = getPMID();

  console.log("[PCH] Parsed data:", {
    authors, title, journalFull, journalAbbrev, year, volume, issue, pages, pmid
  });

  if (!title || !journalFull || authors.length === 0 || !year) {
    return null;
  }

  return {
    authors,
    title,
    journalFull,
    journalAbbrev,
    year,
    volume,
    issue,
    firstPage: pages.split("-")[0] || "",
    lastPage: pages.split("-")[1] || "",
    pmid
  };
}

api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "GET_CITATION_DATA") {
    const data = buildCitationData();
    sendResponse(data ? { ok: true, data } : { ok: false });
    return true;
  }
});
