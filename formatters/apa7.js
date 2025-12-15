(() => {
  const U = window.PCH && window.PCH.util;
  if (!U) return;

  function stripDoiPrefix(doi) {
    const v = U.safeText(doi);
    return v
      .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
      .replace(/^doi:\s*/i, "");
  }

  // ✅ APA 7 저자 포맷 (21명 이상 처리)
  function apaAuthors(authors) {
    if (!Array.isArray(authors) || authors.length === 0) return "";

    const cleaned = authors.map(a => U.safeText(a)).filter(Boolean);

    // 20명 이하면 전원 표기
    if (cleaned.length <= 20) {
      return cleaned.join(", ");
    }

    // 21명 이상: 앞 19명 + … + 마지막 저자
    const first19 = cleaned.slice(0, 19);
    const last = cleaned[cleaned.length - 1];
    return `${first19.join(", ")}, …, ${last}`;
  }

  window.PCH.formatters.apa7 = (data) => {
    // Authors. (Year). Title. Journal, volume(issue), pages. https://doi.org/...
    const authors = apaAuthors(data.authorsAPA || data.authors);
    const year = U.safeText(data.year || U.yearOf(data));
    const title = U.safeText(data.title);
    const journal = U.safeText(data.journalFull || data.journalAbbrev || "");
    const volume = U.safeText(data.volume || "");
    const issue = U.safeText(data.issue || "");
    const pages = U.safeText(data.pages || "");
    const doi = stripDoiPrefix(data.doi || "");
    const url = U.safeText(data.url || "");

    let out = "";
    if (authors) {
      const a = U.safeText(authors);
      out += a.endsWith(".") ? `${a} ` : `${a}. `;
    }

    if (year) out += `(${year}). `;
    out += `${title}. ${journal}`;
    
    if (volume) {
      out += `, ${volume}`;
      if (issue) out += `(${issue})`;
    }
    
    if (pages) out += `, ${pages}`;
    out += ".";

    if (doi) out += ` https://doi.org/${doi}`;
    else if (url) out += ` ${url}`;

    return out.replace(/\s+/g, " ").trim();
  };
})();