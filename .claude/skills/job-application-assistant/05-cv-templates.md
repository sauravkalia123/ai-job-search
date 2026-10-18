---
framework_version: 1.4.6
---

# CV Templates and Tailoring Guide

<!-- SETUP: Profile statements and section ordering are personalized by running /setup -->

<!-- BEGIN ACTIVE-TEMPLATE (managed by /add-template - do not edit by hand) -->
> **Active template override: `saurav-html`**
>
> A custom template is active. Where this block conflicts with the stock guidance below, this block wins. Structural advice below (tailoring, page-budget, cutting rules) still applies.
>
> - **Template skeleton:** `templates/cv/saurav-html/template.html` — use this as the structural reference instead of the stock template
> - **Manifest:** `templates/cv/saurav-html/TEMPLATE.md` — read this for style rules and known pitfalls before drafting
> - **Master content reference:** `cv/master_cv.html` / `cv/master_cv.md` — the candidate's detailed base CV; the content pool every tailored CV draws from (facts still come from `01-candidate-profile.md`)
> - **Source extension:** `.html` (not `.tex` unless the template's own toolchain is LaTeX)
> - **Compile command:** `cd cv && rm -f main_<company>_<role>.pdf && weasyprint main_<company>_<role>.html main_<company>_<role>.pdf` (not the command named in the stock guidance below — `/apply`'s compile step must use this instead). Run it from the output directory; the HTML carries its own `@page` rule, so no extra flags are needed.
> - **Fonts:** Times New Roman / system serif
> - **Page limit:** exactly 2 page(s)
> - **Output file:** `cv/main_<company>_<role>.html`; the template is a single self-contained file, no assets to copy
> - **Work-authorization header line (hard rule, from the candidate profile):** Germany → "Germany Opportunity card holder"; India → omit the span entirely; rest of world → "Sponsorship required". Phone is always the India number, written `+918527089555`.
<!-- END ACTIVE-TEMPLATE -->

## Batch HTML CV upgrades and recovery (mandatory)

This repository may contain many auto-generated HTML drafts under `cv/drafts/`. An HTML
upgrade is **not complete** when the source file passes `verify_draft.py`: its PDF must be
rebuilt from that exact source and must pass the two-page and text-layer gates too.

When upgrading more than one draft:

1. Make an explicit manifest of the files in the batch before editing. Do not infer the
   batch later from timestamps alone, and do not rerun a content rewrite after a restart
   until `git diff` and the manifest show which files already changed.
2. After each source edit, run the zero-token HTML verifier with the posting's actual
   country (`DE`, `IN`, or `OTHER`). Never use the wrong country merely to make the check
   pass.
3. Rebuild the PDF from the current HTML. For the complete draft pool, use:

   ```bash
   python3 tools/compile_draft_pdfs.py --force
   ```

   For one selected draft, remove its old PDF first and compile it directly:

   ```bash
   rm -f cv/drafts/pdf/<stem>.pdf
   weasyprint cv/drafts/<stem>.html cv/drafts/pdf/<stem>.pdf
   pdfinfo cv/drafts/pdf/<stem>.pdf | grep '^Pages:'
   python3 tools/verify_pdf.py cv/drafts/pdf/<stem>.pdf \
     --pages 2 --contains 'Saurav Kalia' \
     --contains sauravkalia@gmail.com
   ```

   `compile_draft_pdfs.py` reuses a PDF only when it is newer than its HTML source;
   `--force` is required when the template, CSS, fonts, or WeasyPrint toolchain changed
   without changing the HTML. An old PDF or an old `compile_report.md` is never evidence
   that the current HTML passed.
4. Treat any page count other than exactly 2 as a failure. Extract text from both pages
   and visually inspect both pages before reporting success. In particular, look for a
   third page containing only Languages, Education, or another trailing section, and for
   a job title or `Tech:` line separated from its bullets.
5. Fix overflow by relevance-weighted content cuts or by condensing a low-priority
   trailing section. Do not shrink fonts, silently change page geometry, or delete
   role-defining evidence just to force pagination. Re-run both HTML and PDF checks after
   every layout edit, then report the actual `N/N` results.

If the process is interrupted, resume from the changed files and current outputs. Do not
assume that the presence of a PDF means it corresponds to the current HTML.

## Master evidence versus CV presentation (mandatory)

The candidate profile and master files are allowed to contain detailed evidence so the assistant can tailor accurately. That evidence is **not** a command to reproduce the wording in a CV. Every tailored CV must apply this separation:

The scraper's Strong-keyword and solution-name catalogs are **search tools only**. Do not turn the
48 search keywords or the solution phrases into a generic CV skills dump. A posting discovered by
one of those terms is a signal about what to emphasize, not permission to claim the term. The
tailored CV must use the candidate's actual evidence-backed skill set, then prioritize the subset
that matches the role.

- **Evidence layer:** preserve the underlying facts, metrics, technologies, diagnostic findings, and implementation context for selection and interview preparation.
- **Presentation layer:** write a concise senior-engineer narrative focused on scope, ownership, outcome, and the few technologies relevant to the target role.
- Never copy a forensic investigation verbatim as a default bullet. Convert it to the senior-level outcome first. Example: a detailed file-descriptor/thread-pool investigation becomes “Resolved production stability and scalability issues in high-concurrency media services,” unless the job description specifically requires low-level socket or concurrency debugging.
- Keep implementation-level detail only when it directly supports a named requirement in the job description, a strong differentiator for the role, or a likely interview talking point. Use one selected detail, not the entire investigation log.
- The master CV is a **content reference**, not a ready-to-send final CV. Do not copy its full Work Experience, Core Skills, Technical Focus Areas, or Key Achievements sections into a tailored CV.

### Senior-level default style

- Use outcome-first bullets: ownership or scope → result → one supporting technology when useful.
- Prefer 4–6 bullets for the most recent role, 2–4 for other relevant roles, and 1–3 for older roles.
- Keep default bullets readable in one or two lines where possible. Avoid semicolon chains, nested diagnostic timelines, and lists of every remediation step.
- Do not turn every tool in the evidence layer into a skill claim. Mention only the tools that support the target role's narrative.
- Core Skills must contain **5–6 compact categories**, with a deliberate selection of major competencies. Do not use an exhaustive technology inventory as the default skills section.
- The optional solution/protocol keyword bank is a lookup source. Select individual supported terms only when relevant; never reproduce the bank as a section or append it to improve keyword count.

### Strongest positioning for relevant roles

For roles aligned with the candidate's evidence, prioritize the following narrative rather than
the search catalog itself: C++14/17/20 and multithreading; GStreamer, WebRTC, HLS and RTP/RTSP;
real-time video and multimedia platforms; streaming reliability, latency, memory and performance
optimization; dashcam/telematics, OTT, surveillance, broadcast and control-room video; embedded
Linux user-space applications; technical leadership, architecture, code reviews and mentoring;
and production debugging with measurable outcomes. Use the strongest verified evidence where it
helps the target role, such as 100+ concurrent streams per node across 700k+ devices, 98.6% WebRTC
session success, 84% less observed GStreamer memory growth, 49% to approximately 100% recording
duty cycle, recording gaps reduced from 171 to 2, and teams of 4–30 engineers. These are tailoring
priorities, not a replacement for checking the actual master CV and candidate profile.

## Solution keyword bank (tailoring source)

The optional protocol, format, product, and solution vocabulary is maintained in the candidate profile (`.claude/skills/job-application-assistant/01-candidate-profile.md`), not as a default section of the master CV. Treat it as a lookup bank only: when a posting names a supported term, select the smallest relevant set and place it in the tailored summary, skills, or evidence-backed experience bullets. **Never copy the bank as a block**, and never add terms restricted by the Keyword Policy. Space on a 2-page CV is finite, so unrelated solution names and keyword-only details must stay out.

## Template: LaTeX moderncv (Banking Style)

All CVs use the moderncv LaTeX package with the "banking" style and "blue" color scheme.

**Output file:** `cv/main_<company>_<role>.tex`
**Compile with:** **lualatex** on MiKTeX/TeX Live. pdflatex often fails on modern MiKTeX installs with `fontawesome5` font-expansion errors; lualatex handles the same sources cleanly.
**Master reference:** `cv/main_example.tex` (comprehensive CV with all competencies, experience, and achievements - use as source when building targeted CVs)

### Compile command

```bash
cd cv && lualatex -interaction=nonstopmode main_<company>_<role>.tex
```

Expected output: `Output written on main_<company>_<role>.pdf (2 pages, ...)`. Any page count other than 2 is a failure that must be fixed before presenting to the user.

## Document Structure

```latex
\documentclass[11pt,a4paper,sans]{moderncv}
\moderncvstyle{banking}
\moderncvcolor{blue}

% Force the name and section headings to render in moderncv blue (color1).
% Default banking leaves them black: moderncvstylebanking.sty's \colorlet
% copies (not aliases) the pre-scheme accent colour, so the name colours are
% frozen before \moderncvcolor runs. Re-let them after. \namefont is the hook
% every name-style macro routes through, so this also works on moderncv 2.3.1
% (Debian/Ubuntu apt), which has no \firstnamestyle/\lastnamestyle at all.
\renewcommand*{\namefont}{\fontsize{34}{36}\bfseries\upshape}
\colorlet{firstnamecolor}{color1}
\colorlet{lastnamecolor}{color1}
\colorlet{namecolor}{color1}
\renewcommand*{\sectionstyle}[1]{{\sectionfont\color{color1}#1}}

\usepackage[utf8]{inputenc}
% pdflatex fallback only (the documented engine is lualatex, which skips this
% branch). Without T1 font encoding pdflatex builds accented letters with
% \accent, and the PDF text layer stores them decomposed - `e` + U+0300 rather
% than U+00E8 - so an ATS keyword match on "Genève" fails while the page looks
% right. moderncv 2.5 loads T1 itself under pdflatex; 2.3.1 (Debian/Ubuntu apt)
% does not. \ifpdftex comes from iftex, which every moderncv version loads.
\ifpdftex\usepackage[T1]{fontenc}\fi
% moderncv loads hyperref itself in an \AtEndPreamble hook, so \hypersetup
% must go in an \AtEndPreamble of our own: on moderncv < 2.4 a top-level
% \usepackage{hyperref} clashes with the class's own
% \RequirePackage[unicode]{hyperref}. From 2.4.0 the class passes its options
% through \PassOptionsToPackage instead, which is what removes that clash.
\AtEndPreamble{\hypersetup{
    colorlinks=true,
    linkcolor=blue,
    filecolor=magenta,
    urlcolor=blue,
    pdftitle={Saurav Kalia - CV},
    % Keep pdfpagemode=UseNone: this block runs after moderncv's own
    % \AtEndPreamble (moderncv.cls sets pdfpagemode there), so a FullScreen
    % value here would win and open every CV in fullscreen presentation mode.
    pdfpagemode=UseNone,
}}
\usepackage[scale=0.80]{geometry}
\usepackage{import}

% Personal data
\name{Saurav}{Kalia}
% If you have no address to list, DELETE this whole line. \address{}{}{} fails
% with "There's no line here to end" on every moderncv version.
\address{Munich, Germany}{}{}
\phone[mobile]{+918527089555}
\email{sauravkalia@gmail.com}
\extrainfo{\href{https://linkedin.com/in/saurav2026}{LinkedIn}}

\begin{document}
\makecvtitle

% 1. Profile statement (1-3 sentences, tailored per role)
% 2. Skills section
% 3. Education section
% 4. Professional Experience section
% 5. Selected Publications (if applicable)
% 6. Honors and Awards (if applicable)
% 7. References

\end{document}
```

### Color overrides

The `\renewcommand*` on `\namefont` and the three `\colorlet` lines in the preamble are required on lualatex+MiKTeX. Without them the name and section headings render in black even though `\moderncvcolor{blue}` is set, which looks inconsistent with the rest of the blue accent scheme (links, bullet markers, contact icons). The cause: `moderncvstylebanking.sty` defines the name colours with `\colorlet`, which *copies* the accent colour as it is before the scheme is applied, so the name colours are frozen to the pre-scheme value; re-assigning them with `\colorlet` after `\moderncvcolor{blue}` (as the preamble does) re-pins them to `color1`. `\namefont` is the shared hook every name-style macro routes through, so the block is version-agnostic - including moderncv 2.3.1 from Debian/Ubuntu apt, which has no `\firstnamestyle`/`\lastnamestyle` at all. Both names render bold; if you prefer regular weight, change `\bfseries` to `\mdseries` in the `\namefont` line (the weight now lives there, so it applies to the whole name). Don't drop the overrides - on most modern installs the defaults render visibly wrong.

### Spacing inside itemize lists (important)

**Do not place `\vspace{...}` between `\item` entries in an `itemize` list.** Even though the source looks symmetric, this pattern occasionally produces a noticeably oversized gap before a single item: the inter-item `\vspace` creates a paragraph break that interacts unpredictably with the list's internal `\itemsep`, so LaTeX renders one of the gaps wider than the rest. Remove the inter-item `\vspace` and let `itemize` use its native uniform spacing.

```latex
% WRONG - intermittently produces an oversized gap before one bullet
\begin{itemize}
\item \textbf{Foo}: ...
\vspace{1pt}
\item \textbf{Bar}: ...
\vspace{1pt}
\item \textbf{Baz}: ...
\end{itemize}

% RIGHT - uniform spacing using the list's native itemsep
\begin{itemize}
\item \textbf{Foo}: ...
\item \textbf{Bar}: ...
\item \textbf{Baz}: ...
\end{itemize}
```

Two related patterns are fine and should be kept:
- `\vspace{1pt}` immediately after `\section{...}` (between section heading and first item) - this is between the heading and the list, not between list items.
- `\vspace{3pt}` between top-level `\cventry` blocks in Professional Experience or Education - this gives breathing room between roles and renders consistently.

### Section headings must match the CV's language (important)

Section headings such as `\section{Core Competencies}`, `Professional Experience`, `Education`, `Languages`, `Publications`, `Honors and Awards`, `References` (and any others your template defines), plus the `Available upon request.` line under References, are all **literal English text baked into the template** - they do not translate themselves. Whenever the CV language (see `CV language` in the candidate profile) is not English, translate every one of these too, whatever they are, not just the body prose - a CV with a fully localized profile statement and bullets sitting under untouched English section headers reads as sloppy and inconsistent, and it's an easy thing to forget precisely because the prose translation is the obvious, visible part of the job. Worked example for Spanish: `Competencias Clave`, `Experiencia Profesional`, `Educaci\'on`, `Idiomas`, `Publicaciones`, `Distinciones y Premios`, `Referencias`, `Disponibles a solicitud.` The same rule applies for any other target language - check this explicitly during the verification pass.

## Section-by-Section Tailoring

### Profile Statement / Elevator Pitch (Best Practice)
This is the most important section to customize. It appears right after `\makecvtitle`.

Write 5-7 lines that function as an "elevator pitch": a concise, compelling introduction explaining why you're qualified for *this specific role*. Focus on what the employer gains from hiring you.

When the role sits outside your home domain, **lead with the domain-transfer argument** - the one or two sentences connecting your background to their problem (e.g. wave physics to radar signal processing) belong in the profile statement's opening, not buried in the cover letter. It is the strongest card a domain-changer holds; play it first.

**Create 2-3 profile statement templates for your main role types:**

<!-- SETUP: Populated from ~/code/data/cv.md by /setup Path B -->
**For embedded C++ / multimedia-streaming roles (primary direction):**
> Principal-level embedded C++ engineer with 19+ years architecting real-time video streaming systems at scale: 100+ concurrent WebRTC/HLS streams per node across 700k+ dashcam devices at Lytx, and GPU-accelerated control-room video walls (16x HD simultaneous streams, frame-accurate PTP/genlock synchronization) at Barco. Deep expertise in GStreamer, WebRTC, C++ concurrency and embedded Linux user-space/media platforms; Yocto/ARM, firmware and device interaction are supporting exposure rather than kernel or deep device-driver specialization.

**For video-streaming platform / WebRTC backend roles:**
> Streaming-platform engineer with 19+ years building the media plane end to end: WebRTC and HLS delivery (98.6% session success at 600-session load, zero leaks across 4,286 sessions), GStreamer/Janus media servers, Kafka-backed event buses, and production debugging at the socket and thread level (fd lifecycles, back pressure, ICE/STUN/TURN topology). Owned platforms from greenfield architecture (Voizzit) to 700k-device scale (Lytx).

**For embedded Linux / firmware / BSP roles:**
> Embedded Linux and real-time media engineer with 19+ years shipping ARM-based multimedia products: NXP i.MX8 dashcams with Yocto as a supporting platform, Tizen signage platforms at Samsung, and STB middleware and firmware. Strongest in C/C++ user-space media pipelines, GStreamer, WebRTC, performance debugging and production reliability; Yocto, BSP, firmware and device interaction are adjacent evidence, not kernel or deep device-driver specialization.

Statements labeled *[Used for: <company>_<role>]* were extracted from archived application drafts by `/setup` Path A. They are **phrasing references, never fact sources**: when drafting from one, every factual claim still comes from `01-candidate-profile.md` - a past tailored draft does not vouch for its own accuracy.

### Core Competencies / Skills Section (Best Practice)
Reorder and emphasize based on the role. Use bold category labels.

List **5-7 key competencies** in bullet format, tailored to the specific job. For each competency, briefly explain how it adds value to the position.

Use the posting's own core term in the matching bullet's bold label when it truthfully applies - ATS and skim-reading hiring managers match literally, and "MLOps" in a heading outperforms a paraphrase like "ML Deployment".

### Education
- Always include your highest degrees
- For senior roles, keep education brief (dates and titles only)
- Include thesis topics when relevant to the target role

#### In-progress qualifications must say so explicitly

**A bare year range is not enough.** An entry reading `2025–2026`, seen partway through 2026, looks like a *finished* degree, because a reader skimming a CV treats a closed range as closed. A profile statement that says "currently completing…" does not fix it: the education entry is where a reader checks the credential, so it has to stand on its own.

State completion inside the entry itself:

```latex
\item{\cventry{2025--2026}{[Degree], [Field]}{[Institution]}{[Location]}{}{\vspace{1pt}
In progress, expected [Month Year]. [Relevant topics]
}}
```

Any consistent form works: `In progress, expected <Month Year>.` / `Expected completion <Month Year>.` / a date field of `2025–present`.

Claiming a credential not yet held is a factual misstatement, and it is the kind discovered at transcript or reference check rather than at interview. It costs nothing to prevent. The same applies to in-progress certifications and courses.

**Check for agreement:** for a current student, the profile statement, the education entry, and any availability or work-permit note must all give the same completion date. Contradiction between them is worse than any single version.

### Professional Experience
- Rewrite bullet points to emphasize aspects most relevant to the target role
- Use 4-6 bullets for most recent role, 3-4 for previous, 2-3 for older
- **Emphasize measurable results** where possible: "Reduced processing time by X%", "Model adopted by the team"

#### Check tenure against visible output

Before finalizing, look at each role the way a stranger will: **date span versus how much work is shown.** A two-year role represented by a single project reads as low output, whether or not that is fair. The reader cannot know what filled the time, so they guess, and the guess is unflattering.

This bites hardest on **career changers** (part of the tenure went into learning the new field), on **long-cycle work** (industrial deployment, clinical or regulatory projects, research — one delivery genuinely takes quarters), and on anyone whose employer kept them on a single account or product.

Three honest fixes, in order of preference:

1. **Surface more real work.** Ask what else the period contained. There are often real secondary projects, internal tooling, or support work that never reached the CV because it felt minor. Best fix when the material exists.
2. **Make the phases within the role explicit.** If the span genuinely had stages, say so — an initial period learning the domain or supporting the team, then ownership of the named work through to delivery. A phased arc reads as a growth curve; an undifferentiated multi-year block reads as stagnation.
3. **Name what made the cycle long.** Data collection from a live environment, validation with domain experts, deployment and iteration against real output. Reviewers who know the domain accept this immediately.

**Never** pad with invented projects, and **never** quietly shorten the employment dates so the ratio looks better. Both are discoverable, and both are worse than the perception problem being solved.

**Prepare the interview answer too.** If a long span against little visible output survives these fixes, the question is coming. The candidate needs a ready two-part answer — what actually filled the time, and what the outcome was — recorded in their interview prep rather than improvised in the room.

### Handling Employment Gaps (Best Practice)
If there is a gap in your employment history:
- The gap should be explained matter-of-factly if needed
- Describe how professional development continued during the gap
- Frame as deliberate skill-building and career repositioning

### Publications
- Include Google Scholar link if applicable
- Select 3-4 most relevant publications (not always all of them)
- For non-academic roles, keep brief

### Evidence Links
Wherever the CV names a verifiable artifact - a public project, a hackathon entry, a publication - carry its link (`\href`) so a reader can verify the claim in one click. A CV whose strongest claims are checkable reads as more credible everywhere else too.

### Honors and Awards
- Keep format brief, one line each

### References
- List 2-4 references with name, title, company, and contact
- End with: "More references are available upon request."
- **Do not attach reference letters** - employers typically contact references directly

### LaTeX Special Characters (important)

Postings and profile data arrive as plain text; the CV is LaTeX. Escape these wherever they land in body text - company names, achievement bullets, skill lists:

| Character | Write | Typical trigger |
|---|---|---|
| `&` | `\&` | company names: Bang \& Olufsen, Brüel \& Kjær, H\&M |
| `%` | `\%` | quantified achievements: "cut latency by 40\%" |
| `$` | `\$` | salary and cost figures |
| `#` | `\#` | "ranked \#1", C\# |
| `_` | `\_` | file names, code identifiers |
| `~` | `\textasciitilde{}` | URLs, "approx. 5 years" tildes |
| `^` | `\textasciicircum{}` | version strings, math |

Two failure modes deserve special care:

- **`%` fails silently.** An unescaped `%` starts a LaTeX comment: the compile succeeds with zero errors, and everything after the `%` on that line vanishes from the PDF. `Cut inference latency by 40% and saved DKK 2M annually` renders as "Cut inference latency by 40" - the bullet keeps its impressive-looking fragment and loses the actual result. Quantified achievement bullets are exactly where the guidance steers you ("use numbers where possible"), so check every `%` in every bullet before compiling.
- **`&` fails loudly** inside `\cventry` (alignment-tab errors, `Missing } inserted`). The compile loop catches it, but escape employer names up front rather than debugging the compile.

Related trap: a bullet whose text begins with a literal `[` must be braced - `\item {[text]}` - or LaTeX parses the bracketed text as `\item`'s optional label and renders it clipped off the left page edge with a clean compile. The example CV's placeholder bullets are braced for exactly this reason.

## Compile-and-Inspect Loop (MANDATORY)

After writing the CV and before presenting to the user, always compile and visually inspect the PDF. Iterate until the layout is clean. Workflow:

1. Run `lualatex -interaction=nonstopmode main_<company>_<role>.tex`
2. Check the output page count: must be exactly 2
3. Read the PDF via the Read tool and visually inspect both pages
4. Check for **orphaned entries**: a `\cventry` title line must never sit alone at the bottom of page 1 with its bullets on page 2

For the active HTML template, use the HTML compile command from the active-template block,
then run `pdfinfo`/`tools/verify_pdf.py` against the generated PDF. Never validate an HTML
draft against a PDF that predates the HTML or the active template.

### Fixing common page-break problems

**Problem: entry title on page 1, bullets orphaned to page 2**
Add `\needspace{5\baselineskip}` immediately before the problematic `\cventry`:
```latex
\needspace{5\baselineskip}
\item{\cventry{YEAR--YEAR}{Role Title}{Organization}{Location}{}{...}}
```
Include `\usepackage{needspace}` in the preamble.

**Caveat - use `\needspace` before entries, never before `\section` headings.** A section-level `\needspace` pushes the entire section (heading plus content) to the next page whenever the request does not fit, stranding empty space above and typically *adding* a page instead of saving one. Apply it only to the individual `\cventry` that actually orphans, and only after a compile shows the orphan.

**Problem: one trailing section spills to page 3 (e.g., References alone on page 3)**
Add `\enlargethispage{2-3\baselineskip}` before a late section (e.g., before `\section{Honors and Awards}`) to stretch page 2 by a few lines. This is the standard LaTeX rescue for near-miss overflows.

**Problem: 3 pages with significant content on page 3**
Cut content — do not compress geometry or `\vspace`. See "Relevance-weighted cutting" below for the rule.

**Problem: content finishes early on page 2 (feels thin)**
Restore the highest-relevance item that was previously cut — a CV that ends mid-page 2 looks incomplete.

## ATS Parseability

Most employers run CVs through an ATS before a human sees them, and the ATS reads the PDF's embedded **text layer**, not the rendered page. A CV can pass visual inspection and still extract as garbage. After the layout passes the compile-and-inspect loop, verify the text layer:

```bash
python tools/verify_pdf.py cv/main_<company>_<role>.pdf --dump-text cv/main_<company>_<role>.txt
```

Extraction tries **pypdf** first (`pip install pypdf`, BSD license), then Poppler `pdftotext`. If a fallback still uses `pdftotext -layout`, it must also pass `-enc UTF-8`: Xpdf-based builds default to Latin-1, which makes every non-ASCII character in a perfectly good CV read back as a replacement character. If neither extractor is available, skip the mechanical check with a warning and rely on the visual PDF read for keyword coverage.

What to check in the extraction:

- **Contact details as literal text.** The stock template's fontawesome contact icons extract as glyph names (`MOBILE-ALT`, `Envelope`) - harmless noise, because the actual address and number are printed beside them. The failure mode is a contact detail carried *only* by an icon or a hyperlink (like the `LinkedIn` link text, whose URL is not in the text layer): invisible to an ATS. The email address must always appear as printed text.
- **No garbled output.** `(cid:NNN)` markers or `�` characters mean a font is embedded without a Unicode mapping - an ATS sees the same garbage. This shows up with unusual fonts in custom templates, not with the stock moderncv setup under lualatex.
- **Reading order.** The stock banking style is single-column, so extraction order matches visual order. Custom templates (via `/add-template`) with sidebars or multi-column layouts can interleave unrelated lines; if extraction order is scrambled, the user is trading ATS compatibility for looks and should be told.
- **Keyword coverage.** Match the posting's required/preferred terms against the extracted text, in the posting's language. Prefer the posting's exact term over a synonym when it is truthfully applicable - ATS matching is often literal. Never add a keyword the profile does not support. `verify_pdf.py --contains` folds both sides for whitespace, Unicode normalization (NFC) and LaTeX's typographic substitutions before comparing - `'` reaches the text layer as U+2019 and `--` as U+2013, so `--contains "Master's degree"` and `--contains "2016-2024"` match what the template actually renders. The dumped `.txt` is never folded: it is the raw layer the ATS sees, which is why the date-range check below reads the dump, not `--contains`.
- **Accents intact (pdflatex fallback).** Under pdflatex without T1 font encoding the text layer stores accented letters decomposed (`e` + combining grave instead of `è`); pypdf reads that as `Gen` `eve` with a stray spacing accent, and neither form matches a typed keyword. The stock template guards this with `\ifpdftex\usepackage[T1]{fontenc}\fi`; keep the line in tailored CVs and custom templates that may be compiled with pdflatex. It is a no-op under lualatex.

### Date fields must be ASCII ranges (confirmed ATS import failure)

This one is worth knowing about because it fails **silently**. A CV that passes every other check in this section - clean extraction, no `(cid:)` markers, contact details intact, correct reading order - can still have its dates dropped on import. In a real Workday resume import, a CV built from this template lost the end date of a short contract role and failed to import **any** education entry at all, forcing manual re-entry. Nothing about the PDF or its text layer looked wrong.

Two independent causes, both easy to avoid:

1. **`--` in a `\cventry` date renders as an en-dash (U+2013), not a hyphen.** LaTeX ligatures `--` (two ASCII hyphens, U+002D) into a single en-dash glyph, so `2016--2024` reaches the PDF text layer as `2016<U+2013>2024`. Many parsers split date ranges only on an ASCII hyphen and see no range at all. Write the date argument with a **single hyphen**:

   ```latex
   \item{\cventry{2016-2024}{Role Title}{Organization}{Location}{}{...}}   % parses
   \item{\cventry{2016--2024}{Role Title}{Organization}{Location}{}{...}}  % en-dash, may not
   ```

   This applies to the **date argument only**. Keep `--` everywhere it is typographically correct in prose, for example a numeric range like `EUR 600k--1M`.

2. **A bare single year gives the parser no end date.** A short contract, mandate or internship written as `\cventry{2016}` imports as a start date with nothing to close it. Use an explicit range, with months where the role ran under a year:

   ```latex
   \item{\cventry{Mar 2016 - Jul 2016}{Contract Role}{Client}{Location}{}{...}}
   ```

   Where a genuine range exists, use it even when a single year would be factually accurate - a degree written `1995` is true but imports worse than `1992-1995`. Do not invent a start date you do not have; a lone graduation year is fine, just expect it to be typed in by hand.

**Cause 1 is mechanical in step 5d**: `python tools/verify_pdf.py cv/main_<company>_<role>.pdf --ascii-dates` scans the raw text layer for a year joined to a Unicode dash and exits 1 naming each hit with its code point (`U+2013 in 'Role Title 2016–2024'`). It deliberately reads the raw layer: the fold that lets `--contains "2016-2024"` match what the template renders maps that same en-dash back to `-`, so `--contains` can never see this. A year on either side of the dash is enough, so `Mar 2016 – Jul 2016` and `2016 – Present` are caught too; a numeric range with no year (`EUR 600k–1M`) is left alone. **Cause 2 stays a read-through check**: after extracting the text layer, confirm every experience entry shows a start *and* an end. Because both failures are silent and invisible in the PDF, the candidate otherwise discovers them only while filling in the application form.

## Page Budget - Hard 2-Page Limit

The CV **must** fit on exactly 2 pages when compiled. Use these content limits as a guide:

| Section | Max budget |
|---------|-----------|
| Profile statement | 3-4 lines |
| Skills | 5 items, each 1-2 lines |
| Most recent role | 4-5 bullets |
| Previous role | 2-3 bullets |
| Older roles | 2 bullets (1 line each) |
| Education | 2-3 entries |
| Publications | 2-3 entries |
| Awards | 3 entries, single line each |
| References | "Available upon request." (single line) |

**If in doubt, cut rather than squeeze.** Reducing `\vspace` or geometry scale to force-fit content makes the CV look cramped.

## Relevance-weighted cutting (the right way to shrink a CV)

**Cut by signal, not by section.** Static priority lists ("remove oldest education first, then shorten the earliest role...") are wrong when a relevant "lower-priority" item is competing with an irrelevant "higher-priority" item. An older-role bullet that speaks directly to the posting is worth more than a recent-role bullet that does not.

For every candidate line, score three things:

1. **Relevance to THIS posting** — does the line hit a named tool, keyword, or stated responsibility in the job ad?
2. **Uniqueness** — is it the only place this claim appears, or is it duplicated elsewhere in the CV?
3. **Narrative load** — does the cover letter depend on it? If cutting the line would force you to rewrite a cover-letter paragraph, it is load-bearing.

Cut the lowest-total-score line first, regardless of which section it sits in.

### Practical order of cuts (easiest → last resort)

1. **Redundancy.** If an achievement appears in both Core Competencies AND a role bullet, the Core Competencies version is usually the cleaner cut (the experience bullet is more concrete evidence).
2. **Profile-statement fluff.** A sentence that just restates what Publications or Skills will show. ("Peer-reviewed publications on X..." is already a Publications entry — profile can claim it once and stop.)
3. **Low-relevance experience bullets.** A bullet about work that does not touch posting keywords, wherever it sits. This cuts across sections before touching the structural list.
4. **Low-relevance supporting content.** An older-role bullet that does not speak to the target role. A certification that does not touch the posting's stack. A language entry that can be condensed to one line.
5. **Low-relevance publications.** Keep 1-2 publications that best match the posting. Cut the rest before touching experience bullets.
6. **Last-resort structural cuts.** Oldest education entry, tightening an older role to 2 bullets, collapsing Certifications into a single line. These only happen if the relevance-weighted cuts above have already been exhausted.

### Pitfalls to avoid

- Do not mechanically cut from the bottom of a static section list without checking relevance. "Cut the oldest role first" is wrong if that role is literally about the skill the posting asks for.
- Do not cut the one concrete example the cover letter leans on. Relevance is measured against the cover letter you wrote, not just the job posting — interviewers will have read both.
- Do not cut to fit if the fit is borderline (2.02 pages). Prefer `\enlargethispage{2-3\baselineskip}` on a late section for near-misses; reserve content cuts for genuine overflow (content on page 3 that is more than a single trailing section).

For the HTML template, a trailing section on page 3 is still a failed two-page CV. First
check whether an unbreakable `.avoid-break` block is cascading the overflow; split or
condense that block only when the resulting page break keeps the title, bullets, and `Tech:`
line together. Then apply the relevance-weighted cutting rules above.

## Recommended Section Order

The section order varies by role type:

**For technical / data science / ML roles:**
1. Profile statement / elevator pitch
2. Core competencies / Skills
3. Professional Experience (reverse chronological)
4. Education (reverse chronological)
5. Languages
6. Publications & Awards
7. References

**For domain-specific / specialist roles:**
1. Profile statement / elevator pitch
2. Core competencies / Skills
3. Education (reverse chronological) - credentials are a key qualifier
4. Professional Experience (reverse chronological)
5. Publications & Awards
6. References
