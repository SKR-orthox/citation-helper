# Citation Helper (Firefox)

Languages: English | [한국어](README.ko.md) | [日本語](README.ja.md)

Version: v0.8.5

Citation Helper generates citations from supported article pages and lets you copy them in one click.

Privacy: see [PRIVACY.md](PRIVACY.md)

## Supported sites

- PubMed (pubmed.ncbi.nlm.nih.gov)
- Nature (nature.com)
- SpringerLink (link.springer.com)

## Example URLs

- PubMed: https://pubmed.ncbi.nlm.nih.gov/10238015/
- Nature: https://www.nature.com/articles/d41586-024-04246-9
- SpringerLink (article): https://link.springer.com/article/10.1007/s11192-024-05163-4
- SpringerLink (chapter): https://link.springer.com/chapter/10.1007/978-1-0716-1418-1_2

Full test set (30 fixtures + policy case): see tests/0.8.5-cases.md

## Limitations / Notes

- Only the sites above are supported in v0.8.5.
- Metadata is extracted from the current page (meta tags / JSON-LD when available). If the page omits fields (authors, issue, pages), the output will also omit them.
- Some Nature “news” style pages may have missing volume/issue/pages.
- Group/consortium author handling depends on what the page provides (may not always match the journal’s preferred display).
- Works on the current tab only. It does not download or parse PDFs.
- Everything is processed locally in the extension (no server-side processing).

## Output formats

Citation styles
- Vancouver
- APA 7
- IEEE

Exports
- BibTeX
- CSL-JSON
- RIS

## Author presets

- Default: use the author format provided by the site (or best available)
- Auto initials: generate initials-based author lists when possible
- Raw: keep the raw author strings as-is

Note: Export formats (BibTeX / CSL-JSON / RIS) use Default author preset.

## How to use

1. Open a supported article page.
2. Click the extension icon.
3. Click **Fetch citation**.
4. Click **Copy**.

## Permissions

This extension aims to keep permissions minimal.

- activeTab: read the current tab only when you use the extension
- storage: save preferences locally (uiLanguage, citationStyle, authorPreset, debugMode, settingsVersion)
- clipboardWrite: copy output to clipboard

Host access is limited to supported sites via content scripts.

## Development

Install dependencies
```bash
npm install
```

Update formatter snapshots
```bash
npm run test:update
```

Run tests (if available in your setup)
```bash
npm test
```

## Notes

- All settings are stored locally.
- No external network requests are made by the extension.

## License

See the repository license file (if present).
