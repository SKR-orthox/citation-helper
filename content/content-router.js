async function buildCitationData() {
    
  const doc = document;
  let data;
  const hostname = location.hostname;
  let errorCode = null;

  if (hostname.includes("pubmed.ncbi.nlm.nih.gov")) {
    data = extractFromPubMed(doc);
  } else if (hostname.includes("nature.com")) {
    data = extractFromNature(doc);
  } else if (
    hostname.includes("journals.plos.org") ||
    hostname.includes("plos.org")
  ) {
    data = extractFromPLOS(doc);

  } else if (
    hostname.includes("tandfonline.com") ||
    hostname.includes("taylorandfrancis.com")
  ) {
    data = extractFromTandF(doc);

  } else if (
    hostname.includes("scholar.google.com") ||
    hostname.includes("webofscience.com") ||
    hostname.includes("scopus.com") ||
    hostname.includes("sciencedirect.com") ||
    hostname.includes("link.springer.com") ||
    hostname.includes("wiley.com") ||
    hostname.includes("academic.oup.com") ||
    hostname.includes("cambridge.org") ||
    hostname.includes("koreascience.or.kr") ||
    hostname.includes("jstage.jst.go.jp")
  ) {
    data = extractGeneral(doc);
  }
  else {
    // ✅ 사이트별 하드코딩이 없는 사이트도 최대한 동작하도록
    // 1) 일반 메타태그/JSON-LD 기반으로 1차 추출
    // 2) 부족하면 DOI → Crossref로 복구
    // (DOI도 없고 메타도 없으면 아래에서 NO_ARTICLE 처리됨)
    data = extractGeneral(doc);
  }

    console.log("[PCH] Raw citation data:", hostname, data);

    // 타이틀이 없으면 거의 논문이 아닌 페이지로 판단
    // 1) 1차 추출이 실패하면 DOI로 복구 시도
    const rawDOI = (data && data.doi) ? data.doi : extractDOI(doc);

    async function fetchCrossrefByDOI(doi) {
      return new Promise((resolve) => {
        api.runtime.sendMessage({ type: "FETCH_CROSSREF", doi }, (resp) => {
          if (api.runtime && api.runtime.lastError) {
            console.warn("[PCH] background message error:", api.runtime.lastError);
            resolve(null);
            return;
          }
          if (resp && resp.ok && resp.data) resolve(resp.data);
          else resolve(null);
        });
      });
    }

    // title이 없거나, 저자/연도가 부족하면 DOI 복구를 시도
    const isScienceDirect = hostname.includes("sciencedirect.com");

    const authorCount = Array.isArray(data?.authors) ? data.authors.length : 0;

    const weakData =
      (!data || !data.title) ||
      (!data.year) ||
      (authorCount === 0) ||
      // ScienceDirect는 저자 1명만 잡히는 케이스가 있어서, 2명 미만이면 Crossref로 보정
      (isScienceDirect && authorCount < 2);

    if (weakData && rawDOI) {
      console.log("[PCH] Trying Crossref fallback with DOI:", rawDOI);
      const recovered = await fetchCrossrefByDOI(rawDOI);
      if (recovered) {
        // 기존 data 위에 덮어쓰기 (기존 값이 있으면 우선, 없으면 recovered 채움)
        const curAuthors = Array.isArray(data?.authors) ? data.authors : [];
        const recAuthors = Array.isArray(recovered?.authors) ? recovered.authors : [];

        const bestAuthors =
          (curAuthors.length >= recAuthors.length && curAuthors.length > 0)
            ? curAuthors
            : recAuthors;

        data = {
          ...recovered,
          ...data,
          authors: bestAuthors,
          doi: rawDOI
        };
        console.log("[PCH] Crossref recovered data:", data);
      }
    }

    // 2) 그래도 타이틀이 없으면 포기
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
    let dataPromise = buildCitationData();

    dataPromise.then((data) => {
      const hostname = location.hostname;

      // 재시도 로직: 1초 후 재시도 (기존 유지)
      if (
        (!data || data.errorCode === "NO_ARTICLE") &&
        (
          hostname.includes("webofscience.com") ||
          hostname.includes("scopus.com") ||
          hostname.includes("scholar.google.com") ||
          hostname.includes("nature.com") ||
          hostname.includes("sciencedirect.com") ||
          hostname.includes("link.springer.com") ||
          hostname.includes("onlinelibrary.wiley.com") ||
          hostname.includes("tandfonline.com") ||
          hostname.includes("taylorandfrancis.com") ||
          hostname.includes("journals.plos.org") ||
          hostname.includes("plos.org") ||
          hostname.includes("academic.oup.com") ||
          hostname.includes("cambridge.org")
        )
      ) {
        setTimeout(() => {
          console.log("[PCH] Retrying data extraction after 1000ms...");
          buildCitationData().then((retryData) => {
            sendData(retryData, sendResponse);
          });
        }, 1000);
        return;
      }

      sendData(data, sendResponse);
    });
    return true;
  }
});