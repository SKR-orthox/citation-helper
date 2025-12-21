(() => {
  if (!window.PCH) window.PCH = {};
  if (!window.PCH.formatters) window.PCH.formatters = {};

  window.PCH.util = {
    safeText(v) {
      if (!v) return "";
      return String(v).replace(/\s+/g, " ").trim();
    },
    authorJoiner(authors) {
      if (!Array.isArray(authors)) return ", ";
      // 저자 문자열 내부에 콤마가 있으면, 저자 구분 콤마와 섞이니까 세미콜론로 분리
      return authors.some(a => String(a ?? "").includes(",")) ? "; " : ", ";
    },

    joinAuthors(authors, joiner) {
      if (!Array.isArray(authors)) return "";
      const cleaned = authors.map(a => this.safeText(a)).filter(Boolean);
      if (cleaned.length === 0) return "";
      const sep = joiner || this.authorJoiner(cleaned);
      return cleaned.join(sep);
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