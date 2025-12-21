# Citation Helper (Firefox)

Languages: English | [한국어](README.ko.md) | [日本語](README.ja.md)

Version: v0.9.0 (0.9.0-beta)

Citation Helper generates citations from supported academic article pages and lets you copy or export them in one click.

Privacy: see [PRIVACY.md](PRIVACY.md)

## Beta distribution (AMO Unlisted)

This version is distributed as a signed XPI via AMO Unlisted (self-distributed beta).
If you received a signed `.xpi` file, install it via Firefox’s Add-ons Manager.

## Supported sites

- PubMed (pubmed.ncbi.nlm.nih.gov)
- Nature (nature.com)
- SpringerLink (link.springer.com)

## Example URLs

- PubMed: https://pubmed.ncbi.nlm.nih.gov/10238015/
- Nature: https://www.nature.com/articles/d41586-024-04246-9
- SpringerLink (article): https://link.springer.com/article/10.1007/s11192-024-05163-4
- SpringerLink (chapter): https://link.springer.com/chapter/10.1007/978-1-0716-1418-1_2

Test set (fixtures + policy case): [0.8.5-cases.md](0.8.5-cases.md)

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

Note: Export formats (BibTeX / CSL-JSON / RIS) use the Default author preset.

## How to use

- Open a supported article page.
- Click the extension icon.
- Click **Fetch citation**.
- Click **Copy**.

## Installation (signed XPI)

- Open Firefox Add-ons Manager (`about:addons`)
- Click the gear icon
- Select **Install Add-on From File...**
- Choose the signed `.xpi`

## Limitations / Notes

- Only the sites above are supported in v0.9.0.
- Metadata is extracted from the current page (meta tags / JSON-LD when available). If the page omits fields (authors, issue, pages), the output will also omit them.
- Works on the current tab only. It does not download or parse PDFs.
- Everything is processed locally in the extension (no server-side processing).

## Permissions

This extension aims to keep permissions minimal.

- `activeTab`: read the current tab only when you use the extension
- `storage`: save preferences locally (uiLanguage, citationStyle, authorPreset, debugMode, settingsVersion)
- `clipboardWrite`: copy output to clipboard

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

Run tests
```bash
npm test
```

Run in Firefox (temporary add-on)
```bash
npx web-ext run
```

Build a zip for AMO upload
```bash
npx web-ext build --overwrite-dest
```

## Feedback / bug reports

When reporting a bug, include:

- URL
- expected vs actual output
- which format and author preset you used
- (optional) a screenshot of the page’s citation area / metadata section

## License

See the repository license file (if present).
