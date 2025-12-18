# README.md (English)

[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md)

# Citation Helper

Citation Helper is a Firefox extension that extracts citation metadata from supported article pages and generates formatted references you can copy.

Supported sites
- PubMed (pubmed.ncbi.nlm.nih.gov)
- Nature (nature.com)
- SpringerLink (link.springer.com) including /article/ and /chapter/

Supported formats
- Vancouver
- APA 7th
- IEEE
- BibTeX
  - SpringerLink chapters are exported as @incollection with booktitle.

How to use
- Open a supported article page
- Click the extension icon
- Click Fetch citation
- Choose a style and click Copy

Local processing
- The extension extracts metadata from the current page (meta tags etc.) and formats it locally.

Development setup
- Node.js is required for formatter snapshot tests.
- Install dependencies:
  - npm install

Run tests
- npm test

Update snapshots (when formatter output changes intentionally)
- node ./run-formatters.cjs --update
  - Tip: add this to package.json scripts:
    - "test:update": "node ./run-formatters.cjs --update"

Debugging (save last extracted CitationData)
- Enable debug mode in an extension DevTools console:
  - about:debugging#/runtime/this-firefox
  - Find the extension, click Inspect
  - Run:
    - browser.storage.local.set({ debugMode: true })
- After running Fetch citation on a supported page, read the latest data:
  - browser.storage.local.get(["lastCitationUrl","lastCitationAt","lastCitationData"]).then(console.log)

Project versioning policy
- v0.8.x: add features and improve exports while keeping store beta separate
- v0.9.0-beta: store beta testing / packaging / store QA stabilization
- v1.0.0: first stable release

License
- TBD