# Changelog

## v0.9.2
- popup: retry content-script injection on message failure and widen Nature article URL matching (`/<journal>/articles/...`) for safer site detection.
- docs: clarify runtime extraction contract (`title` required for extractor success) vs formatter-policy no-title tests.
- cleanup: remove unused `content/content-common.js`.

## v0.8.5
- Expanded the snapshot fixture set (PubMed/Nature/SpringerLink: 10 each + a policy case) and confirmed `npm test` passes cleanly.
- Fixed an APA 7 regression where the author separator became semicolons instead of APA-style comma separation.
- Documentation prep for release: README now includes supported sites, example URLs, and limitations, plus a test-cases doc reference.

## Earlier versions
- See git tags and commit history for details.
