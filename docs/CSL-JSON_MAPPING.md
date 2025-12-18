# CitationData to CSL-JSON mapping (v0.8.1)

This document defines the stable conversion rules from the extension's internal `CitationData` object to CSL-JSON.

The export output is a JSON array containing exactly one CSL item:

```json
[ { ... } ]
```

## Field mapping

| CitationData | CSL-JSON | Notes |
|---|---|---|
| `title` | `title` | Required for a meaningful item. |
| `authors` (string[]) | `author` | Best-effort parsing into `{ "family": "...", "given": "..." }`. Comma form (`Family, Given`) is preferred. |
| `journalFull` | `container-title` | Journal name for articles; book title for chapters. |
| `journalAbbrev` | `container-title-short` | Optional. |
| `year` (YYYY) | `issued.date-parts` | Exported as `{ "date-parts": [[YYYY]] }`. |
| `volume` | `volume` | Optional. |
| `issue` | `issue` | Optional. |
| `pages` | `page` | Optional (kept as-is, e.g. `20-2`). |
| `doi` | `DOI` | Normalized: removes `doi:` and `https://doi.org/` prefix. |
| `url` | `URL` | The current page URL. |
| `pmid` | `PMID` (custom) | Non-standard key kept for convenience. Unknown keys are typically ignored by CSL processors. |

## Type mapping

The CSL `type` is chosen as follows:

- If `CitationData.type === "chapter"` OR the URL contains `/chapter/` -> `type: "chapter"`
- Otherwise -> `type: "article-journal"`

## ID policy

The exported `id` is set in this priority order:

- DOI available -> `doi:<DOI>`
- else PMID available -> `pmid:<PMID>`
- else URL (or title fallback)

## Clipboard-first behavior (popup)

When the style is set to `CSL-JSON`, clicking `Fetch citation` will:

- Render the CSL-JSON into the textbox
- Attempt to copy it to the clipboard automatically
- If clipboard copy fails, the CSL-JSON remains in the textbox for manual copy
