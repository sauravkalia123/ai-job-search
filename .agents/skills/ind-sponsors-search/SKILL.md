---
name: ind-sponsors-search
version: 1.0.0
description: >
  Search IND Sponsors' public visa-sponsorship job listings for the Netherlands.
  Use for Dutch jobs, Netherlands jobs, visa sponsorship jobs, highly skilled
  migrant vacancies, kennismigrant vacatures, vacatures in Nederland, banen in
  Nederland, werken in Nederland, vacatures met visumsponsoring, and jobs at
  IND-recognised sponsors. Also trigger for software, developer, data, AI,
  engineering, and other roles in the Netherlands when visa sponsorship matters.
context: fork
enabled: true
allowed-tools: Bash(bun run .agents/skills/ind-sponsors-search/cli/src/cli.ts *)
---

# IND Sponsors Search Skill

Search the public jobs page at [IND Sponsors](https://indsponsors.nl/jobs) for
roles in the Netherlands. IND Sponsors is an aggregator: listings are sourced
from external job boards and employer career sites, while the employers are
presented as IND-recognised sponsors. A recognised-sponsor listing is not a
promise that this particular vacancy is open, that the employer will sponsor
this applicant, or that the external listing is current.

## ⚠️ Public-use and verification warning

The site is public and its `robots.txt` allows crawling, but its Terms of Service
prohibit scraping, crawling, redistribution, and automated tools or AI agents
without prior written permission. Use this CLI only for low-volume personal use
where you have permission, keep requests infrequent, and take responsibility for
compliance with the current terms. Do not use it for bulk collection or resale.

Every result must be verified at its external `url` before applying. Confirm the
role is still open, the employer's current sponsorship position, salary and
language requirements, and the application instructions on the source site.

## Commands

### Search

```bash
bun run .agents/skills/ind-sponsors-search/cli/src/cli.ts search [flags]
```

Flags:

- `--query <text>` / `-q <text>` — keyword or role search. The default is
  `software`. Search terms are matched client-side against the listing title,
  company and location because the public HTML currently renders the same page
  when query parameters change. The `software` term also covers common software
  role-family terms such as engineer, developer, technology, data, AI and
  analytics.
- `--jobage <days>` — client-side maximum age in days using the date shown on the
  card. The portal does not expose a stable posting-age filter in the public
  page; unknown dates are retained.
- `--page <n>` — 1-indexed client-side page over the cards returned by the public
  page (25 cards are rendered on the current public page). The portal's current
  pagination links are not stable to a plain unauthenticated fetch.
- `--limit <n>` — client-side cap.
- `--format json|table|plain` — output format; default `json`.

### Detail

```bash
bun run .agents/skills/ind-sponsors-search/cli/src/cli.ts detail <id|url> [--format json|plain]
```

Search results use the external source URL as both `id` and `url`, so passing the
result's `id` or `url` to `detail` fetches that source page. Detail parsing uses a
`JobPosting` JSON-LD block when available and falls back to common Open Graph,
`<h1>`, body, and application-link markup used by external sources.

## Usage examples

```bash
# Software and related engineering roles across the Netherlands
bun run .agents/skills/ind-sponsors-search/cli/src/cli.ts search -q software --limit 5 --format table

# Dutch-language or Dutch-titled vacancies
bun run .agents/skills/ind-sponsors-search/cli/src/cli.ts search -q "software engineer" --format table

# Amsterdam roles shown recently by the aggregator
bun run .agents/skills/ind-sponsors-search/cli/src/cli.ts search -q "data Amsterdam" --jobage 30 --limit 10

# Second client-side page of the fetched card set
bun run .agents/skills/ind-sponsors-search/cli/src/cli.ts search -q developer --page 2 --format table

# Read one external listing as clean text
bun run .agents/skills/ind-sponsors-search/cli/src/cli.ts detail "https://example-employer.nl/jobs/software-engineer" --format plain
```

## Output formats

| Format | Use |
|---|---|
| `json` | Default structured output for `/scrape` and scripts |
| `table` | Compact search-result review |
| `plain` | Human-readable search or full detail text |

JSON search output has `{ "meta": { "count": ..., "page": ... }, "results": [...] }`.
Every result includes `id`, `title`, `company`, `location`, `date`, and `url`; a
missing value is `null`.

Errors are written only to stderr as `{ "error": "...", "code": "..." }` and
exit with status `1`.

## Notes

- Search endpoint: `GET https://indsponsors.nl/jobs`. The page currently renders
  25 cards from 52 open roles in the observed public response. Query, page and
  filter parameters are retained in the page URL but are not reliably reflected
  in the unauthenticated HTML, so this CLI parses the returned cards and applies
  query, age, page and limit locally. It cannot discover cards that are not in
  the fetched public page.
- Cards are identified by repeated external listing links. The source URL may be
  Make it in the North, an employer ATS, Indeed, Recruit.net, Uber, or another
  external job site; it is intentionally not rewritten to an IND Sponsors URL.
- Card dates are the date exposed by the aggregator card and may be a fetched or
  refreshed date rather than the original `datePosted`. Detail JSON-LD is preferred
  for `date`, `deadline`, company, location and description.
- External source pages can expire, block automated requests, or lack JSON-LD.
  In those cases detail reports the fetch/parse error or returns the fields that
  can be established from metadata; verify the source page in a normal browser.
- `robots.txt` was checked and allows `/`, but the Terms restriction above still
  applies.
