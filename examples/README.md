# Demo examples

Synthetic, realistic-looking emails for the chAIn Privacy Gateway demo. All
names, addresses, IBANs, tax IDs, license numbers and case references are
fabricated.

| File | Sector | Purpose |
|---|---|---|
| `01-banking-kyc.txt` | Banking | UBO chain + PEP screening question between two compliance teams |
| `02-medical-referral.txt` | Health | Hypertension second-opinion referral, doctor-to-doctor |
| `03-legal-discovery.txt` | Law | Privilege log dispute in a contract claim |
| `04-logistics-customs.txt` | Logistics | HS-code reclassification, perishables held at port |
| `05-public-sector-permit.txt` | Public sector | Construction permit overdue, escalation to Bauamt |
| `06-tax-consulting-succession.txt` | Accounting / Tax | Long, multi-issue ATAD-CFC + §13a succession case |
| `06-tax-consulting-succession.pdf` | Accounting / Tax | Same content as the .txt above, packaged as a 3-page PDF — drop into the Privacy Gateway file uploader to demo the PDF extraction path |

## How to use in the demo

1. Open the deployed app, go to `/gateway`.
2. **Either** paste any `.txt` file into the textarea, **or** click "Upload PDF / DOCX / TXT" and pick `06-tax-consulting-succession.pdf` to demo the extract → classify → rewrite pipeline on real-looking unstructured input.
3. Pick model (OpenAI or Kimi K2.6) and recipient context.
4. Click Analyze. The classifier returns ~15-25 critical spans across categories (names, addresses, tax IDs, IBANs, identifiers).
5. Toggle individual items off in the "Flagged items" list to demo span-level control.
6. Switch between "Placeholder" and "Dummy data" replacement modes.
7. Approve & send → optionally open the email modal to demo the `mailto:` outbound path.

## What each example exercises

- **Banking KYC** — many short identifiers (HRB, IBAN, passport, file refs); good demo of how the classifier handles mixed identifier categories without losing the operational meaning.
- **Medical referral** — clinical detail intermixed with personal data. Shows that "medical" classification is preserved as a separate category so it can be governed differently downstream.
- **Legal discovery** — case numbers, internal file references, court IDs. Good for the "preserve operational language" point — the rewritten version still reads like a legal memo.
- **Logistics customs** — many alphanumeric identifiers (BL, container, HS code, license). Stresses the classifier's identifier vs account distinction.
- **Public-sector permit** — names + Aktenzeichen + loan IDs + addresses, in a single dense paragraph. Good for screen-share.
- **Tax consulting (long)** — the centerpiece. ~14k characters across three interlocking issues, ~40+ critical entities (multiple individuals incl. DOBs, three companies with full registry data, Dutch counterpart, audit firm, two banks, license numbers, court refs, internal memo refs, mobile + landline numbers). Demonstrates that the rewrite preserves a complex multi-page argument while removing every PII surface.

## Regenerate the PDF (optional)

The PDF was generated on macOS via:

```bash
cupsfilter -i text/plain examples/06-tax-consulting-succession.txt \
  > examples/06-tax-consulting-succession.pdf
```

If you edit the `.txt`, regenerate the PDF the same way.
