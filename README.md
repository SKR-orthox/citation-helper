# Citation Helper (Firefox) - v0.7.0

A Firefox extension that generates clean citations from supported paper pages and lets you copy them.

## Supported sites
- PubMed - https://pubmed.ncbi.nlm.nih.gov/<PMID>/
- Nature.com - https://www.nature.com/articles/<ARTICLE_ID>

## Citation styles
- Vancouver
- APA 7th
- IEEE
- BibTeX

## How to use
1. Open a supported article page (PubMed or Nature).
2. Click the extension icon.
3. Select a style, then generate.
4. Click Copy.

## Debug mode (for fixtures)
When debug mode is enabled, the last extracted CitationData is saved to browser storage.
This is used to build JSON fixtures for regression tests.

Enable:
- Open the extension popup DevTools console and run:
  browser.storage.local.set({ debugMode: true })

Read back:
- browser.storage.local.get(["lastCitationUrl","lastCitationData","lastCitationAt"]).then(console.log)

## Tests (snapshot-based)
This repo includes JSON fixtures and snapshot tests to prevent regressions when adding sites.

Run:
- npm test

Update snapshots:
- npm test -- --update

## Design principle
- Formatters are site-agnostic and should remain stable.
- Site-specific differences are handled in extractors + normalization.
- All extractors output a common CitationData schema.

## CitationData schema (core fields)
- authors: string[]
- title: string
- journalFull: string
- journalAbbrev: string (optional)
- year, volume, issue, pages
- pmid (PubMed only)
- doi (optional)
- url