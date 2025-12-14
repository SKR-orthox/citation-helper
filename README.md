# Citation Helper (PubMed MVP)

🌐 Languages:  
[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md)

A lightweight Firefox extension that extracts citation data from **PubMed**
and generates clean, publication-ready references.

This project focuses on **accuracy of citation formatting**, not broad site coverage.

---

## Features

- Automatic citation extraction from **PubMed article pages**
- Supported citation styles:
  - Vancouver
  - APA 7th
  - IEEE
  - BibTeX
- Proper handling of:
  - Author truncation (`et al.`)
  - APA 7 rules for 21+ authors
  - DOI / PMID
- Multi-language UI:
  - English
  - Korean
  - Japanese
- One-click copy to clipboard
- Clean, minimal popup UI

---

## Supported Site

- PubMed  
  https://pubmed.ncbi.nlm.nih.gov/

*Only PubMed is officially supported in this MVP version.*

---

## How to Use

1. Install the extension in Firefox.
2. Open a PubMed article detail page.
3. Click the Citation Helper icon.
4. Select citation style and UI language.
5. Click **Fetch citation**.
6. Click **Copy** to copy the generated reference.

---

## Icons

Icons were **originally designed for this project using AI tools**  
and are provided as transparent PNG files:

- 16×16
- 32×32
- 128×128

---

## Project Status

This is an **MVP (Minimum Viable Product)** focused on:

- correctness of citation output
- clear formatting rules
- stable PubMed extraction

---

## Roadmap

- DOI-based cross-site expansion
- User-configurable author limits
- CSL / EndNote export
- Migration to Manifest V3

---

## Tech Stack

- Firefox WebExtension (Manifest V2)
- Vanilla JavaScript
- HTML / CSS

---

## License

MIT License