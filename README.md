# Citation Helper

Languages: English | [한국어](README.ko.md) | [日本語](README.ja.md)

**Version:** v0.9.0-beta

Generate clean citations from supported academic article pages, then copy or export them in one click.

**Privacy:** see [PRIVACY.md](PRIVACY.md)

## Supported browsers

- **Firefox**: signed XPI (AMO Unlisted / self-distributed beta)
- **Chrome**: Chrome Web Store (public listing, currently in review)

## Supported sites

- PubMed (pubmed.ncbi.nlm.nih.gov)
- Nature (nature.com)
- SpringerLink (link.springer.com)

## Output formats

- Vancouver
- APA 7th
- IEEE
- BibTeX
- CSL-JSON
- RIS

## Install

### Firefox (signed XPI)

If you have a signed `.xpi` file:

- Open `about:addons`
- Click the gear icon
- Select **Install Add-on From File...**
- Choose the `.xpi`

### Chrome

Once the Chrome Web Store listing is approved, install from the store.

For local testing (developer mode):

- Open `chrome://extensions`
- Enable **Developer mode**
- Click **Load unpacked**
- Select the extension folder (the folder that contains `manifest.json`)

## How to use

- Open a supported article page
- Click the **Citation Helper** toolbar icon
- Choose **Style / Language / Authors**
- Click **Fetch citation**
- Click **Copy** (or use an export format)

## Feedback / bug reports

Please use GitHub Issues.

When reporting a bug, include:

- URL
- expected vs actual output
- which format and author preset you used
- (optional) a screenshot of the page’s citation area / metadata section

## Development

Prerequisites: Node.js (for formatter tests/scripts)

- Run tests: `npm test`
- Update snapshots: `npm run test:update`

Packaging:

- **Firefox**: `npx web-ext build` (produces a ZIP that AMO can sign)
- **Chrome**: create a ZIP with `manifest.json` at the root (no nested folder)

## License

See the repository license file (e.g., `LICENSE`).
