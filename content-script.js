// content-script.js - Stability Improvement Update (Nature.com DOM Fix)

const api = typeof browser !== "undefined" ? browser : chrome;

console.log("[PCH] content script loaded:", location.href);

// ----------------------------------------------------
// 1. 공통 메타데이터 및 JSON-LD 추출 함수 (유지)
// ----------------------------------------------------

function getMeta(doc, name) {
  const el = doc.querySelector(`meta[name="${name}"]`);
  return el ? el.content.trim() : "";
}

function getMetas(doc, name) {
  const els = doc.querySelectorAll(`meta[name="${name}"]`);
  return Array.from(els).map(el => el.content.trim()).filter(Boolean);
}

function extractFromJSONLD(doc) {
    const scriptTag = doc.querySelector('script[type="application/ld+json"]');
    if (scriptTag) {
        try {
            const json = JSON.parse(scriptTag.textContent);
            if (json['@type'] === 'ScholarlyArticle' || json['@type'] === 'Article') {
                const title = json.headline || json.name || "";
                let authors = [];
                if (json.author) {
                    authors = Array.isArray(json.author) 
                        ? json.author.map(a => a.name).filter(Boolean)
                        : (json.author.name ? [json.author.name] : []);
                }
                return { title, authors };
            }
        } catch (e) {
            // console.error("[PCH] JSON-LD parsing error:", e); // 디버그 목적
        }
    }
    return { title: "", authors: [] };
}


// ----------------------------------------------------
// 2. PubMed 전용 추출 함수 (유지)
// ----------------------------------------------------

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
    const year = getMeta(doc, "citation_year") || (doc.body.textContent.match(/\b(19|20)\d{2}\b/) || [])[0] || "";
    
    const firstPage = getMeta(doc, "citation_firstpage");
    const lastPage = getMeta(doc, "citation_lastpage");
    const pages = firstPage && lastPage ? `${firstPage}-${lastPage}` : (firstPage || "");
    const pmid = getMeta(doc, "citation_pmid") || (location.pathname.match(/\/(\d+)\//) || [])[1] || "";
    const volume = getMeta(doc, "citation_volume");
    const issue = getMeta(doc, "citation_issue");
    
    return { authors, title, journalFull, journalAbbrev, year, volume, issue, pages, pmid };
}


// ----------------------------------------------------
// 3. Nature.com 전용 추출 함수 (새로 추가)
// ----------------------------------------------------
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


// ----------------------------------------------------
// 4. WOS, Scopus, Google Scholar 일반 추출 함수
// ----------------------------------------------------
function extractGeneral(doc) {
    let { title: jsonLdTitle, authors: jsonLdAuthors } = extractFromJSONLD(doc);
    
    const metaAuthors = getMetas(doc, "citation_author");
    const metaTitle = getMeta(doc, "citation_title");
    
    // H1, H2 태그에서 제목 추출 (대부분의 사이트에서 제목을 포함할 가능성 높음)
    const domTitle = doc.querySelector("h1")?.textContent.trim() || doc.querySelector("h2")?.textContent.trim() || "";
    
    const finalAuthors = [...new Set([...jsonLdAuthors, ...metaAuthors])].filter(Boolean);
    
    const journalFull = getMeta(doc, "citation_journal_title");
    const journalAbbrev = getMeta(doc, "citation_journal_abbrev");
    const year = getMeta(doc, "citation_year") || getMeta(doc, "citation_date")?.substring(0, 4) || "";
    
    const firstPage = getMeta(doc, "citation_firstpage");
    const lastPage = getMeta(doc, "citation_lastpage");
    const pages = firstPage && lastPage ? `${firstPage}-${lastPage}` : (firstPage || "");

    const volume = getMeta(doc, "citation_volume");
    const issue = getMeta(doc, "citation_issue");
    
    return { 
        authors: finalAuthors, 
        title: jsonLdTitle || metaTitle || domTitle, 
        journalFull, journalAbbrev, year, volume, issue, pages, pmid: getMeta(doc, "citation_pmid") 
    };
}


// ----------------------------------------------------
// 5. 메인 데이터 구축 로직 (도메인 분기)
// ----------------------------------------------------

function buildCitationData() {
    const doc = document;
    let data;
    const hostname = location.hostname;

    if (hostname.includes("pubmed.ncbi.nlm.nih.gov")) {
        data = extractFromPubMed(doc);
    } else if (hostname.includes("nature.com")) {
        data = extractFromNature(doc);
    } else if (hostname.includes("scholar.google.com") || hostname.includes("webofscience.com") || hostname.includes("scopus.com")) {
        data = extractGeneral(doc);
    } else {
        return null;
    }

    // 필수 필드 검증: 제목, 저자, 연도만 필수 (가장 관대한 조건)
    if (!data.title || data.authors.length === 0 || !data.year) {
        console.warn(`[PCH] Final Check Failed on ${hostname}. Missing core data.`, data);
        return null; 
    }

    // 최종 데이터 객체 구성 (누락된 필드는 빈 문자열로 채움)
    return {
        authors: data.authors,
        title: data.title,
        journalFull: data.journalFull || "",
        journalAbbrev: data.journalAbbrev || "",
        year: data.year,
        volume: data.volume || "",
        issue: data.issue || "",
        firstPage: data.pages.split("-")[0] || "",
        lastPage: data.pages.split("-")[1] || "",
        pmid: data.pmid || ""
    };
}

// ----------------------------------------------------
// 6. 메시지 리스너와 재시도 로직 (유지)
// ----------------------------------------------------

function sendData(data, sendResponse) {
    sendResponse(data ? { ok: true, data } : { ok: false });
}

api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "GET_CITATION_DATA") {
    let data = buildCitationData();
    
    // 재시도 로직: 1초 후 재시도
    if (!data && (location.hostname.includes("webofscience.com") || location.hostname.includes("scopus.com") || location.hostname.includes("scholar.google.com") || location.hostname.includes("nature.com"))) {
        setTimeout(() => {
            console.log("[PCH] Retrying data extraction after 1000ms...");
            data = buildCitationData();
            sendData(data, sendResponse);
        }, 1000);
        return true; 
    }
    
    sendData(data, sendResponse);
    return true; 
  }
});