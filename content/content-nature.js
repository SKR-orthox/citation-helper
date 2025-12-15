(() => {
  const api = (typeof browser !== "undefined") ? browser : chrome;

  function safeText(v) {
    if (!v) return "";
    return String(v).replace(/\s+/g, " ").trim();
  }

  function getMeta(name) {
    const el = document.querySelector(`meta[name="${name}"]`);
    return el ? safeText(el.content) : "";
  }

  function getMetas(name) {
    return Array.from(document.querySelectorAll(`meta[name="${name}"]`))
      .map(el => safeText(el.content))
      .filter(Boolean);
  }

  function year4(v) {
    const s = safeText(v);
    const m = s.match(/\b(19\d{2}|20\d{2}|21\d{2})\b/);
    return m ? m[1] : "";
  }

  function extract() {
    let authors = getMetas("citation_author");
    if (!authors.length) authors = getMetas("dc.creator");

    function cleanAuthorRaw(raw) {
      let v = safeText(raw);
      // 꼬리표 제거(각주/숫자/기호 등)
      v = v.replace(/\s*[\d*@†‡]+(?:,\s*[\d*@†‡]+)*\s*$/g, "").trim();
      // 끝 구두점 정리
      v = v.replace(/[.,;:]+$/g, "").trim();
      // et al 자체가 들어오는 케이스 방어
      if (/^et\s+al\.?$/i.test(v)) return "";
      return v;
    }

    function onlyLettersToken(token) {
      const t = String(token || "");
      // 유니코드 문자(악센트 포함) 추출 시도
      try {
        const m = t.match(/\p{L}+/gu);
        return m ? m.join("") : "";
      } catch {
        // 혹시 unicode property가 안 되면 라틴권 fallback
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

      // "van Hooft P" 같이 마지막이 이니셜 덩어리면 성은 앞쪽 전체
      if (/^[A-Z]{1,6}$/.test(last)) {
        return { family: tokens.slice(0, -1).join(" "), given: last };
      }

      // 일반적으로 "Given ... Family"
      return { family: last, given: tokens.slice(0, -1).join(" ") };
    }

    const authorParts = authors.map(parseAuthor).filter(Boolean);

    // Vancouver: "Family INI"
    const authorsVancouver = authorParts
      .map(p => {
        const ini = toInitials(p.given);
        return ini ? `${p.family} ${ini}` : p.family;
      })
      .filter(Boolean);

    // APA: "Family, I. N."
    const authorsAPA = authorParts
      .map(p => {
        const dots = initialsWithDots(toInitials(p.given));
        return dots ? `${p.family}, ${dots}` : p.family;
      })
      .filter(Boolean);

    // IEEE: "I. N. Family"
    const authorsIEEE = authorParts
      .map(p => {
        const dots = initialsWithDots(toInitials(p.given));
        return dots ? `${dots} ${p.family}` : p.family;
      })
      .filter(Boolean);

    const title =
      getMeta("citation_title") ||
      getMeta("dc.title") ||
      safeText(document.querySelector("h1")?.textContent);

    const journalFull =
      getMeta("citation_journal_title") ||
      getMeta("prism.publicationName") ||
      getMeta("dc.source") ||
      "Nature";

    const journalAbbrev = getMeta("citation_journal_abbrev");

    const doi =
      getMeta("citation_doi") ||
      getMeta("dc.identifier") ||
      getMeta("prism.doi") ||
      "";

    const year = year4(
      getMeta("citation_year") ||
      getMeta("citation_date") ||
      getMeta("citation_publication_date") ||
      getMeta("prism.publicationDate") ||
      getMeta("dc.date") ||
      getMeta("dc.date.issued") ||
      ""
    );

    const volume = getMeta("citation_volume");
    const issue = getMeta("citation_issue");

    const first = getMeta("citation_firstpage");
    const last = getMeta("citation_lastpage");
    const eloc = getMeta("citation_elocation_id");

    let pages = "";
    if (first && last) pages = `${first}-${last}`;
    else if (first) pages = first;
    else if (eloc) pages = eloc;

    return {
      // 원본(사이트 그대로)
      authors,
      // 스타일별 “가공된” 저자 리스트
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
      const isNature = (host === "www.nature.com" || host === "nature.com");
      if (!isNature) {
        sendResponse({ ok: false, errorCode: "UNSUPPORTED_SITE" });
        return;
      }

      const urlLooksLikeArticle =
        /\/([a-z]{2}\/)?articles\/[^\/]+\/?$/.test(location.pathname);

      const data = extract();

      const hasCore =
        !!data.title ||
        (Array.isArray(data.authors) && data.authors.length > 0);

      if (!hasCore) {
        sendResponse({
          ok: false,
          errorCode: urlLooksLikeArticle ? "SITE_CHANGED" : "NO_ARTICLE"
        });
        return;
      }

      if (!data.title) {
        sendResponse({ ok: false, errorCode: "PARSE_FAILED" });
        return;
      }

      sendResponse({ ok: true, data });
    } catch (e) {
      console.error("[PCH content nature] error:", e);
      sendResponse({ ok: false, errorCode: "UNKNOWN" });
    }

    return true;
  });
})();