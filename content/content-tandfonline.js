// content-tandfonline.js
// Taylor & Francis (tandfonline) 전용 파서

function extractFromTandF(doc) {
  // --- title ---
  let title =
    getMeta(doc, "citation_title") ||
    getMeta(doc, "dc.title") ||
    getMeta(doc, "og:title") ||
    (doc.querySelector("h1")?.textContent || "").trim();

  // --- JSON-LD fallback (title/authors/year) ---
  const jsonld = extractFromJSONLD(doc); // { title, authors }
  if (!title && jsonld?.title) title = jsonld.title;

  // --- authors ---
  let authors = getMetas(doc, "citation_author");

  if (!authors.length && jsonld?.authors?.length) {
    authors = jsonld.authors;
  }

  // T&F DOM에서 author name 자주 나오는 패턴들
  if (!authors.length) {
    const els = doc.querySelectorAll(
      [
        ".loa__author-name",
        ".authors a",
        "a[rel='author']",
        "[data-testid='author-name']",
        "meta[name='dc.Creator']",
        "meta[name='dc.creator']",
      ].join(",")
    );

    authors = Array.from(els)
      .map(e => (e.tagName === "META" ? (e.content || "") : (e.textContent || "")))
      .map(s => s.trim())
      .filter(Boolean);
  }

  authors = authors.map(cleanAuthorName).filter(Boolean);

  // --- journal ---
  const journalFull =
    getMeta(doc, "citation_journal_title") ||
    getMeta(doc, "prism.publicationName") ||
    getMeta(doc, "og:site_name") ||
    "";

  // --- year ---
  let year =
    getMeta(doc, "citation_year") ||
    "";

  if (!year) {
    const date =
      getMeta(doc, "citation_publication_date") ||
      getMeta(doc, "citation_online_date") ||
      getMeta(doc, "citation_date") ||
      getMeta(doc, "prism.publicationDate") ||
      getMeta(doc, "dc.date") ||
      getMeta(doc, "dc.Date") ||
      "";

    const m = date.match(/\b(19|20)\d{2}\b/);
    if (m) year = m[0];
  }

  // 최후의 보루: 본문 텍스트에서 연도 하나라도 줍기 (Published online: 06 Mar 2024 같은 경우)
  if (!year) {
    const txt = (doc.body?.innerText || "");
    const m = txt.match(/\b(19|20)\d{2}\b/);
    if (m) year = m[0];
  }

  // --- volume/issue/pages (meta 우선) ---
  const volume = getMeta(doc, "citation_volume") || "";
  const issue  = getMeta(doc, "citation_issue") || "";
  const first  = getMeta(doc, "citation_firstpage") || "";
  const last   = getMeta(doc, "citation_lastpage") || "";
  const pages  = getMeta(doc, "citation_pages") || (first && last ? `${first}-${last}` : first);

  // --- DOI ---
  let doi = (getMeta(doc, "citation_doi") || "").trim();
  if (!doi) {
    const canonical = doc.querySelector('link[rel="canonical"]')?.href || "";
    const url = canonical || location.href;
    const m = url.match(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i);
    if (m) doi = m[0];
  }

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
    pmid: ""
  };
}