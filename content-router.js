function buildCitationData() {
    
  const doc = document;
  let data;
  const hostname = location.hostname;
  let errorCode = null;

  if (hostname.includes("pubmed.ncbi.nlm.nih.gov")) {
    data = extractFromPubMed(doc);
  } else if (hostname.includes("nature.com")) {
    data = extractFromNature(doc);
    } else if (
    hostname.includes("scholar.google.com") ||
    hostname.includes("webofscience.com") ||
    hostname.includes("scopus.com") ||
    hostname.includes("sciencedirect.com") ||
    hostname.includes("link.springer.com") ||
    hostname.includes("wiley.com")
) {
    data = extractGeneral(doc);
  } else {
    // 아예 지원하지 않는 사이트
    errorCode = "UNSUPPORTED_SITE";
    return { errorCode };
  }

    const isScienceDirect = hostname.includes("sciencedirect.com");

    console.log("[PCH] Raw citation data:", hostname, data);

    // 타이틀이 없으면 거의 논문이 아닌 페이지로 판단
    if (!data || !data.title) {
        console.warn("[PCH] No title, giving up.", hostname, data);
        errorCode = "NO_ARTICLE";
        return { errorCode };
    }

    // ScienceDirect만 예외, 나머지는 저자+연도 필수
    if (!isScienceDirect) {
        if (!data.authors || data.authors.length === 0 || !data.year) {
        console.warn("[PCH] Final check failed (non-ScienceDirect).", hostname, data);

        // 동적 로딩/로그인 의존 사이트는 따로 표시
        if (
            hostname.includes("webofscience.com") ||
            hostname.includes("scopus.com") ||
            hostname.includes("scholar.google.com")
        ) {
            errorCode = "DYNAMIC_SITE";
        } else {
            errorCode = "NO_ARTICLE";
        }

        return { errorCode };
        }
    }

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
    pmid: data.pmid || "",
    errorCode: null
  };
}

// ----------------------------------------------------
// 6. 메시지 리스너와 재시도 로직 (유지)
// ----------------------------------------------------

function sendData(result, sendResponse) {
  if (result && !result.errorCode) {
    // 정상적으로 citation 데이터를 얻은 경우
    sendResponse({ ok: true, data: result });
  } else {
    // 실패한 경우 (UNSUPPORTED_SITE, NO_ARTICLE, DYNAMIC_SITE 등)
    sendResponse({
      ok: false,
      errorCode: result && result.errorCode ? result.errorCode : "UNKNOWN_ERROR"
    });
  }
}

api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "GET_CITATION_DATA") {
    let data = buildCitationData();
    const hostname = location.hostname;

    // 재시도 로직: 1초 후 재시도
    if (
      (!data || data.errorCode === "NO_ARTICLE") &&   // 논문 감지를 못했을 때만 재시도
      (
        hostname.includes("webofscience.com") ||
        hostname.includes("scopus.com") ||
        hostname.includes("scholar.google.com") ||
        hostname.includes("nature.com") ||
        hostname.includes("sciencedirect.com") ||
        hostname.includes("link.springer.com") ||
        hostname.includes("onlinelibrary.wiley.com")
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