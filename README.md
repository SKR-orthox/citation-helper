# README.md (English)

[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md)

# Citation Helper

Citation Helper is a Firefox extension that extracts citation metadata from supported article pages and generates formatted references you can copy.

Current version
- v0.8.3

Supported sites
- PubMed (pubmed.ncbi.nlm.nih.gov)
- Nature (nature.com)
- SpringerLink (link.springer.com)
  - /article/
  - /chapter/

Supported formats
- Vancouver
- APA 7th
- IEEE
- BibTeX
  - SpringerLink chapters export as @incollection with booktitle.
- CSL-JSON (export)
  - Mapping notes: CSL-JSON_MAPPING.md
- RIS (export)

How to use
- Open a supported article page
- Click the extension icon
- Click Fetch citation
- Select a style
- Click Copy to copy the result to the clipboard

Local processing
- The extension extracts metadata from the current page (meta tags, JSON-LD when available) and formats it locally.

Development setup
- Node.js is required for formatter snapshot tests.
- Install:
  - npm install

Run tests
- npm test

Update snapshots (when formatter output changes intentionally)
- npm run test:update

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