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

  function extract() {
    function year4(v) {
      const s = safeText(v);
      const m = s.match(/\b(19\d{2}|20\d{2}|21\d{2})\b/); // 1900~2199
      return m ? m[1] : "";
    }

    function normalizeAuthor(s) {
      let v = safeText(s);

      // 뒤에 붙는 소속 숫자 제거: "X Li 1" -> "X Li"
      v = v.replace(/\s*\d+(?:,\s*\d+)*\s*$/g, "").trim();

      // "X Li" -> "Li X" (이니셜 1글자 + 성) 패턴만 뒤집기
      const m = v.match(/^([A-Z])\s+([A-Za-z][A-Za-z'\-]+)$/);
      if (m) v = `${m[2]} ${m[1]}`;

      return v;
    }

    function extractAuthorsFallback() {
      const list = Array.from(
        document.querySelectorAll("a.full-name, a.fullName, span.full-name")
      )
        .map(el => safeText(el.textContent))
        .filter(Boolean);

      return list.map(normalizeAuthor).filter(Boolean);
    }

    // Authors
    let authors = getMetas("citation_author");
    if (!authors.length) authors = extractAuthorsFallback();
    authors = Array.from(new Set(authors.map(normalizeAuthor).filter(Boolean)));

    // Core fields
    const title =
      getMeta("citation_title") ||
      safeText(document.querySelector("h1")?.textContent);

    const journalFull =
      getMeta("citation_journal_title") ||
      safeText(document.querySelector(".journal-actions .journal")?.textContent);

    const journalAbbrev = getMeta("citation_journal_abbrev");

    const doi =
      getMeta("citation_doi") ||
      getMeta("dc.identifier") ||
      "";

    // ✅ year: 4자리(YYYY)만 허용
    const year = year4(
      getMeta("citation_year") ||
      getMeta("citation_date") ||
      getMeta("dc.date") ||
      getMeta("dc.date.issued") ||
      getMeta("citation_publication_date") ||
      ""
    );

    const volume = getMeta("citation_volume");
    const issue = getMeta("citation_issue");

    // Pages
    const first = getMeta("citation_firstpage");
    const last  = getMeta("citation_lastpage");
    const eloc  = getMeta("citation_elocation_id");

    const pagesMeta =
      getMeta("citation_pages") ||
      getMeta("citation_pagination") ||
      "";

    let pages = "";
    if (pagesMeta) pages = pagesMeta;
    else if (first && last) pages = `${first}-${last}`;
    else if (first) pages = first;
    else if (eloc) pages = eloc;

    if (!pages) {
      const cit = safeText(document.querySelector(".cit")?.textContent || "");

      // A) 일반적인 PubMed 포맷: ;15(1):43663 / ;109(5):e1389-e1399
      const m1 = cit.match(/;\s*\d+(?:\([^)]*\))?\s*:\s*([A-Za-z]?\d+(?:\s*-\s*[A-Za-z]?\d+)?)\b/);

      // B) eLife 같은 포맷: 2025 Aug 1:14:e104918  (day:volume:elocator)
      const m2 = cit.match(/:\s*\d+\s*:\s*([A-Za-z]?\d+(?:\s*-\s*[A-Za-z]?\d+)?)\b/);

      const hit = m1 || m2;
      if (hit) pages = hit[1].replace(/\s+/g, "");
    }

    // PMID
    const pmid =
      getMeta("citation_pmid") ||
      ((location.pathname.match(/\/(\d+)\//) || [])[1] || "");

    return {
      authors,
      title,
      journalFull,
      journalAbbrev,
      year,
      volume,
      issue,
      pages,
      pmid,
      doi,
      url: location.href
    };
  }

  api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || msg.type !== "GET_CITATION_DATA") return;

    try {
      if (!/pubmed\.ncbi\.nlm\.nih\.gov$/.test(location.hostname)) {
        sendResponse({ ok: false, errorCode: "UNSUPPORTED_SITE" });
        return;
      }

      // URL-based hint: PubMed article detail is usually /<PMID>/
      const urlLooksLikeArticle = /^\/\d+\/?$/.test(location.pathname);

      const data = extract();

      // 최소 필수: title 또는 authors가 있어야 "논문 페이지"로 간주
      const hasCore = !!data.title || (Array.isArray(data.authors) && data.authors.length > 0);
      if (!hasCore) {
        // PubMed 내이긴 한데, 논문 상세가 아닌 경우(검색/목록/기타 페이지)
        // 단, URL이 논문 상세처럼 보이면 구조 변경 가능성으로 분류
        sendResponse({ ok: false, errorCode: urlLooksLikeArticle ? "SITE_CHANGED" : "NO_ARTICLE" });
        return;
      }

      // title이 비어있으면 인용 생성이 어렵다
      if (!data.title) {
        sendResponse({ ok: false, errorCode: "PARSE_FAILED" });
        return;
      }

      sendResponse({ ok: true, data });
    } catch (e) {
      console.error("[PCH content] error:", e);
      sendResponse({ ok: false, errorCode: "UNKNOWN" });
    }

    return true;
  });
})();