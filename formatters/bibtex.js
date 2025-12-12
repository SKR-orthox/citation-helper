// formatters/bibtex.js
window.PCH = window.PCH || {};
PCH.formatters = PCH.formatters || {};

PCH.formatters.bibtex = function (data) {
  const U = PCH.util;
  const authorsArr = Array.isArray(data.authors) ? data.authors.map(U.safeText).filter(Boolean) : [];
  const title = U.safeText(data.title);
  const journal = U.safeText(data.journalAbbrev || data.journalFull || data.journal || "");
  const year = U.safeText(data.year || "");
  const volume = U.safeText(data.volume || "");
  const number = U.safeText(data.issue || "");
  const pages = U.makePages(data);
  const doi = U.safeText(data.doi || "").replace(/^doi:\s*/i, "");
  const url = U.safeText(data.url || "");
  const pmid = U.safeText(data.pmid || "");

  const keyBase =
    (authorsArr[0] ? authorsArr[0].split(/\s+/).slice(-1)[0] : "article") +
    (year ? year : "") +
    (journal ? journal.replace(/\W+/g, "").slice(0, 16) : "");
  const key = keyBase || "article";

  const lines = [];
  lines.push(`@article{${key},`);
  if (authorsArr.length) lines.push(`  author = {${authorsArr.join(" and ")}},`);
  if (title) lines.push(`  title = {${title}},`);
  if (journal) lines.push(`  journal = {${journal}},`);
  if (year) lines.push(`  year = {${year}},`);
  if (volume) lines.push(`  volume = {${volume}},`);
  if (number) lines.push(`  number = {${number}},`);
  if (pages) lines.push(`  pages = {${pages}},`);
  if (doi) lines.push(`  doi = {${doi}},`);
  if (url) lines.push(`  url = {${url}},`);
  if (pmid) lines.push(`  note = {PMID: ${pmid}},`);

  if (lines.length > 1) lines[lines.length - 1] = lines[lines.length - 1].replace(/,\s*$/, "");
  lines.push("}");
  return lines.join("\n");
};