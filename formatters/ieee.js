// formatters/ieee.js
window.PCH = window.PCH || {};
PCH.formatters = PCH.formatters || {};

PCH.formatters.ieee = function (data) {
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

  let out = `${authors}, "${title}," ${journal}`;
  if (volume) out += `, vol. ${volume}`;
  if (issue) out += `, no. ${issue}`;
  if (pages) out += `, pp. ${pages}`;
  if (year) out += `, ${year}`;
  if (doi) out += `, doi:${doi}`;
  else if (url) out += `, ${url}`;
  out += ".";

  return U.tidyString(out);
};