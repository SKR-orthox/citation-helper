(() => {
  const U = window.PCH && window.PCH.util;
  if (!U) return;

  function stripDoiPrefix(doi) {
    const v = U.safeText(doi);
    return v
      .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
      .replace(/^doi:\s*/i, "")
      .trim();
  }

  function year4FromAny(data) {
    const candidates = [
      U.safeText(data?.year || ""),
      U.safeText(data?.date || ""),
      U.safeText(data?.publishedDate || "")
    ]
      .filter(Boolean)
      .join(" ");

    const m = candidates.match(/\b(19\d{2}|20\d{2}|21\d{2})\b/);
    return m ? m[1] : "";
  }

  function guessRisType(data) {
    const url = U.safeText(data?.url || "");
    const hinted = U.safeText(data?.type || "").toLowerCase();

    if (hinted === "chapter") return "CHAP";
    if (/\/chapter\//i.test(url)) return "CHAP";
    return "JOUR";
  }

  function splitAlphaNum(s) {
    const v = U.safeText(s);
    const m = v.match(/^([^0-9]*)([0-9]+)(.*)$/);
    if (!m) return { prefix: "", num: "", suffix: v };
    return { prefix: m[1] || "", num: m[2] || "", suffix: m[3] || "" };
  }

  // - 20-2 -> 20-22
  // - 1389-99 -> 1389-1399
  // - e1389-99 -> e1389-e1399
  function expandEndPage(startRaw, endRaw) {
    const a = splitAlphaNum(startRaw);
    const b = splitAlphaNum(endRaw);

    // end 쪽에 별도 prefix/suffix가 있으면 그대로 사용
    if ((b.prefix && b.prefix !== a.prefix) || b.suffix) return U.safeText(endRaw);

    if (!b.num) return U.safeText(endRaw);

    const prefix = b.prefix || a.prefix || "";

    if (a.num && b.num && b.num.length < a.num.length) {
      const keep = a.num.slice(0, a.num.length - b.num.length);
      return `${prefix}${keep}${b.num}`;
    }

    return `${prefix}${b.num}`;
  }

  function parsePages(pages) {
    const v = U.safeText(pages).replace(/\s+/g, "");
    if (!v) return { sp: "", ep: "" };

    const idx = v.indexOf("-");
    if (idx === -1) return { sp: v, ep: "" };

    const sp = v.slice(0, idx);
    const rawEp = v.slice(idx + 1);
    if (!sp || !rawEp) return { sp: v, ep: "" };

    const ep = expandEndPage(sp, rawEp);
    return { sp, ep };
  }

  function risLine(tag, value) {
    const v = U.safeText(value).replace(/[\r\n]+/g, " ").trim();
    if (!v) return "";
    return `${tag}  - ${v}`;
  }

  window.PCH.formatters.ris = (data) => {
    const d = data || {};

    // 최소 필수: title
    const title = U.safeText(d.title || "");
    if (!title) return "";

    const ty = guessRisType(d);
    const isChapter = (ty === "CHAP");

    const authors = Array.isArray(d.authors)
      ? d.authors.map(a => U.safeText(a)).filter(Boolean)
      : [];

    const container = U.safeText(d.journalFull || d.journalAbbrev || "");
    const year = year4FromAny(d) || U.safeText(d.year || U.yearOf?.(d) || "");
    const volume = U.safeText(d.volume || "");
    const issue = U.safeText(d.issue || "");
    const doi = stripDoiPrefix(d.doi || "");
    const url = U.safeText(d.url || "");
    const pmid = U.safeText(d.pmid || "");
    const { sp, ep } = parsePages(d.pages || "");

    const lines = [];
    lines.push(`TY  - ${ty}`);

    const ti = risLine("TI", title);
    if (ti) lines.push(ti);

    for (const a of authors) {
      const au = risLine("AU", a);
      if (au) lines.push(au);
    }

    if (container) {
      const tag = isChapter ? "BT" : "JO";
      const ct = risLine(tag, container);
      if (ct) lines.push(ct);
    }

    const py = risLine("PY", year);
    if (py) lines.push(py);

    if (!isChapter) {
      const vl = risLine("VL", volume);
      if (vl) lines.push(vl);
      const is = risLine("IS", issue);
      if (is) lines.push(is);
    }

    const spLine = risLine("SP", sp);
    if (spLine) lines.push(spLine);
    const epLine = risLine("EP", ep);
    if (epLine) lines.push(epLine);

    const doLine = risLine("DO", doi);
    if (doLine) lines.push(doLine);

    // PMID 정책: AN에 고정
    const anLine = risLine("AN", pmid);
    if (anLine) lines.push(anLine);

    const urLine = risLine("UR", url);
    if (urLine) lines.push(urLine);

    lines.push("ER  -");
    return lines.join("\n");
  };
})();