function extractFromNature(doc) {
    let { title: jsonLdTitle, authors: jsonLdAuthors } = extractFromJSONLD(doc);
    
    // Nature.com 특화 DOM 선택자
    const title = jsonLdTitle || doc.querySelector('h1.c-article-title')?.textContent.trim() || "";
    
    // 저자 목록 (jsonLd가 실패했을 때 대비 - DOM 구조가 복잡할 수 있음)
    let authors = jsonLdAuthors;
    if (authors.length === 0) {
        authors = Array.from(doc.querySelectorAll('li.c-author-list__item > a[data-track-action="author name"]'))
                    .map(a => a.textContent.trim())
                    .filter(Boolean);
    }

    // Journal, Year, Volume 추출 시도
    const journalEl = doc.querySelector('.c-article-header .c-article-info-details__title');
    const journalFull = journalEl ? journalEl.textContent.trim() : "";
    const yearEl = doc.querySelector('time[datetime]');
    const year = yearEl ? yearEl.getAttribute('datetime').substring(0, 4) : getMeta(doc, "citation_year");

    // 일반 메타데이터에서 나머지 정보 추출
    const generalData = extractGeneral(doc);

    return { 
        ...generalData, 
        authors: authors.length > 0 ? authors : generalData.authors,
        title: title || generalData.title,
        journalFull: journalFull || generalData.journalFull,
        year: year || generalData.year
    };
}