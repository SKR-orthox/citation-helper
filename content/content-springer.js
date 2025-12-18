// content/content-springer.js
(() => {
  const api = (typeof browser !== "undefined") ? browser : chrome;

  function safeText(v) {
    if (!v) return "";
    return String(v).replace(/\s+/g, " ").trim();
  }

  function getMeta(name) {
    const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
    return el ? safeText(el.content) : "";
  }

  function getMetas(name) {
    return Array.from(document.querySelectorAll(`meta[name="${name}"], meta[property="${name}"]`))
      .map(el => safeText(el.content))
      .filter(Boolean);
  }

  function getMetaAny(names) {
    for (const n of names) {
      const v = getMeta(n);
      if (v) return v;
    }
    return "";
  }

  function getMetasAny(names) {
    for (const n of names) {
      const vs = getMetas(n);
      if (vs.length) return vs;
    }
    return [];
  }

  function year4(v) {
    const s = safeText(v);
    const m = s.match(/\b(19\d{2}|20\d{2}|21\d{2})\b/);
    return m ? m[1] : "";
  }

  function onlyLettersToken(token) {
    const t = String(token || "");
    try {
      const m = t.match(/\p{L}+/gu);
      return m ? m.join("") : "";
    } catch {
      const m = t.match(/[A-Za-zÀ-ÖØ-öø-ÿ]+/g);
      return m ? m.join("") : "";
    }
  }

  function toInitials(given) {
    const parts = String(given || "")
      .trim()
      .split(/[\s-]+/)
      .map(onlyLettersToken)
      .filter(Boolean);
    return parts.map(p => p[0].toUpperCase()).join("");
  }

  function initialsWithDots(initials) {
    const v = safeText(initials).replace(/[^A-Za-z]/g, "");
    if (!v) return "";
    return v.split("").map(ch => `${ch}.`).join(" ");
  }

  function cleanAuthorRaw(raw) {
    let v = safeText(raw);
    v = v.replace(/\s*[\d*@†‡]+(?:,\s*[\d*@†‡]+)*\s*$/g, "").trim();
    v = v.replace(/[.,;:]+$/g, "").trim();
    if (/^et\s+al\.?$/i.test(v)) return "";
    return v;
  }

  function parseAuthor(raw) {
    const s = cleanAuthorRaw(raw);
    if (!s) return null;

    // "Family, Given ..."
    if (s.includes(",")) {
      const idx = s.indexOf(",");
      const family = safeText(s.slice(0, idx));
      const given = safeText(s.slice(idx + 1));
      return { family, given };
    }

    const tokens = s.split(/\s+/).filter(Boolean);
    if (tokens.length === 1) return { family: tokens[0], given: "" };

    const last = tokens[tokens.length - 1];

    // 마지막 토큰이 이니셜 덩어리면 성은 앞쪽 전체
    if (/^[A-Z]{1,6}$/.test(last)) {
      return { family: tokens.slice(0, -1).join(" "), given: last };
    }

    // 일반적으로 "Given ... Family"
    return { family: last, given: tokens.slice(0, -1).join(" ") };
  }

  function doiFromUrl() {
    // SpringerLink: /article/10.1007/sxxxx... 또는 /chapter/10.1007/....
    const m = location.pathname.match(/^\/(?:article|chapter)\/(10\.\d{4,9}\/[^\/?#]+)\/?$/i);
    return m ? safeText(m[1]) : "";
  }

  function extract() {
    // Authors
    let authors = getMetasAny([
      "citation_author",
      "dc.creator",
      "DC.creator",
      "dc.Creator",
      "DC.Creator"
    ]);

    // Title
    const title = getMetaAny([
      "citation_title",
      "dc.title",
      "DC.title"
    ]) || safeText(document.querySelector("h1")?.textContent);

    // Journal / Container
    const journalFull = getMetaAny([
      "citation_journal_title",
      "citation_book_title",
      "citation_inbook_title",
      "citation_publication_title",
      "citation_series_title",
      "citation_conference_title",
      "prism.publicationName",
      "dc.source",
      "DC.source"
    ]);

    const journalAbbrev = getMetaAny([
      "citation_journal_abbrev",
      "prism.abbreviation"
    ]); 

    // DOI
    let doi = getMetaAny([
      "citation_doi",
      "prism.doi",
      "dc.identifier",
      "DC.identifier"
    ]);

    if (doi && /^10\./.test(doi) === false) {
      // dc.identifier에 "doi:10..." 형태가 섞일 수 있음
      doi = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, "").trim();
    }
    if (!doi) doi = doiFromUrl();

    // Date / Year
    const year = year4(getMetaAny([
      "citation_year",
      "citation_publication_date",
      "citation_online_date",
      "citation_date",
      "prism.publicationDate",
      "dc.date",
      "dc.date.issued",
      "DC.date",
      "DC.date.issued"
    ]));

    // Volume/Issue
    const volume = getMeta("citation_volume");
    const issue = getMeta("citation_issue");

    // Pages
    const pagesMeta = getMetaAny(["citation_pages", "citation_pagination"]);
    const first = getMeta("citation_firstpage");
    const last = getMeta("citation_lastpage");
    const eloc = getMeta("citation_elocation_id");

    let pages = "";
    if (pagesMeta) pages = pagesMeta;
    else if (first && last) pages = `${first}-${last}`;
    else if (first) pages = first;
    else if (eloc) pages = eloc;

    // Style-ready authors (formatters 안정 유지용)
    const authorParts = authors.map(parseAuthor).filter(Boolean);

    const authorsVancouver = authorParts.map(p => {
      const ini = toInitials(p.given);
      return ini ? `${p.family} ${ini}` : p.family;
    }).filter(Boolean);

    const authorsAPA = authorParts.map(p => {
      const dots = initialsWithDots(toInitials(p.given));
      return dots ? `${p.family}, ${dots}` : p.family;
    }).filter(Boolean);

    const authorsIEEE = authorParts.map(p => {
      const dots = initialsWithDots(toInitials(p.given));
      return dots ? `${dots} ${p.family}` : p.family;
    }).filter(Boolean);

    return {
      authors,
      authorsVancouver,
      authorsAPA,
      authorsIEEE,

      title,
      journalFull,
      journalAbbrev,
      year,
      volume,
      issue,
      pages,
      pmid: "",
      doi,
      url: location.href
    };
  }

  api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || msg.type !== "GET_CITATION_DATA") return;

    try {
      const host = (location.hostname || "").toLowerCase();
      const isSpringer = (host === "link.springer.com");
      if (!isSpringer) {
        sendResponse({ ok: false, errorCode: "UNSUPPORTED_SITE" });
        return;
      }

      const urlLooksLikeArticle = /^\/(article|chapter)\/.+/i.test(location.pathname);

      const data = extract();

      const hasCore = !!data.title || (Array.isArray(data.authors) && data.authors.length > 0);
      if (!hasCore) {
        sendResponse({ ok: false, errorCode: urlLooksLikeArticle ? "SITE_CHANGED" : "NO_ARTICLE" });
        return;
      }
      if (!data.title) {
        sendResponse({ ok: false, errorCode: "PARSE_FAILED" });
        return;
      }

      sendResponse({ ok: true, data });
    } catch (e) {
      console.error("[PCH content springer] error:", e);
      sendResponse({ ok: false, errorCode: "UNKNOWN" });
    }

    return true;
  });
})();