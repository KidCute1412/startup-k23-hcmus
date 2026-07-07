---
name: startup-report-writer
description: Write or edit Mutux startup assignment reports in Vietnamese LaTeX under docs/PA0 through docs/PA5, including sections, citations, bibliography, academic/business tone, report continuity, and compile checks when needed.
---

# Startup Report Writer

## Read First
- Target `docs/PA*/main.tex`
- Target `docs/PA*/sections/*.tex`
- Target `docs/PA*/references.bib`
- `docs/shared/templates/report_template.tex`
- Existing previous PA reports for continuity

## Workflow
1. Edit section files, not large content directly in `main.tex`, unless changing imports or structure.
2. Keep Vietnamese content encoded as UTF-8.
3. Match the tone of an academic startup/business report.
4. Keep claims specific to Mutux: gaming gear rental, renter/lender marketplace, trust, KYC, proof flow, credit/deposit model.
5. Add BibTeX entries when introducing cited sources.
6. Avoid regenerating PDFs unless requested or required for verification.

## Quality Gates
- Check that section files are imported by `main.tex`.
- Check for missing citation keys when citations are added.
- Compile LaTeX when the environment supports it and the task requires a PDF check.
