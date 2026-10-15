---
name: workday-search
version: 1.0.0
description: >
  Use this skill to search jobs on Workday tenant career sites
  (<tenant>.wd1-5.myworkdayjobs.com/<site>) — the ATS used by Cisco, Thales,
  Jabil, Nokia-adjacent enterprises and thousands of large companies. Invoke
  for openings at a specific company known to run Workday, or to look up a
  Workday job URL. Trigger phrases: workday jobs, workday careers site,
  myworkdayjobs, company workday board, look up this workday job posting.
context: fork
allowed-tools: Bash(bun run .agents/skills/workday-search/cli/src/cli.ts *)
---

# Workday Search Skill

Search jobs on **Workday tenant career sites** (`<tenant>.wd<N>.myworkdayjobs.com/<site>`)
— the enterprise ATS behind thousands of large companies. No authentication,
**zero runtime dependencies** — runs with just `bun`. Postings are usually in
the employer's language (often English).

> ⚠️ **Personal use only.** This uses the site's own public search endpoint
> and public job pages; keep volume low, no commercial or bulk use. (Workday
> tenant robots.txt allows the site path; the cxs endpoint path has no
>Disallow rule — verified on cisco.wd5 2026-10-15. Re-check per tenant.)

## Commands

### Search

```bash
bun run .agents/skills/workday-search/cli/src/cli.ts search -b "<host>/<site>" [-q "<keywords>"] [flags]
```

- `--board, -b "<host>/<site>"` — **required**, e.g. `"cisco.wd5.myworkdayjobs.com/Cisco_Careers"` (both from any job URL on that tenant).
- `--query, -q <text>` — **server-side** keyword search (the site's own `searchText`).
- `--page <n>` — 1-indexed (20 results per server page).
- `--limit, -n`, `--format json|table|plain`.

Search results carry **no real dates** — Workday exposes only labels like
"Posted 2 Days Ago", which the CLI reports verbatim in `postedOn` rather than
converting into a fake date.

### Detail

```bash
bun run .agents/skills/workday-search/cli/src/cli.ts detail <full-job-url> [--format json|plain]
bun run .agents/skills/workday-search/cli/src/cli.ts detail "<externalPath>" -b "<host>/<site>"
```

Returns the full description, `datePosted`, company and location from the
posting page's schema.org JobPosting JSON-LD.

## Usage examples

```bash
bun run .agents/skills/workday-search/cli/src/cli.ts search -b cisco.wd5.myworkdayjobs.com/Cisco_Careers -q "embedded software" -n 10 --format table
bun run .agents/skills/workday-search/cli/src/cli.ts search -b thales.wd3.myworkdayjobs.com/Careers -q "C++"
bun run .agents/skills/workday-search/cli/src/cli.ts detail "https://cisco.wd5.myworkdayjobs.com/Cisco_Careers/job/Lysaker-Norway/Embedded-Software-Engineer_2027896"
```

## Notes

- **Search endpoint:** `POST /wday/cxs/<tenant>/<site>/jobs` with
  `{appliedFacets:{}, limit:20, offset, searchText}`.
- **Detail:** the job page embeds one `application/ld+json` JobPosting block
  (`description` HTML, `datePosted`, `hiringOrganization.name`, `jobLocation`).
- Board reference parsing requires the host to match
  `<tenant>.wd<N>.myworkdayjobs.com`.
- Errors → stderr `{"error","code"}`, exit 1 (`NO_BOARD`, `BAD_ID`,
  `NOT_FOUND`, `FETCH_FAILED`, `UNKNOWN_FLAG`, `BAD_CMD`).
