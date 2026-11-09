# PDF Coverage Report: `1_AchHal_Pada_Samamnaayah.pdf`

## Extraction method used

1. Direct PDF text extraction (`pypdf`, `pymupdf`) — returned only page numbers.
2. Page render images (`assets/pdf-pages/page-1.png`..`page-3.png`).
3. OCR on rendered pages (`easyocr` with Hindi + English models).
4. Canonical inventory produced in `assets/pdf-letter-inventory.js`.

## Verified inventory totals

| Metric | Count |
|---|---:|
| PDF pages processed | 3 |
| Unique inventory items extracted | 48 |
| Displayed in Letter Garden (All tab) | 48 |
| Displayed in Magical Letter Tree | 48 |
| Items with local recorded audio usable now | 0 |
| Items with browser speech fallback | 0 (disabled by design) |
| Items awaiting Sanskrit review | 48 |

## Inventory composition

| Category | Count |
|---|---:|
| Independent vowels | 13 |
| Signs (अं, अः) | 2 |
| Consonants | 33 |
| Total | 48 |

## Excluded items and reason

These were not detected in this 3-page PDF OCR extraction and are intentionally excluded from the canonical set until confirmed from source pages:

- `ॡ`
- `क्ष`
- `त्र`
- `ज्ञ`

## Page-by-page concept mapping

| PDF page | Concepts mapped into website |
|---|---|
| Page 1 | Independent vowels (`अ` to `औ`) plus signs coverage seed (`अं` is represented in inventory and lesson examples). |
| Page 2 | Consonant groups `क-वर्ग`, `च-वर्ग`, `ट-वर्ग` and corresponding example words wired into Alphabet Forest inventory and detail panel. |
| Page 3 | Consonant groups `त-वर्ग`, `प-वर्ग`, plus `अन्तःस्थाः` (`य र ल व`) and `ऊष्माणः` (`श ष स ह`) mapped into Letter Garden, Magical Tree, and recognition activities. |

## Coverage status note

- This report maps extracted page concepts to implemented website inventory and activities.
- It does **not** claim Sanskrit linguistic sign-off; all extracted items remain review-pending.

## Notes on confidence

- OCR captured all core rows and varga headings, but some glyphs (notably `ॠ` and `ऌ`) are marked **OCR-ambiguous** in the canonical dataset.
- Pronunciation is currently routed through browser/device speech fallback until reviewed local recordings are available.
- No item is marked linguistically verified yet; all remain `ocr_extracted_needs_review` (or equivalent review-required status).
