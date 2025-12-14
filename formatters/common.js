(() => {
  if (!window.PCH) window.PCH = {};
  if (!window.PCH.formatters) window.PCH.formatters = {};

  window.PCH.util = {
    safeText(v) {
      if (!v) return "";
      return String(v).replace(/\s+/g, " ").trim();
    },
    joinAuthors(authors) {
      if (!Array.isArray(authors)) return "";
      return authors.map(a => this.safeText(a)).filter(Boolean).join(", ");
    },
    yearOf(data) {
      const candidates = [
        this.safeText(data.year || ""),
        this.safeText(data.date || ""),
        this.safeText(data.publishedDate || "")
      ].filter(Boolean).join(" ");

      const m = candidates.match(/\b(19\d{2}|20\d{2}|21\d{2})\b/);
      return m ? m[1] : "";
    }
  };
})();