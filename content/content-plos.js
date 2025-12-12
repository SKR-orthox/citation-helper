// content-plos.js
// PLOS 전용 파서

function extractFromPLOS(doc) {
  // 1) title
  const title =
    getMeta(doc, "citation_title") ||
    getMeta(doc, "dc.title") ||
    (doc.querySelector("h1")?.textContent || "").trim();

  // 2) authors
  let authors = getMetas(doc, "citation_author");
  if (!authors.length) authors = getMetas(doc, "dc.creator");
  if (!authors.length) {
    const els = doc.querySelectorAll(".authors a, .author-list a, a[rel='author']");
    authors = Array.from(els).map(e => e.textContent.trim()).filter(Boolean);
  }
  authors = authors.map(cleanAuthorName).filter(Boolean);

  // 3) journal
  const journalFull =
    getMeta(doc, "citation_journal_title") ||
    getMeta(doc, "prism.publicationName") ||
    getMeta(doc, "dc.source") ||
    (doc.querySelector('meta[property="og:site_name"]')?.content || "").trim();

  // 4) year
  let year = getMeta(doc, "citation_year");
  if (!year) {
    const date =
      getMeta(doc, "citation_publication_date") ||
      getMeta(doc, "citation_online_date") ||
      getMeta(doc, "citation_date") ||
      getMeta(doc, "dc.date") ||
      getMeta(doc, "prism.publicationDate");
    const m = (date || "").match(/\d{4}/);
    if (m) year = m[0];
  }

  // 5) volume/issue/pages/doi
  const volume = getMeta(doc, "citation_volume") || "";
  const issue  = getMeta(doc, "citation_issue") || "";
  const first  = getMeta(doc, "citation_firstpage") || "";
  const last   = getMeta(doc, "citation_lastpage") || "";
  const pages  = getMeta(doc, "citation_pages") || (first && last ? `${first}-${last}` : first);

  const doi = (getMeta(doc, "citation_doi") || "").trim();

  return {
    title,
    authors,
    journalFull: journalFull || "",
    journalAbbrev: "",
    year: year || "",
    volume,
    issue,
    pages,
    firstPage: first,
    lastPage: last,
    doi,
    pmid: getMeta(doc, "citation_pmid") || ""
  };
}