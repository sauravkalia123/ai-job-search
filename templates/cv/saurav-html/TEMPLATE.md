# Template: saurav-html

- **Type:** CV
- **Source extension:** .html
- **Engine/toolchain:** headless Google Chrome (print-to-pdf)
- **Page limit:** 2 page(s)
- **Fonts:** Times New Roman / system serif (system font - must be installed; present on Linux via Liberation Serif metric-compatible substitute)
- **Class/packages:** none - plain HTML/CSS, single file

## Compile command

    cd <output dir> && rm -f <file>.pdf && google-chrome --headless --disable-gpu --no-sandbox --no-pdf-header-footer --print-to-pdf=<file>.pdf <file>.html

(`--no-pdf-header-footer` suppresses Chrome's default URL/date/page-count header. Chrome 155 tested. If an older Chrome rejects that flag, use `--print-to-pdf-no-header`.)

## Style rules

- Master content reference: `cv/master_cv.html` / `cv/master_cv.md` (the candidate's detailed base CV - the pool every tailored CV draws from). Content facts come from `01-candidate-profile.md`; the master shows only framing and depth.
- Single column, serif (Times New Roman), black on white, centered header with a full-width rule under the name and under each section title.
- Section titles: uppercase, 12pt, bold, letter-spaced, with bottom border.
- Contact row: phone | email | LinkedIn | city+relocation | work-auth line, separated by thin `|` spans.
- Professional Summary: justified paragraph, bold on title/years/domain/metrics/expertise list. Tailor per role; lead with the domain-transfer argument when the role is outside the home domain.
- Core Skills: `• Category:` bold label rows (min-width 170px label column). Reorder rows so the posting's stack leads; use the posting's exact term in the label when truthfully applicable.
- Work Experience: one `.job` div per employer, newest first; optional internal `.job-role` phase lines inside one employer block; italic 8.5pt `Tech:` stack line at the end of each job.
- Bullet emphasis: `<strong>` on metrics and outcomes.
- **Work-authorization header line (hard rule from the candidate profile):** Germany → "Opportunity card holder"; India → omit the span entirely; rest of world → "Sponsorship required".
- Keep the declared page limit (2 pages) by cutting content via relevance-weighted cuts, not by shrinking fonts or padding.

## Known pitfalls

- `.avoid-break` on a `.job` block taller than one printed page forces a page break and leaves the previous page half empty (observed on the master CV's Lytx block). Fix: split the employer into multiple `.job` blocks, drop `avoid-break` on that block, or cut bullets.
- HTML escaping: write `&` as `&amp;`, `<`/`>` in text as `&lt;`/`&gt;` (C++ template args, `->`). The master CV uses plain `->` safely, but a raw `<` followed by a letter will be parsed as a tag and silently swallow text.
- Chrome print margins: the template's own body padding is the only margin; do not add `@page` margins, they stack and inflate the page count.
- The PDF text layer from Chrome is clean UTF-8 (no `(cid:)` artifacts); still run the standard text-extraction check after compiling, because the two-column skill rows extract in DOM order (label then items) which is fine, but verify the contact details appear as literal text.
