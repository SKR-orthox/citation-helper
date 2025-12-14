(() => {
  const U = window.PCH && window.PCH.util;
  if (!U) return;

  function stripDoiPrefix(doi) {
    const v = U.safeText(doi);
    return v.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, "");
  }

  window.PCH.formatters.bibtex = (data) => {
    const authors = Array.isArray(data.authors) ? data.authors.map(a => U.safeText(a)).filter(Boolean) : [];
    const title = U.safeText(data.title);
    const journal = U.safeText(data.journalFull || data.journalAbbrev || "");
    const year = U.safeText(data.year || U.yearOf(data));
    const volume = U.safeText(data.volume || "");
    const number = U.safeText(data.issue || "");
    const pages = U.safeText(data.pages || "");
    const doi = stripDoiPrefix(data.doi || "");
    const url = U.safeText(data.url || "");
    const pmid = U.safeText(data.pmid || "");

    const key =
      (authors[0] ? authors[0].split(/\s+/).slice(-1)[0] : "article") +
      (year || "") +
      (journal ? journal.replace(/\W+/g, "").slice(0, 16) : "");

    const lines = [];
    lines.push(`@article{${key || "article"},`);
    if (authors.length) lines.push(`  author = {${authors.join(" and ")}},`);
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
})();