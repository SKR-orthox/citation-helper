function extractFromPubMed(doc) {
    let authors = getMetas(doc, "citation_author");
    if (authors.length === 0) {
        authors = [...doc.querySelectorAll("a.full-name")]
            .map(el => el.textContent.trim())
            .filter(Boolean);
    }

    const title = getMeta(doc, "citation_title") || doc.querySelector("h1")?.textContent.trim() || "";
    const journalFull = getMeta(doc, "citation_journal_title") || doc.querySelector(".journal-actions .journal")?.textContent.trim() || "";
    const journalAbbrev = getMeta(doc, "citation_journal_abbrev");
    const year = 
    getMeta(doc, "citation_year") ||
    (getMeta(doc, "citation_date") || "").substring(0, 4) ||
    (getMeta(doc, "dc.date") || "").substring(0, 4) ||
    (getMeta(doc, "dc.date.issued") || "").substring(0, 4) ||
    "";
    
    const firstPage = getMeta(doc, "citation_firstpage");
    const lastPage = getMeta(doc, "citation_lastpage");
    const pages = firstPage && lastPage ? `${firstPage}-${lastPage}` : (firstPage || "");
    const pmid = getMeta(doc, "citation_pmid") || (location.pathname.match(/\/(\d+)\//) || [])[1] || "";
    const volume = getMeta(doc, "citation_volume");
    const issue = getMeta(doc, "citation_issue");
    
    return { authors, title, journalFull, journalAbbrev, year, volume, issue, pages, pmid };
}