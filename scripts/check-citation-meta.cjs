const fs = require("node:fs");

const listPath = process.argv[2] || "tests/springer-urls.txt";
const urls = fs.readFileSync(listPath, "utf8")
  .split(/\r?\n/)
  .map(s => s.trim())
  .filter(s => s && !s.startsWith("#"));

const requiredAny = ["citation_title", "citation_author", "citation_publication_date", "citation_doi"];
const containerCandidates = [
  "citation_journal_title",
  "citation_book_title",
  "citation_inbook_title",
  "citation_publication_title",
  "citation_series_title"
];

function parseMetaTags(html) {
  const metas = {};
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const mName = tag.match(/\bname\s*=\s*["']([^"']+)["']/i)
      || tag.match(/\bproperty\s*=\s*["']([^"']+)["']/i);
    const mContent = tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i);
    if (!mName) continue;
    const name = mName[1];
    const content = mContent ? mContent[1] : "";
    (metas[name] ||= []).push(content);
  }
  return metas;
}

function hasAny(metas, keys) {
  return keys.some(k => Array.isArray(metas[k]) && metas[k].some(v => (v || "").trim().length));
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: { "user-agent": "CitationHelperMetaCheck/0.1" }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

(async () => {
  for (const url of urls) {
    try {
      const html = await fetchHtml(url);
      const metas = parseMetaTags(html);
      const okRequired = hasAny(metas, requiredAny);
      const okContainer = hasAny(metas, containerCandidates);
      console.log(`✓ ${okRequired ? "REQ_OK" : "REQ_MISS"} ${okContainer ? "CONT_OK" : "CONT_MISS"} ${url}`);
    } catch (e) {
      console.log(`✗ FAIL ${url} (${e.message})`);
    }
  }
})();
