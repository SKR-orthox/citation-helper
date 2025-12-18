const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = process.cwd();

const FORMATTER_NAMES = ["vancouver", "apa7", "ieee", "bibtex"];

function decodeHtmlEntities(input) {
  const s = String(input ?? "");

  const named = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    ndash: "–",
    mdash: "—",
    hellip: "…",
  };

  return s.replace(/&(#\d+|#x[0-9a-fA-F]+|\w+);/g, (m, g1) => {
    if (g1[0] === "#") {
      // numeric: &#8211; or &#x2013;
      const isHex = g1[1].toLowerCase() === "x";
      const numStr = isHex ? g1.slice(2) : g1.slice(1);
      const codePoint = parseInt(numStr, isHex ? 16 : 10);
      if (!Number.isFinite(codePoint)) return m;
      try {
        return String.fromCodePoint(codePoint);
      } catch {
        return m;
      }
    }
    // named
    return Object.prototype.hasOwnProperty.call(named, g1) ? named[g1] : m;
  });
}

function readUtf8(p) {
  return fs.readFileSync(p, "utf8");
}

function normalizeNewlines(s) {
  return String(s ?? "").replace(/\r\n/g, "\n").trim();
}

// repo root 또는 formatters/ 둘 다 지원
function resolveFormatterPaths() {
  const candidates = [path.join(ROOT, "formatters"), ROOT];

  for (const base of candidates) {
    const files = {
      common: path.join(base, "common.js"),
      vancouver: path.join(base, "vancouver.js"),
      apa7: path.join(base, "apa7.js"),
      ieee: path.join(base, "ieee.js"),
      bibtex: path.join(base, "bibtex.js"),
    };
    const ok = Object.values(files).every(p => fs.existsSync(p));
    if (ok) return files;
  }

  throw new Error("Formatter files not found (common/vancouver/apa7/ieee/bibtex).");
}

function loadFormattersIntoSandbox(formatterPaths) {
  const sandbox = { console, window: {} };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;

  const ctx = vm.createContext(sandbox);
  const order = [
    formatterPaths.common,
    formatterPaths.vancouver,
    formatterPaths.apa7,
    formatterPaths.ieee,
    formatterPaths.bibtex,
  ];

  for (const p of order) {
    vm.runInContext(readUtf8(p), ctx, { filename: p });
  }

  const PCH = sandbox.window.PCH;
  if (!PCH || !PCH.formatters) throw new Error("window.PCH.formatters not initialized.");

  for (const name of FORMATTER_NAMES) {
    if (typeof PCH.formatters[name] !== "function") throw new Error(`Missing formatter: ${name}`);
  }
  return sandbox.window;
}

function parseMetaTags(html) {
  const metas = {};
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const mName = tag.match(/\bname\s*=\s*["']([^"']+)["']/i)
      || tag.match(/\bproperty\s*=\s*["']([^"']+)["']/i);
    const mContent = tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i);
    if (!mName) continue;
    const name = mName[1];
  let content = mContent ? mContent[1] : "";
  content = decodeHtmlEntities(content);
  (metas[name] ||= []).push(content);
  }
  return metas;
}

function firstMeta(metas, name) {
  const arr = metas[name];
  if (!arr || !arr.length) return "";
  return String(arr[0] ?? "").trim();
}

function allMeta(metas, name) {
  const arr = metas[name];
  if (!arr || !arr.length) return [];
  return arr.map(v => String(v ?? "").trim()).filter(Boolean);
}

function year4(s) {
  const m = String(s || "").match(/\b(19\d{2}|20\d{2}|21\d{2})\b/);
  return m ? m[1] : "";
}

function stripDoiPrefix(doi) {
  return String(doi || "")
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
    .trim();
}

// 아주 단순한 이름 파서 (Springer citation_author가 "Given Family" 형태라 대체로 충분)
function parseAuthor(raw) {
  const s = String(raw || "").replace(/\s+/g, " ").trim();
  if (!s) return null;

  if (s.includes(",")) {
    const i = s.indexOf(",");
    return { family: s.slice(0, i).trim(), given: s.slice(i + 1).trim() };
  }

  const parts = s.split(" ").filter(Boolean);
  if (parts.length === 1) return { family: parts[0], given: "" };

  return { family: parts[parts.length - 1], given: parts.slice(0, -1).join(" ") };
}

function initials(given) {
  return String(given || "")
    .split(/[\s-]+/)
    .map(p => p.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, ""))
    .filter(Boolean)
    .map(p => p[0].toUpperCase())
    .join("");
}

function initialsWithDots(given) {
  const ini = initials(given);
  return ini ? ini.split("").map(ch => `${ch}.`).join(" ") : "";
}

function buildCitationDataFromSpringer(url, metas) {
  const authorsRaw = allMeta(metas, "citation_author");
  const parsed = authorsRaw.map(parseAuthor).filter(Boolean);

  const authorsVancouver = parsed.map(p => {
    const ini = initials(p.given);
    return ini ? `${p.family} ${ini}` : p.family;
  }).filter(Boolean);

  const authorsAPA = parsed.map(p => {
    const dots = initialsWithDots(p.given);
    return dots ? `${p.family}, ${dots}` : p.family;
  }).filter(Boolean);

  const authorsIEEE = parsed.map(p => {
    const dots = initialsWithDots(p.given);
    return dots ? `${dots} ${p.family}` : p.family;
  }).filter(Boolean);

  const title = firstMeta(metas, "citation_title");
  const doi = stripDoiPrefix(firstMeta(metas, "citation_doi"));
  const year = year4(firstMeta(metas, "citation_publication_date") || firstMeta(metas, "citation_year"));

  const volume = firstMeta(metas, "citation_volume");
  const issue = firstMeta(metas, "citation_issue");

  const pages1 = firstMeta(metas, "citation_pages") || firstMeta(metas, "citation_pagination");
  const fp = firstMeta(metas, "citation_firstpage");
  const lp = firstMeta(metas, "citation_lastpage");

  let pages = "";
  if (pages1) pages = pages1;
  else if (fp && lp) pages = `${fp}-${lp}`;
  else if (fp) pages = fp;

  // container: article은 journal_title, chapter는 inbook_title
  const journalFull =
    firstMeta(metas, "citation_journal_title") ||
    firstMeta(metas, "citation_inbook_title") ||
    firstMeta(metas, "citation_book_title") ||
    firstMeta(metas, "citation_publication_title") ||
    firstMeta(metas, "citation_series_title");

  const publisher = firstMeta(metas, "citation_publisher");

  const isChapter = /\/chapter\//i.test(url);

  return {
    // raw authors는 bibtex에서 "Given Family" 그대로 써도 괜찮음
    authors: authorsRaw,

    authorsVancouver,
    authorsAPA,
    authorsIEEE,

    title,
    journalFull,
    journalAbbrev: "",
    year,
    volume,
    issue,
    pages,
    pmid: "",
    doi,
    url,
    publisher,

    // bibtex에서 분기 쓰고 있으면 도움이 됨
    type: isChapter ? "chapter" : "article",
  };
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: { "user-agent": "CitationHelperDump/0.1" }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

function safeIdFromUrl(url) {
  const u = new URL(url);
  const tail = (u.pathname || "").split("/").filter(Boolean).slice(-2).join("-");
  return (u.hostname + "-" + tail).replace(/[^\w.-]+/g, "_").slice(0, 120);
}

(async () => {
  const listPath = process.argv[2] || "tests/springer-urls.txt";
  const outPath = process.argv[3] || "out/springer-formats.txt";

  const urls = readUtf8(listPath)
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(s => s && !s.startsWith("#"));

  const formatterPaths = resolveFormatterPaths();
  const windowObj = loadFormattersIntoSandbox(formatterPaths);

  let big = "";
  let idx = 0;

  for (const url of urls) {
    idx++;
    try {
      const html = await fetchHtml(url);
      const metas = parseMetaTags(html);
      const data = buildCitationDataFromSpringer(url, metas);

      const out = {};
      for (const name of FORMATTER_NAMES) {
        out[name] = normalizeNewlines(windowObj.PCH.formatters[name](data));
      }

      big += `# ${idx}. ${url}\n\n`;
      big += `[Vancouver]\n${out.vancouver}\n\n`;
      big += `[APA7]\n${out.apa7}\n\n`;
      big += `[IEEE]\n${out.ieee}\n\n`;
      big += `[BibTeX]\n${out.bibtex}\n\n`;
      big += `---\n\n`;

      // 링크별 개별 txt도 같이 저장(원하면)
      const id = safeIdFromUrl(url);
      fs.writeFileSync(path.join("out", `${id}.txt`), big.split("---\n\n").slice(-2, -1)[0], "utf8");

      console.log(`✓ dumped: ${url}`);
    } catch (e) {
      console.log(`✗ fail: ${url} (${e.message})`);
    }
  }

  fs.writeFileSync(outPath, big, "utf8");
  console.log(`\nDONE: ${outPath}`);
})();
