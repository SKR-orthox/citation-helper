// content-script.js - Stability Improvement Update (Nature.com DOM Fix)

const api = typeof browser !== "undefined" ? browser : chrome;

console.log("[PCH] content script loaded:", location.href);

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
    "search for more papers"
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