(() => {
  const U = window.PCH && window.PCH.util;
  if (!U) return;

  // ✅ 옵션: Vancouver 저자 6명 초과 시 et al.
  const VANCOUVER_MAX_AUTHORS = 6;

  function stripDoiPrefix(doi) {
    const v = U.safeText(doi);
    return v
      .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
      .replace(/^doi:\s*/i, "");
  }

  function vancouverAuthors(authors) {
    if (!Array.isArray(authors)) return "";
    const cleaned = authors.map(a => U.safeText(a)).filter(Boolean);

    if (cleaned.length === 0) return "";

    // 7명 이상이면 6명까지만 + et al.
    if (cleaned.length > VANCOUVER_MAX_AUTHORS) {
      return cleaned.slice(0, VANCOUVER_MAX_AUTHORS).join(", ") + ", et al";
    }

    return cleaned.join(", ");
  }

  window.PCH.formatters.vancouver = (data) => {
    const authors = vancouverAuthors(data.authorsVancouver || data.authors);;
    const title = U.safeText(data.title);
    const journal = U.safeText(data.journalAbbrev || data.journalFull || "");
    const year = U.safeText(data.year || U.yearOf(data));
    const volume = U.safeText(data.volume || "");
    const issue = U.safeText(data.issue || "");
    const pages = U.safeText(data.pages || "");
    const pmid = U.safeText(data.pmid || "");
    const doi = stripDoiPrefix(data.doi || "");

    let out = "";
    if (authors) out += `${authors}. `;
    out += `${title}. ${journal}. ${year}`;

    if (volume) {
      out += `;${volume}`;
      if (issue) out += `(${issue})`;
    }
    if (pages) out += `:${pages}`;
    out += ".";

    if (doi) out += ` doi:${doi}.`;
    if (pmid) out += ` PMID: ${pmid}.`;

    return out.replace(/\s+/g, " ").trim();
  };
})();