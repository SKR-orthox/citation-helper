// content-nature.js
(() => {
  const api = (typeof browser !== "undefined") ? browser : chrome;

  const R = globalThis.PCH?.REASONS || Object.freeze({
    UNSUPPORTED_SITE: "UNSUPPORTED_SITE",
    NO_ARTICLE: "NO_ARTICLE",
    SITE_CHANGED: "SITE_CHANGED",
    PARSE_FAILED: "PARSE_FAILED",
    EXTENSION_NOT_ACTIVE: "EXTENSION_NOT_ACTIVE",
    MISSING_FIELDS: "MISSING_FIELDS",
    UNKNOWN: "UNKNOWN"
  });

  function safeText(v) {
    if (!v) return "";
    return String(v).replace(/\s+/g, " ").trim();
  }

  function getMeta(name) {
    const el = document.querySelector(`meta[name="${name}"]`);
    return el?.content ? safeText(el.content) : "";
  }

  function getMetas(name) {
    return Array.from(document.querySelectorAll(`meta[name="${name}"]`))
      .map(el => safeText(el.content))
      .filter(Boolean);
  }

  function normalizeUrl(url) {
    const v = safeText(url);
    if (!v) return "";
    try { return new URL(v, location.href).toString(); } catch { return v; }
  }

  function detectSite() {
    const host = (location.hostname || "").toLowerCase();
    const isNature = (host === "www.nature.com" || host === "nature.com");
    if (!isNature) return { ok: false, reason: R.UNSUPPORTED_SITE };

    // Nature article path examples:
    // /articles/d41586-024-04246-9
    // /nature/articles/s41586-024-08458-x (journal prefix)
    const isArticlePath = /\/(?:[a-z]{2}\/)?articles\/[^\/]+\/?$/.test(location.pathname);
    if (!isArticlePath) return { ok: false, reason: R.NO_ARTICLE };

    return { ok: true };
  }

  function parseJsonLd() {
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    const out = [];

    for (const s of scripts) {
      const raw = s.textContent;
      if (!raw) continue;
      try {
        const obj = JSON.parse(raw);
        out.push(obj);
      } catch {
        // sometimes JSON-LD contains multiple objects or invalid JSON; ignore
      }
    }
    return out;
  }

  function pickScholarlyArticle(jsonlds) {
    const flat = [];
    const pushAny = (x) => {
      if (!x) return;
      if (Array.isArray(x)) x.forEach(pushAny);
      else if (typeof x === "object") flat.push(x);
    };
    jsonlds.forEach(pushAny);

    // prefer ScholarlyArticle / Article / NewsArticle (Nature varies)
    const score = (o) => {
      const t = o["@type"];
      const types = Array.isArray(t) ? t : [t].filter(Boolean);
      let s = 0;
      if (types.includes("ScholarlyArticle")) s += 3;
      if (types.includes("Article")) s += 2;
      if (types.includes("NewsArticle")) s += 1;
      if (o.headline || o.name) s += 1;
      if (o.author) s += 1;
      return s;
    };

    let best = null;
    let bestScore = -1;
    for (const o of flat) {
      const sc = score(o);
      if (sc > bestScore) {
        bestScore = sc;
        best = o;
      }
    }
    return best;
  }

  function extractFromMeta() {
    const title = getMeta("citation_title") || getMeta("dc.title") || getMeta("og:title");
    const authors = getMetas("citation_author");

    const journalFull =
      getMeta("citation_journal_title") ||
      getMeta("citation_conference_title") ||
      getMeta("prism.publicationName") ||
      getMeta("dc.source") ||
      "";

    const date =
      getMeta("citation_publication_date") ||
      getMeta("citation_online_date") ||
      getMeta("prism.publicationDate") ||
      getMeta("dc.date") ||
      "";

    const year = date ? safeText(date).slice(0, 4) : "";

    const volume = getMeta("citation_volume") || getMeta("prism.volume") || "";
    const issue  = getMeta("citation_issue") || getMeta("prism.number") || "";

    const fp = getMeta("citation_firstpage") || getMeta("prism.startingPage") || "";
    const lp = getMeta("citation_lastpage") || getMeta("prism.endingPage") || "";

    let pages = "";
    if (fp && lp) pages = `${fp}-${lp}`;
    else pages = fp || lp || "";

    const doi = getMeta("citation_doi") || getMeta("dc.identifier") || getMeta("prism.doi") || "";
    const url = normalizeUrl(getMeta("citation_abstract_html_url") || getMeta("og:url") || location.href);

    return {
      authors,
      title,
      journalFull,
      journalAbbrev: "",
      year,
      volume,
      issue,
      pages,
      pmid: "",
      doi: safeText(doi).replace(/^doi:\s*/i, ""),
      url
    };
  }

  function extractFromJsonLd(articleObj) {
    if (!articleObj || typeof articleObj !== "object") return null;

    const title = safeText(articleObj.headline || articleObj.name || "");

    // authors can be [{name}], {name}, or strings
    let authors = [];
    const a = articleObj.author;
    if (Array.isArray(a)) {
      authors = a.map(x => safeText(x?.name || x)).filter(Boolean);
    } else if (a) {
      authors = [safeText(a?.name || a)].filter(Boolean);
    }

    // journal/publisher-ish
    let journalFull = "";
    const isPartOf = articleObj.isPartOf;
    if (isPartOf) {
      // sometimes isPartOf is { name: "Nature" } or array
      if (Array.isArray(isPartOf)) journalFull = safeText(isPartOf[0]?.name || "");
      else journalFull = safeText(isPartOf?.name || "");
    }
    if (!journalFull) journalFull = safeText(articleObj.publisher?.name || "");

    const date = safeText(articleObj.datePublished || articleObj.dateCreated || "");
    const year = date ? date.slice(0, 4) : "";

    // volume/issue/pages are often missing in news-type pages
    const volume = safeText(articleObj.volumeNumber || "");
    const issue  = safeText(articleObj.issueNumber || "");

    let pages = "";
    const pStart = safeText(articleObj.pageStart || "");
    const pEnd   = safeText(articleObj.pageEnd || "");
    if (pStart && pEnd) pages = `${pStart}-${pEnd}`;
    else pages = pStart || pEnd || "";

    // DOI can appear in identifier
    let doi = "";
    const id = articleObj.identifier;
    if (typeof id === "string") doi = safeText(id);
    else if (id && typeof id === "object") doi = safeText(id.value || id["@value"] || "");
    doi = doi.replace(/^doi:\s*/i, "");

    const url = normalizeUrl(articleObj.url || location.href);

    return {
      authors,
      title,
      journalFull,
      journalAbbrev: "",
      year,
      volume,
      issue,
      pages,
      pmid: "",
      doi,
      url
    };
  }

  function mergePreferMeta(metaData, jsonData) {
    // Prefer meta for journal/volume/issue/pages/doi, but take whatever exists.
    const out = { ...jsonData, ...metaData };

    // If authors missing in meta but exist in json, keep json authors
    if ((!metaData.authors || metaData.authors.length === 0) && jsonData?.authors?.length) {
      out.authors = jsonData.authors;
    }

    // If title missing in meta but exists in json
    if (!metaData.title && jsonData?.title) out.title = jsonData.title;

    // Ensure url
    out.url = normalizeUrl(out.url || location.href);

    return out;
  }

  function extractCitationData() {
    const metaData = extractFromMeta();

    const jsonlds = parseJsonLd();
    const best = pickScholarlyArticle(jsonlds);
    const jsonData = best ? extractFromJsonLd(best) : null;

    const data = jsonData ? mergePreferMeta(metaData, jsonData) : metaData;

    // final cleanup
    data.authors = (Array.isArray(data.authors) ? data.authors : [])
      .map(safeText)
      .filter(Boolean);

    data.title = safeText(data.title);
    data.journalFull = safeText(data.journalFull);
    data.year = safeText(data.year);
    data.volume = safeText(data.volume);
    data.issue = safeText(data.issue);
    data.pages = safeText(data.pages);
    data.doi = safeText(data.doi);
    data.url = normalizeUrl(data.url);

    return data;
  }

  api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || msg.type !== "GET_CITATION_DATA") return;

    try {
      const det = detectSite();
      if (!det.ok) {
        sendResponse({ ok: false, errorCode: det.reason });
        return true;
      }

      const data = extractCitationData();

      // 핵심 데이터가 거의 없으면 구조 변경 의심
      const hasCore = !!data.title || (Array.isArray(data.authors) && data.authors.length > 0);
      if (!hasCore) {
        sendResponse({ ok: false, errorCode: R.SITE_CHANGED });
        return true;
      }

      // title은 최소 요구
      if (!data.title) {
        sendResponse({ ok: false, errorCode: R.PARSE_FAILED });
        return true;
      }

      sendResponse({ ok: true, data });
    } catch (e) {
      console.error("[PCH content nature] error:", e);
      sendResponse({ ok: false, errorCode: R.UNKNOWN });
    }

    return true;
  });
})();