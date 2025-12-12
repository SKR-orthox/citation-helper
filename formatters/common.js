// formatters/common.js
window.PCH = window.PCH || {};
PCH.util = PCH.util || {};

PCH.util.safeText = function (v) {
  if (!v) return "";
  return String(v).replace(/\s+/g, " ").trim();
};

PCH.util.tidyString = function (str) {
  if (!str) return str;
  return String(str)
    .replace(/\s+/g, " ")
    .replace(/\s*:\s*/g, ": ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s*\.\s*/g, ". ")
    .trim()
    .replace(/\.\s*\./g, ".");
};

PCH.util.makePages = function (data) {
  const safe = PCH.util.safeText;
  const first = safe(data.firstPage || "");
  const last = safe(data.lastPage || "");
  const pages = safe(data.pages || "");
  const eloc = safe(data.elocationId || data.eLocator || "");

  if (pages) return pages;
  if (first && last) return `${first}-${last}`;
  if (first) return first;
  if (eloc) return eloc;
  return "";
};