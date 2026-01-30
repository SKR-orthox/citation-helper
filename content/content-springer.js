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
    const m = location.pathname.match(/^\/(?:article|chapter|protocol)\/(10\.\d{4,9}\/[^\/?#]+)\/?$/i);
    return m ? safeText(m[1]) : "";
  }

  function extract() {
    const path = (location.pathname || "");
    const isChapterLike = /^\/(chapter|protocol)\//i.test(path);

    // Authors
    let authors = getMetasAny([
      "citation_author",
      "dc.creator",
      "DC.creator",
      "dc.Creator",
      "DC.Creator"
    ]);

    // Editors (book chapter / protocol에서 있을 때만 유용)
    const editors = getMetasAny([
      "citation_editor",
      "dc.contributor",
      "DC.contributor"
    ]);

    // Title
    const title = getMetaAny([
      "citation_title",
      "dc.title",
      "DC.title"
    ]) || safeText(document.querySelector("h1")?.textContent);

    // Journal / Container
    // chapter/protocol이면 book title을 우선
    const journalFull = isChapterLike
      ? getMetaAny([
          "citation_book_title",
          "citation_inbook_title",
          "citation_series_title",
          "citation_publication_title",
          "citation_journal_title",
          "prism.publicationName",
          "dc.source",
          "DC.source"
        ])
      : getMetaAny([
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

    // Publisher (chapter/protocol export 품질 향상용)
    const publisher =
      getMetaAny([
        "citation_publisher",
        "dc.publisher",
        "DC.publisher"
      ]) || "Springer";

    // ISBN (있으면 export 품질 향상)
    // 너무 공격적으로 dc.identifier를 파지 않고, 스프링거에서 자주 나오는 키만 우선
    const isbn = getMetaAny([
      "citation_isbn",
      "citation_eisbn",
      "prism.isbn",
      "prism.eisbn"
    ]);

    // DOI
    let doi = getMetaAny([
      "citation_doi",
      "prism.doi",
      "dc.identifier",
      "DC.identifier"
    ]);

    if (doi && /^10\./.test(doi) === false) {
      // dc.identifier에 "doi:10..." 또는 doi URL이 섞일 수 있음
      doi = doi
        .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
        .replace(/^doi:\s*/i, "")
        .trim();
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

    // Volume/Issue (book chapter는 보통 비어있음)
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

    // Style-ready authors
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
      // 핵심: /protocol도 chapter로 태깅
      type: isChapterLike ? "chapter" : "article",

      authors,
      authorsVancouver,
      authorsAPA,
      authorsIEEE,

      // book 계열 품질 보강(있는 것만 쓰게 formatters가 safeText 처리)
      editors,
      publisher,
      isbn,

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

    // R은 무조건 먼저 잡아두기 (catch에서도 써야 함)
    const R = globalThis.PCH?.REASONS || {
      UNSUPPORTED_SITE: "UNSUPPORTED_SITE",
      NO_ARTICLE: "NO_ARTICLE",
      SITE_CHANGED: "SITE_CHANGED",
      PARSE_FAILED: "PARSE_FAILED",
      UNKNOWN: "UNKNOWN"
    };

    try {
      const host = (location.hostname || "").toLowerCase();
      if (host !== "link.springer.com") {
        sendResponse({ ok: false, errorCode: R.UNSUPPORTED_SITE });
        return;
      }

      const isArticlePath = /^\/(article|chapter|protocol)\//i.test(location.pathname);
      if (!isArticlePath) {
        sendResponse({ ok: false, errorCode: R.NO_ARTICLE });
        return;
      }

      const data = extract();

      const hasCore =
        !!data.title || (Array.isArray(data.authors) && data.authors.length > 0);

      // 여기까지 왔는데 core가 없으면 "페이지 구조 변경/추출 실패"로 보는 게 자연스러움
      if (!hasCore) {
        sendResponse({ ok: false, errorCode: R.SITE_CHANGED });
        return;
      }

      // 저자는 있는데 title이 없으면 파싱 실패로 분리
      if (!data.title) {
        sendResponse({ ok: false, errorCode: R.PARSE_FAILED });
        return;
      }

      sendResponse({ ok: true, data });
    } catch (e) {
      console.error("[PCH content springer] error:", e);
      sendResponse({ ok: false, errorCode: R.UNKNOWN });
    }

    return true;
  });
})();