// tests/run-formatters.js
// Offline snapshot test for formatter outputs.
// Usage:
//   node tests/run-formatters.js
//   node tests/run-formatters.js --update

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const argv = process.argv.slice(2);
const UPDATE = argv.includes("--update");

const ROOT = process.cwd();
const TESTS_DIR = path.join(ROOT, "tests");
const FIXTURES_DIR = path.join(TESTS_DIR, "fixtures");
const SNAPSHOTS_DIR = path.join(TESTS_DIR, "snapshots");

const FORMATTER_NAMES = ["vancouver", "apa7", "ieee", "bibtex", "csljson", "ris"];

function formattersForFixture(id) {
  if (id.startsWith("_policy/")) return ["ris"];
  return FORMATTER_NAMES;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function readUtf8(p) {
  return fs.readFileSync(p, "utf8");
}

function normalizeNewlines(s) {
  return String(s ?? "").replace(/\r\n/g, "\n").trim();
}

function listJsonFilesRecursive(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  const stack = [dir];

  while (stack.length) {
    const cur = stack.pop();
    for (const ent of fs.readdirSync(cur, { withFileTypes: true })) {
      const full = path.join(cur, ent.name);
      if (ent.isDirectory()) stack.push(full);
      else if (ent.isFile() && ent.name.toLowerCase().endsWith(".json")) out.push(full);
    }
  }
  return out.sort();
}

// Try both "formatters/" folder and repo root.
function resolveFormatterPaths() {
  const candidates = [
    path.join(ROOT, "formatters"),
    ROOT
  ];

  for (const base of candidates) {
    const files = {
      common: path.join(base, "common.js"),
      vancouver: path.join(base, "vancouver.js"),
      apa7: path.join(base, "apa7.js"),
      ieee: path.join(base, "ieee.js"),
      bibtex: path.join(base, "bibtex.js"),
      csljson: path.join(base, "csljson.js"),
      ris: path.join(base, "ris.js"),
    };

    const ok = Object.values(files).every(p => fs.existsSync(p));
    if (ok) return files;
  }

  throw new Error(
    "Formatter files not found. Expected either:\n" +
    " - formatters/common.js, vancouver.js, apa7.js, ieee.js, bibtex.js, csljson.js, ris.js\n" +
    " - or in repo root: common.js, vancouver.js, apa7.js, ieee.js, bibtex.js, csljson.js, ris.js"
  );
}

function loadFormattersIntoSandbox(formatterPaths) {
  // Provide browser-like globals
  const sandbox = {
    console,
    window: {},
  };
  sandbox.window = sandbox; // window === globalThis 느낌으로 쓰게
  sandbox.globalThis = sandbox;

  const ctx = vm.createContext(sandbox);

  const order = [
    formatterPaths.common,
    formatterPaths.vancouver,
    formatterPaths.apa7,
    formatterPaths.ieee,
    formatterPaths.bibtex,
    formatterPaths.csljson,
    formatterPaths.ris,
  ];

  for (const p of order) {
    const code = readUtf8(p);
    vm.runInContext(code, ctx, { filename: p });
  }

  const PCH = sandbox.window.PCH;
  if (!PCH || !PCH.formatters) throw new Error("window.PCH.formatters not initialized.");

  for (const name of FORMATTER_NAMES) {
    if (typeof PCH.formatters[name] !== "function") {
      throw new Error(`Missing formatter: ${name}`);
    }
  }

  return sandbox.window;
}

function loadFixture(filePath) {
  const raw = JSON.parse(readUtf8(filePath));

  // allow either:
  // - plain CitationData object
  // - { data: CitationData }
  // - { citationData: CitationData }
  const data = raw?.data || raw?.citationData || raw;

  if (!data || typeof data !== "object") {
    throw new Error(`Invalid fixture JSON: ${filePath}`);
  }

  return data;
}

function fixtureIdFromPath(filePath) {
  // id = relative path under fixtures without .json
  const rel = path.relative(FIXTURES_DIR, filePath);
  return rel.replace(/\\/g, "/").replace(/\.json$/i, "");
}

function snapshotPathForId(id) {
  return path.join(SNAPSHOTS_DIR, `${id}.json`);
}

function runOne(windowObj, citationData, names = FORMATTER_NAMES) {
  const out = {};
  for (const name of names) {
    const s = windowObj.PCH.formatters[name](citationData);
    out[name] = normalizeNewlines(s);
  }
  return out;
}

function shallowDiff(expected, actual, names = FORMATTER_NAMES) {
  const diffs = [];
  for (const k of names) {
    const e = normalizeNewlines(expected?.[k] ?? "");
    const a = normalizeNewlines(actual?.[k] ?? "");
    if (e !== a) diffs.push(k);
  }
  return diffs;
}

function main() {
  ensureDir(SNAPSHOTS_DIR);

  const formatterPaths = resolveFormatterPaths();
  const windowObj = loadFormattersIntoSandbox(formatterPaths);

  const fixtureFiles = listJsonFilesRecursive(FIXTURES_DIR);
  if (fixtureFiles.length === 0) {
    console.error("No fixtures found.");
    console.error("Create JSON fixtures under: tests/fixtures/<site>/<id>.json");
    process.exit(1);
  }

  let failed = 0;

  for (const f of fixtureFiles) {
    const id = fixtureIdFromPath(f);
    const names = formattersForFixture(id);
    const snapPath = snapshotPathForId(id);

    const data = loadFixture(f);
    const actual = runOne(windowObj, data, names);

    if (!fs.existsSync(snapPath)) {
      if (UPDATE) {
        ensureDir(path.dirname(snapPath));
        fs.writeFileSync(snapPath, JSON.stringify(actual, null, 2) + "\n", "utf8");
        console.log(`+ snapshot created: ${id}`);
        continue;
      } else {
        console.error(`✗ missing snapshot: ${id}`);
        console.error(`  run with --update to create it.`);
        failed++;
        continue;
      }
    }

    const expected = JSON.parse(fs.readFileSync(snapPath, "utf8"));
    const diffs = shallowDiff(expected, actual, names);

    if (diffs.length === 0) {
      console.log(`✓ ${id}`);
      continue;
    }

    if (UPDATE) {
      fs.writeFileSync(snapPath, JSON.stringify(actual, null, 2) + "\n", "utf8");
      console.log(`~ snapshot updated: ${id} (${diffs.join(", ")})`);
      continue;
    }

    console.error(`✗ ${id} changed: ${diffs.join(", ")}`);
    for (const k of diffs) {
      console.error(`  [${k}] expected:\n${expected[k]}\n`);
      console.error(`  [${k}] actual:\n${actual[k]}\n`);
    }
    failed++;
  }

  if (failed) {
    console.error(`FAILED: ${failed} case(s)`);
    process.exit(1);
  }

  console.log("OK: all formatter snapshots match");
}

main();