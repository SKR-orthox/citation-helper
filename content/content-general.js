// content-general.js
// Web of Science / Scopus / Google Scholar / ScienceDirect / Cell / Lancet / Springer / Wiley 등
// "일반적인 학술 사이트"용 공통 파서 (강화 버전)

// 전제:
// - content-common.js가 먼저 로드되어 있어서
//   getMeta, getMetas, extractFromJSONLD, cleanAuthorName 가 전역에 있음.

// -----------------------------
// 1) 메타 태그에서 저자 배열 뽑기
// -----------------------------
function getAuthorsFromMeta(doc) {
  // 가장 흔한 패턴
  let authors = getMetas(doc, "citation_author");

  // 백업 후보들
  if (!authors.length) authors = getMetas(doc, "dc.creator");
  if (!authors.length) authors = getMetas(doc, "prism.author");
  if (!authors.length) authors = getMetas(doc, "author");

  authors = authors
    .map(a => cleanAuthorName(a))
    .filter(a => a && a.length > 0);

  return authors;
}

// -----------------------------
// 2) DOM에서 저자 이름 긁어오기 (meta가 없을 때 사용)
// -----------------------------
function getAuthorsFromDom(doc) {
  // 여러 사이트 공통으로 자주 쓰는 셀렉터들
  const selectors = [
    ".author-name",
    ".author__name",
    ".content-header__authors a",
    ".c-article-author-list__item a",
    ".c-article-author-list__item span",
    ".article-header__authors a",
    ".article-header__info a",
    ".loa__item .author-name",
    ".loa__item .info-card-name",
    ".author-group a",
    ".author-group .author-name",
    "a[rel='author']",
    "a[href*='author']",
    ".ep-article-header__authors a",
    ".article__authors a"
  ];

  const names = [];

  function pushText(el) {
    if (!el || !el.textContent) return;
    const cleaned = cleanAuthorName(el.textContent);
    if (!cleaned) return;
    if (!names.includes(cleaned)) names.push(cleaned);
  }

  selectors.forEach(sel => {
    const els = doc.querySelectorAll(sel);
    els.forEach(pushText);
  });

  return names;
}

// -----------------------------
// 3) 메타 태그에서 저널명 추출
// -----------------------------
function getJournalFromMeta(doc) {
  const candidates = [
    "citation_journal_title",
    "citation_conference_title",
    "dc.source",
    "prism.publicationName",
    "prism.seriesTitle"
  ];

  for (const name of candidates) {
    const v = getMeta(doc, name);
    if (v) return v;
  }

  // ScienceDirect, Lancet, Cell 처럼 meta가 약한 경우 DOM에서 한 번 더 시도
  const domCandidates = [
    "a.publication-title",
    ".publication-title",
    ".journal-title",
    ".article-header__journal",
    ".article__journal",
    "a[href*='/journal/']"
  ];
  for (const sel of domCandidates) {
    const el = doc.querySelector(sel);
    if (el && el.textContent) {
      const j = el.textContent.trim();
      if (j) return j;
    }
  }

  // 마지막 수단: 사이트 이름이라도 사용
  const ogSite = doc.querySelector('meta[property="og:site_name"]');
  if (ogSite && ogSite.content) {
    return ogSite.content.trim();
  }

  return "";
}

// -----------------------------
// 4) 연도 추출
// -----------------------------
function getYearFromMeta(doc) {
  let year = getMeta(doc, "citation_year");
  if (year) return year;

  let date =
    getMeta(doc, "citation_date") ||
    getMeta(doc, "citation_online_date") ||
    getMeta(doc, "dc.date") ||
    getMeta(doc, "prism.publicationDate") ||
    getMeta(doc, "citation_publication_date");

  if (!date) {
    const el = doc.querySelector(
      'meta[property="article:published_time"], ' +
      'meta[name="prism.onlinePublicationDate"], ' +
      'meta[name="publication_date"], ' +
      'meta[name="journal_date"]'
    );
    if (el && el.content) date = el.content;
  }

  if (!date) {
    const timeEl = doc.querySelector("time[datetime]");
    if (timeEl) {
      date = timeEl.getAttribute("datetime") || timeEl.textContent;
    }
  }

  if (date) {
    const m = date.match(/\d{4}/);
    if (m) return m[0];
  }

  return "";
}

// -----------------------------
// 5) 페이지 정보
// -----------------------------
function getPagesFromMeta(doc) {
  let first = getMeta(doc, "citation_firstpage");
  let last = getMeta(doc, "citation_lastpage");
  let pages = getMeta(doc, "citation_pages");

  if (!pages) {
    if (first && last && first !== last) {
      pages = `${first}-${last}`;
    } else if (first) {
      pages = first;
    }
  }

  return { pages, firstPage: first, lastPage: last };
}

// -----------------------------
// 6) DOI / PMID
// -----------------------------
function getDoiFromMeta(doc) {
  let doi =
    getMeta(doc, "citation_doi") ||
    getMeta(doc, "dc.identifier") ||
    getMeta(doc, "prism.doi");

  if (!doi) {
    const el = doc.querySelector('a[href^="https://doi.org/"]');
    if (el) doi = el.getAttribute("href");
  }

  if (doi) {
    doi = doi.replace(/^https?:\/\/doi\.org\//i, "");
    doi = doi.replace(/^doi[:\s]*/i, "").trim();
  }
  return doi || "";
}

function getPmidFromMeta(doc) {
  return getMeta(doc, "citation_pmid") || "";
}

// -----------------------------
// 7) 타이틀
// -----------------------------
function getTitleGeneral(doc) {
  const jsonld = extractFromJSONLD(doc);

  if (jsonld) {
    const cand = jsonld.title || jsonld.headline || jsonld.name;
    if (cand) return cand;
  }

  let title =
    getMeta(doc, "citation_title") ||
    getMeta(doc, "dc.title") ||
    getMeta(doc, "prism.title");

  if (!title) {
    const ogTitle = doc.querySelector('meta[property="og:title"]');
    if (ogTitle && ogTitle.content) title = ogTitle.content.trim();
  }

  if (title) return title;

  const h1 = doc.querySelector("h1");
  if (h1 && h1.textContent) return h1.textContent.trim();

  return "";
}

// -----------------------------
// 8) 저자 (JSON-LD + meta + DOM 합치기)
// -----------------------------
function getAuthorsGeneral(doc) {
  const jsonld = extractFromJSONLD(doc);
  let authors = [];

  // 1) JSON-LD
  if (jsonld) {
    if (Array.isArray(jsonld.authors)) {
      authors = authors.concat(jsonld.authors);
    } else if (Array.isArray(jsonld.author)) {
      // ScienceDirect 등: author: [{ "@type":"Person", "name":"..." }]
      authors = authors.concat(
        jsonld.author
          .map(a => (typeof a === "string" ? a : a && a.name))
          .filter(Boolean)
      );
    }
  }

  // 2) meta
  const metaAuthors = getAuthorsFromMeta(doc);
  authors = authors.concat(metaAuthors);

  // 3) DOM
  const domAuthors = getAuthorsFromDom(doc);
  authors = authors.concat(domAuthors);

  // 4) 클린업 + 중복 제거
  authors = authors
    .map(a => cleanAuthorName(a))
    .filter(a => a && a.length > 0);

  const unique = [];
  for (const a of authors) {
    if (!unique.includes(a)) unique.push(a);
  }

  return unique;
}

// -----------------------------
// 9) 메인 엔트리
// -----------------------------
function extractGeneral(doc) {
  const hostname = location.hostname;
  console.log("[PCH] extractGeneral called on", hostname);

  const title = getTitleGeneral(doc);
  const authors = getAuthorsGeneral(doc);
  const journal = getJournalFromMeta(doc);
  const year = getYearFromMeta(doc);

  const volume =
    getMeta(doc, "citation_volume") ||
    getMeta(doc, "prism.volume") ||
    "";

  const issue =
    getMeta(doc, "citation_issue") ||
    getMeta(doc, "prism.number") ||
    "";

  const { pages, firstPage, lastPage } = getPagesFromMeta(doc);

  const doi = getDoiFromMeta(doc);
  const pmid = getPmidFromMeta(doc);

  const result = {
    title: title || "",
    authors: authors || [],
    journalFull: journal || "",
    journalAbbrev: "",
    year: year || "",
    volume: volume || "",
    issue: issue || "",
    pages: pages || "",
    firstPage: firstPage || "",
    lastPage: lastPage || "",
    doi: doi || "",
    pmid: pmid || ""
  };

  console.log("[PCH] extractGeneral result:", result);
  return result;
}