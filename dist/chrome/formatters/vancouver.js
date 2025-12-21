(() => {
  const U = window.PCH && window.PCH.util;
  if (!U) return;

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

    const sep = (typeof U.authorJoiner === "function")
      ? U.authorJoiner(cleaned)
      : (cleaned.some(a => a.includes(",")) ? "; " : ", ");

    if (cleaned.length > VANCOUVER_MAX_AUTHORS) {
      const suffix = (sep.trim() === ";") ? "; et al" : ", et al";
      return cleaned.slice(0, VANCOUVER_MAX_AUTHORS).join(sep) + suffix;
}

return cleaned.join(sep);
  }

  window.PCH.formatters.vancouver = (data) => {
    const authors = vancouverAuthors(data.authorsVancouver || data.authors);
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