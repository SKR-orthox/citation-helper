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
  const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
  for (const scriptTag of scripts) {
    try {
      const json = JSON.parse(scriptTag.textContent);

      const candidates = [];
      if (Array.isArray(json)) {
        candidates.push(...json);
      } else if (json['@graph'] && Array.isArray(json['@graph'])) {
        candidates.push(...json['@graph']);
      } else {
        candidates.push(json);
      }

      for (const item of candidates) {
        const t = item['@type'];
        const types = Array.isArray(t) ? t : [t];
        if (types.includes('ScholarlyArticle') || types.includes('Article')) {
          const title = item.headline || item.name || "";
          let authors = [];

          if (item.author) {
            const authArr = Array.isArray(item.author) ? item.author : [item.author];
            authors = authArr
              .map(a => (typeof a === "string" ? a : a.name))
              .filter(Boolean);
          }

          if (title || authors.length > 0) {
            return { title, authors };
          }
        }
      }
    } catch (e) {
      // 개발 중에는 콘솔 찍어보고, 배포 시에는 묵살하는 식으로
      // console.warn("[PCH] JSON-LD parse error", e);
    }
  }
  return { title: "", authors: [] };
}

function cleanAuthorName(raw) {
  if (!raw) return "";

  let name = raw.replace(/\s+/g, " ").trim();

  // 1) 아예 버려야 할 것들 (Google Scholar 같은 링크 텍스트)
  const lower = name.toLowerCase();
  if (lower.includes("google scholar") || lower.includes("mendeley")) {
    return "";
  }

  // 2) 숫자나 특수기호(각주, 메일 아이콘 등)가 나오기 전까지만 사용
  //    예: "Felipe Opazo 4 5 6 8 @" -> "Felipe Opazo"
  name = name.split(/[\d*@†‡]/)[0].trim();

  // 3) 끝에 붙은 ,. 등 정리
  name = name.replace(/[.,;:]+$/g, "").trim();

  return name;
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
// 4. WOS, Scopus, Google Scholar, ScienceDirect 등 공용 추출 함수
// ----------------------------------------------------
function extractGeneral(doc) {
    // 1) JSON-LD 우선
    let { title: jsonLdTitle, authors: jsonLdAuthors } = extractFromJSONLD(doc);

    // 2) 메타 태그 기반 저자들
    const metaAuthors       = getMetas(doc, "citation_author");
    const dcAuthorsUpper    = getMetas(doc, "DC.Creator");
    const dcAuthorsLower1   = getMetas(doc, "dc.Creator");
    const dcAuthorsLower2   = getMetas(doc, "dc.creator");
    const simpleMetaAuthor  = getMeta(doc, "author"); // 일부 사이트에서 한 명만 넣는 경우

    // 3) DOM에서 저자 텍스트를 한 번 더 시도 (ScienceDirect 포함)
    let domAuthors = [];
    const authorSelectors = [
        'a[data-aa-name="author-name"]',
        'a.author',
        'span.authorName',
        // ScienceDirect 계열: 상단 저자 링크들 전체를 포괄
        'a[href*="/science/article/pii/"][aria-label*="author"]',
        'a[href*="author"]'
    ];

    for (const sel of authorSelectors) {
        const els = Array.from(doc.querySelectorAll(sel));
        if (els.length > 0) {
            domAuthors = els.map(el => el.textContent.trim()).filter(Boolean);
            if (domAuthors.length > 0) break;
        }
    }

    // 최종 저자 목록: JSON-LD + 다양한 meta + DOM 추출 결과 합치기
    const finalAuthors = [
        ...new Set([
            ...jsonLdAuthors,
            ...metaAuthors,
            ...dcAuthorsUpper,
            ...dcAuthorsLower1,
            ...dcAuthorsLower2,
            ...(simpleMetaAuthor ? [simpleMetaAuthor] : []),
            ...domAuthors
        ])
    ].filter(Boolean);

    // 저자 이름 클린업 (숫자, 아이콘, Google Scholar 등 제거)
    const cleanedAuthors = [
    ...new Set(
        finalAuthors
        .map(cleanAuthorName)
        .filter(Boolean)
    )
    ];

    // 4) 제목
    const metaTitle = getMeta(doc, "citation_title");
    const dcTitle   = getMeta(doc, "DC.title");
    const domTitle  =
        doc.querySelector("h1")?.textContent.trim() ||
        doc.querySelector("h2")?.textContent.trim() ||
        "";

    const title = jsonLdTitle || metaTitle || dcTitle || domTitle;

    // 5) 저널명
    const journalFull =
        getMeta(doc, "citation_journal_title") ||
        getMeta(doc, "PRISM.publicationName") ||
        "";
    const journalAbbrev = getMeta(doc, "citation_journal_abbrev");

    // 6) 연도 (ScienceDirect에서 자주 쓰는 패턴들을 다 시도 + 마지막에 본문에서 숫자 뽑기)
    const year =
        getMeta(doc, "citation_year") ||
        (getMeta(doc, "citation_date") || "").substring(0, 4) ||
        (getMeta(doc, "citation_publication_date") || "").substring(0, 4) ||
        (getMeta(doc, "citation_online_date") || "").substring(0, 4) ||
        (getMeta(doc, "DC.Date") || "").substring(0, 4) ||
        (getMeta(doc, "dc.date") || "").substring(0, 4) ||
        // 마지막 수단: 본문에서 19xx 또는 20xx를 하나 찾아서 사용
        ((doc.body.textContent.match(/\b(19|20)\d{2}\b/) || [])[0] || "");

    // 7) 페이지 / 권 / 호
    const firstPage = getMeta(doc, "citation_firstpage");
    const lastPage  = getMeta(doc, "citation_lastpage");
    const pages =
        firstPage && lastPage
            ? `${firstPage}-${lastPage}`
            : (firstPage || "");

    const volume = getMeta(doc, "citation_volume");
    const issue  = getMeta(doc, "citation_issue");

    return {
        authors: cleanedAuthors,
        title,
        journalFull,
        journalAbbrev,
        year,
        volume,
        issue,
        pages,
        pmid: getMeta(doc, "citation_pmid")
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
    } else if (
        hostname.includes("scholar.google.com") ||
        hostname.includes("webofscience.com") ||
        hostname.includes("scopus.com") ||
        hostname.includes("sciencedirect.com") ||   // Elsevier
        hostname.includes("cell.com") ||            // Cell Press
        hostname.includes("thelancet.com")          // The Lancet
    ) {
        data = extractGeneral(doc);
    } else {
        return null;
    }

    // ---------- 여기부터 추가 / 수정 ----------
    const isScienceDirect = hostname.includes("sciencedirect.com");

    // 디버그용 로그 (한 번 찍어보기)
    console.log("[PCH] Raw citation data:", hostname, data);

    // 필수 필드 체크 (도메인별 기준 분리)
    if (!data || !data.title) {
        console.warn("[PCH] No title, giving up.", hostname, data);
        return null;
    }

    // ScienceDirect 말고는 기존 기준 그대로
    if (!isScienceDirect) {
        if (!data.authors || data.authors.length === 0 || !data.year) {
            console.warn("[PCH] Final check failed (non-ScienceDirect).", hostname, data);
            return null;
        }
    }
    // ScienceDirect는 일단 제목만 있으면 통과시킴
    // (저자/연도는 있으면 쓰고, 없으면 빈 값인 채로 넘어감)

    // 최종 데이터 객체 구성 (누락 필드는 빈 문자열로)
    const pagesStr = (data.pages || "").toString();
    const [fp = "", lp = ""] = pagesStr.split("-");

    return {
        authors: data.authors || [],
        title: data.title || "",
        journalFull: data.journalFull || "",
        journalAbbrev: data.journalAbbrev || "",
        year: data.year || "",
        volume: data.volume || "",
        issue: data.issue || "",
        firstPage: fp,
        lastPage: lp,
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
    if (
      !data &&
      (
        location.hostname.includes("webofscience.com") ||
        location.hostname.includes("scopus.com") ||
        location.hostname.includes("scholar.google.com") ||
        location.hostname.includes("nature.com") ||
        location.hostname.includes("sciencedirect.com")   // ← 여기만 추가
      )
    ) {
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