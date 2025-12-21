(() => {
  const U = window.PCH && window.PCH.util;
  if (!U) return;

  function stripDoiPrefix(doi) {
    const v = U.safeText(doi);
    return v.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, "");
  }

  window.PCH.formatters.bibtex = (data) => {
    const authors = Array.isArray(data.authors)
      ? data.authors.map(a => U.safeText(a)).filter(Boolean)
      : [];

    const title = U.safeText(data.title);

    // `journalFull`은 “컨테이너 이름”으로 취급(저널명 또는 책 제목)
    const container = U.safeText(data.journalFull || data.journalAbbrev || "");

    const year = U.safeText(data.year || U.yearOf(data));
    const volume = U.safeText(data.volume || "");
    const number = U.safeText(data.issue || "");
    const pages = U.safeText(data.pages || "");
    const doi = stripDoiPrefix(data.doi || "");
    const url = U.safeText(data.url || "");
    const pmid = U.safeText(data.pmid || "");
    const publisher = U.safeText(data.publisher || "");

    // chapter 판정: URL 휴리스틱 + (있으면) type 힌트
    const isChapter =
      /\/chapter\//i.test(url) ||
      U.safeText(data.type || "").toLowerCase() === "chapter";

    const key =
      (authors[0] ? authors[0].split(/\s+/).slice(-1)[0] : (isChapter ? "chapter" : "article")) +
      (year || "") +
      (container ? container.replace(/\W+/g, "").slice(0, 16) : "");

    const lines = [];

    const entryType = isChapter ? "incollection" : "article";
    lines.push(`@${entryType}{${key || entryType},`);

    if (authors.length) lines.push(`  author = {${authors.join(" and ")}},`);
    if (title) lines.push(`  title = {${title}},`);

    if (container) {
      if (isChapter) lines.push(`  booktitle = {${container}},`);
      else lines.push(`  journal = {${container}},`);
    }

    // publisher는 chapter에서 있으면 넣기(없어도 OK)
    if (publisher && isChapter) lines.push(`  publisher = {${publisher}},`);

    if (year) lines.push(`  year = {${year}},`);
    if (volume && !isChapter) lines.push(`  volume = {${volume}},`);
    if (number && !isChapter) lines.push(`  number = {${number}},`);
    if (pages) lines.push(`  pages = {${pages}},`);
    if (doi) lines.push(`  doi = {${doi}},`);
    if (url) lines.push(`  url = {${url}},`);
    if (pmid) lines.push(`  note = {PMID: ${pmid}},`);

    // 마지막 콤마 제거
    if (lines.length > 1) lines[lines.length - 1] = lines[lines.length - 1].replace(/,\s*$/, "");
    lines.push("}");
    return lines.join("\n");
  };
})();