# Citation Helper

Languages:
- English (README.md)
- 한국어 (README.ko.md)
- 日本語 (README.ja.md)

Citation Helper is a lightweight Firefox extension that extracts citation metadata from supported article pages and generates formatted references.

This project prioritizes formatting accuracy and stability over broad site coverage.

## Features

- Extract citation data from supported article pages
- Citation styles:
  - Vancouver
  - APA 7th
  - IEEE
  - BibTeX
- Author rules:
  - Vancouver truncation (et al.)
  - APA 7 rule for 21+ authors
- Handles DOI, PMID, pages and eLocators when available
- Multi-language UI: English, Korean, Japanese
- One-click copy to clipboard

## Supported Sites

- PubMed
  - https://pubmed.ncbi.nlm.nih.gov/
- Nature (nature.com)
  - https://www.nature.com/ (article pages)

Support is intentionally limited. New sites are added only after a small test set passes, to avoid regressions.

## How to Use

1. Open a supported article page.
2. Click the extension icon.
3. Choose citation style and UI language.
4. Click Fetch citation.
5. Click Copy.

## Privacy

- Citation data is processed locally in your browser.
- No analytics.
- No page content is sent to external servers.
- Clipboard is used only when you press Copy.

## Development Install (Firefox)

1. Open about:debugging
2. This Firefox
3. Load Temporary Add-on…
4. Select manifest.json

## License

MIT License