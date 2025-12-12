// formatters/apa7.js
window.PCH = window.PCH || {};
PCH.formatters = PCH.formatters || {};

PCH.formatters.apa7 = function (data) {
  const U = PCH.util;
  const authors = Array.isArray(data.authors)
    ? data.authors.map(U.safeText).filter(Boolean).join(", ")
    : "";
  const title = U.safeText(data.title);
  const journal = U.safeText(data.journalAbbrev || data.journalFull || data.journal || "");
  const year = U.safeText(data.year || "");
  const volume = U.safeText(data.volume || "");
  const issue = U.safeText(data.issue || "");
  const pages = U.makePages(data);
  const doi = U.safeText(data.doi || "").replace(/^doi:\s*/i, "");
  const url = U.safeText(data.url || "");

  let out = `${authors}. (${year}). ${title}. ${journal}`;
  if (volume) {
    out += `, ${volume}`;
    if (issue) out += `(${issue})`;
  }
  if (pages) out += `, ${pages}`;
  out += ".";

  if (doi) out += ` https://doi.org/${doi}`;
  else if (url) out += ` ${url}`;

  return U.tidyString(out);
};