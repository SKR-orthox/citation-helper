// formatters/vancouver.js
window.PCH = window.PCH || {};
PCH.formatters = PCH.formatters || {};

PCH.formatters.vancouver = function (data) {
  const U = PCH.util;
  const authors = Array.isArray(data.authors) ? data.authors.map(U.safeText).filter(Boolean).join(", ") : "";
  const title = U.safeText(data.title);
  const journal = U.safeText(data.journalAbbrev || data.journalFull || data.journal || "");
  const year = U.safeText(data.year || "");
  const volume = U.safeText(data.volume || "");
  const issue = U.safeText(data.issue || "");
  const pages = U.makePages(data);
  const pmid = U.safeText(data.pmid || "");

  let out = `${authors}. ${title}. ${journal}. ${year}`;
  if (volume) {
    out += `;${volume}`;
    if (issue) out += `(${issue})`;
  }
  if (pages) out += `:${pages}`;
  out += ".";
  if (pmid) out += ` PMID: ${pmid}.`;
  return U.tidyString(out);
};