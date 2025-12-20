# Citation Helper (Firefox)

Languages: English | [한국어](README.ko.md) | [日本語](README.ja.md)

Version: v0.8.4

Citation Helper generates citations from supported article pages and lets you copy them in one click.

Privacy: see [PRIVACY.md](PRIVACY.md)

## Supported sites

- PubMed (pubmed.ncbi.nlm.nih.gov)
- Nature (nature.com)
- SpringerLink (link.springer.com)

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
