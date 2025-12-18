(() => {
  const U = window.PCH && window.PCH.util;
  if (!U) return;

  function stripDoiPrefix(doi) {
    const v = U.safeText(doi);
    return v
      .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
      .replace(/^doi:\s*/i, "")
      .trim();
  }

  function year4FromAny(data) {
    const candidates = [
      U.safeText(data?.year || ""),
      U.safeText(data?.date || ""),
      U.safeText(data?.publishedDate || "")
    ]
      .filter(Boolean)
      .join(" ");

    const m = candidates.match(/\b(19\d{2}|20\d{2}|21\d{2})\b/);
    return m ? m[1] : "";
  }

  function isAllCapsInitials(token) {
    const t = U.safeText(token);
    return /^[A-Z]{1,6}$/.test(t);
  }

  function cleanAuthorRaw(raw) {
    let v = U.safeText(raw);
    v = v.replace(/\s*[\d*@†‡]+(?:,\s*[\d*@†‡]+)*\s*$/g, "").trim();
    v = v.replace(/[.,;:]+$/g, "").trim();
    if (/^et\s+al\.?$/i.test(v)) return "";
    return v;
  }

  // Best-effort parse into { family, given }
  function parseAuthor(raw) {
    const s = cleanAuthorRaw(raw);
    if (!s) return null;

    // "Family, Given"
    if (s.includes(",")) {
      const idx = s.indexOf(",");
      const family = U.safeText(s.slice(0, idx));
      const given = U.safeText(s.slice(idx + 1));
      return family ? { family, given } : null;
    }

    const tokens = s.split(/\s+/).filter(Boolean);
    if (tokens.length === 1) return { family: tokens[0], given: "" };

    const last = tokens[tokens.length - 1];

    // "van Hooft P" / "Li X" style
    if (isAllCapsInitials(last)) {
      return { family: tokens.slice(0, -1).join(" "), given: last };
    }

    // Default: "Given ... Family"
    return { family: last, given: tokens.slice(0, -1).join(" ") };
  }

  function authorsToCsl(data) {
    const rawAuthors = Array.isArray(data?.authors) ? data.authors : [];
    const parts = rawAuthors.map(parseAuthor).filter(Boolean);
    if (!parts.length) return undefined;

    return parts.map(p => {
      const out = {};
      if (p.family) out.family = p.family;
      if (p.given) out.given = p.given;
      return out;
    });
  }

  function guessCslType(data) {
    const url = U.safeText(data?.url || "");
    const hinted = U.safeText(data?.type || "").toLowerCase();

    if (hinted === "chapter") return "chapter";
    if (/\/chapter\//i.test(url)) return "chapter";

    return "article-journal";
  }

  function buildCslItem(data) {
    const title = U.safeText(data?.title || "");
    const containerTitle = U.safeText(data?.journalFull || data?.journalAbbrev || "");
    const containerShort = U.safeText(data?.journalAbbrev || "");
    const year = U.safeText(data?.year || year4FromAny(data) || U.yearOf?.(data) || "");

    const doi = stripDoiPrefix(data?.doi || "");
    const pmid = U.safeText(data?.pmid || "");
    const url = U.safeText(data?.url || "");

    const volume = U.safeText(data?.volume || "");
    const issue = U.safeText(data?.issue || "");
    const pages = U.safeText(data?.pages || "");
    const publisher = U.safeText(data?.publisher || "");

    const type = guessCslType(data);

    const item = {
      id: doi ? `doi:${doi}` : (pmid ? `pmid:${pmid}` : (url || title || "pch-item")),
      type,
      title: title || undefined,
      author: authorsToCsl(data),
      issued: year ? { "date-parts": [[Number(year)]] } : undefined,
      DOI: doi || undefined,
      URL: url || undefined,
      volume: volume || undefined,
      issue: issue || undefined,
      page: pages || undefined
    };

    if (containerTitle) item["container-title"] = containerTitle;
    if (containerShort) item["container-title-short"] = containerShort;

    if (type === "chapter") {
      if (publisher) item.publisher = publisher;
    }

    // Non-standard but handy (most CSL processors ignore unknown keys safely)
    if (pmid) item.PMID = pmid;

    for (const k of Object.keys(item)) {
      if (item[k] === undefined) delete item[k];
    }

    return item;
  }

  // Export as a one-item CSL-JSON array
  window.PCH.formatters.csljson = (data) => {
    const item = buildCslItem(data || {});
    return JSON.stringify([item], null, 2);
  };
})();