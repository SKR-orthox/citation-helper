// content-script.js - Stability Improvement Update (Nature.com DOM Fix)

const api = typeof browser !== "undefined" ? browser : chrome;

console.log("[PCH] content script loaded:", location.href);

function getMeta(doc, name) {
  const el = doc.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
  return el ? el.content.trim() : "";
}

function getMetas(doc, name) {
  const els = doc.querySelectorAll(`meta[name="${name}"], meta[property="${name}"]`);
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
              .map(a => {
                if (!a) return "";
                if (typeof a === "string") return a.trim();
                if (a.name) return String(a.name).trim();

                const given  = (a.givenName || a.given || "").toString().trim();
                const family = (a.familyName || a.family || "").toString().trim();
                return `${given} ${family}`.trim();
              })
              .filter(Boolean);
          }

          if (title || authors.length > 0) {
            // content-general.js 호환용으로 author/authors 둘 다 제공
            return { title, authors, author: authors };
          }
        }
      }
    } catch (e) {
      // 개발 중에는 콘솔 찍어보고, 배포 시에는 묵살하는 식으로
      // console.warn("[PCH] JSON-LD parse error", e);
    }
  }
  return { title: "", authors: [], author: [] };
}

function cleanAuthorName(raw) {
  if (!raw) return "";

  let name = raw.replace(/\s+/g, " ").trim();

  const lower = name.toLowerCase();
  // 메뉴/서비스 텍스트들 걸러내기
  const bannedFragments = [
    "google scholar",
    "mendeley",
    "publish with us",
    "publish your research",
    "reprints and permissions",
    "author information",
    "language editing",
    "search for more papers",
    "content from these authors",
    "content from the authors"
  ];
  if (bannedFragments.some(k => lower.includes(k))) {
    return "";
  }

  // 숫자/각주/메일 아이콘 같은 것 나오기 전까지만 사용
  name = name.split(/[\d*@†‡]/)[0].trim();

  // 끝에 붙은 . , ; : 정리
  name = name.replace(/[.,;:]+$/g, "").trim();

  return name;
}

function extractDOI(doc) {
  // 1) meta 기반
  let doi =
    getMeta(doc, "citation_doi") ||
    getMeta(doc, "prism.doi") ||
    getMeta(doc, "dc.identifier") ||
    getMeta(doc, "og:doi") ||
    "";

  // 2) JSON-LD 기반 (identifier / DOI)
  if (!doi) {
    const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
    for (const s of scripts) {
      try {
        const json = JSON.parse(s.textContent);
        const nodes = [];
        if (Array.isArray(json)) nodes.push(...json);
        else if (json && Array.isArray(json["@graph"])) nodes.push(...json["@graph"]);
        else if (json) nodes.push(json);

        for (const node of nodes) {
          const id = node && node.identifier;
          if (!id) continue;

          // identifier: "10.xxx/yyy" 또는 배열/객체일 수 있음
          const candidates = Array.isArray(id) ? id : [id];
          for (const c of candidates) {
            if (typeof c === "string" && c.includes("10.")) {
              doi = c;
              break;
            }
            if (c && typeof c === "object") {
              const v = c.value || c["propertyID"] || c.DOI || c.doi;
              if (typeof v === "string" && v.includes("10.")) {
                doi = v;
                break;
              }
              if (typeof c.value === "string" && c.value.includes("10.")) {
                doi = c.value;
                break;
              }
            }
          }
          if (doi) break;
        }
        if (doi) break;
      } catch (e) {}
    }
  }

  // 3) doi.org 링크 기반
  if (!doi) {
    const a = doc.querySelector('a[href*="doi.org/10."]');
    if (a) doi = a.getAttribute("href") || "";
  }

  // 4) 본문 텍스트 정규식 기반 (마지막 백업)
  if (!doi && doc.body) {
    const text = (doc.body.innerText || "").slice(0, 50000);
    const m = text.match(/\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+\b/i);
    if (m) doi = m[0];
  }

  if (doi) {
    doi = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
    doi = doi.replace(/^doi\s*:\s*/i, "");
    doi = doi.trim();
  }
  return doi || "";
}