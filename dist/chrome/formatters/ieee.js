(() => {
  const U = window.PCH && window.PCH.util;
  if (!U) return;

  function stripDoiPrefix(doi) {
    const v = U.safeText(doi);
    return v.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, "");
  }

  window.PCH.formatters.ieee = (data) => {
    // Authors, "Title," Journal, vol. X, no. Y, pp. Z, Year, doi:...
    const authors = U.joinAuthors(data.authorsIEEE || data.authors);
    const title = U.safeText(data.title);
    const journal = U.safeText(data.journalAbbrev || data.journalFull || "");
    const volume = U.safeText(data.volume || "");
    const issue = U.safeText(data.issue || "");
    const pages = U.safeText(data.pages || "");
    const year = U.safeText(data.year || U.yearOf(data));
    const doi = stripDoiPrefix(data.doi || "");
    const url = U.safeText(data.url || "");

    let out = "";
    if (authors) out += `${authors}, `;
    out += `"${title}," ${journal}`;

    if (volume) out += `, vol. ${volume}`;
    if (issue) out += `, no. ${issue}`;
    if (pages) out += `, pp. ${pages}`;
    if (year) out += `, ${year}`;
    if (doi) out += `, doi:${doi}`;
    else if (url) out += `, ${url}`;
    out += ".";

    return out.replace(/\s+/g, " ").trim();
  };
})();