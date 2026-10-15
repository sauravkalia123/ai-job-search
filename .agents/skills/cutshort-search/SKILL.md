---
name: cutshort-search
version: 1.0.0
description: >
  Use this skill to search live software / tech job listings on Cutshort
  (cutshort.io) — an India-focused tech job board with startup and
  product-company roles across Bengaluru, Mumbai, Delhi NCR, Hyderabad, Pune,
  Chennai and remote. Invoke for open positions, vacancies and hiring in the
  Indian tech market, or to look up a specific Cutshort posting. Trigger
  phrases: cutshort, jobs in india, india tech jobs, bangalore jobs, bengaluru
  jobs, software jobs india, developer jobs india, IT jobs india, startup jobs
  india, naukri alternative, embedded jobs india, "are there any <tech role>
  jobs in <indian city>", look up this cutshort job posting.
context: fork
allowed-tools: Bash(bun run .agents/skills/cutshort-search/cli/src/cli.ts *)
---

# Cutshort Search Skill

Search live job listings from **[cutshort.io](https://cutshort.io)** — an
India-focused tech job board (startups and product companies; most roles in
Bengaluru, Mumbai, Delhi NCR, Hyderabad, Pune, Chennai, plus remote). No
authentication, no API key, and **zero runtime dependencies** — it runs with
just `bun`. Postings are in English.

> ⚠️ **Personal use only.** This reads Cutshort's public pages; keep volume
> low and don't use it commercially or for bulk data collection. Run it on
> your own responsibility. (robots.txt permits the search/detail paths used
> here; `/apply/`, `/view/j/`, `/vj/` and `/profile/` are disallowed and the
> CLI never touches them.)

## When to use this skill

- Search Indian tech job openings by keyword (skill, title, role; include a
  city in the query when scoping geographically)
- Filter by posting age (client-side, on the portal's own postedDate)
- Get the full description of a specific posting by its slug or public URL

## Commands

### Search job listings

```bash
bun run .agents/skills/cutshort-search/cli/src/cli.ts search [-q "<keywords>"] [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search. Optional; omit for the default listing. Include the city in `--query` (e.g. `"embedded bangalore"`) — the CLI has no separate location flag because the portal doesn't take one.
- `--jobage <days>` — client-side filter on the portal's `postedDate`. Postings whose date could not be read are **kept**, not dropped.
- `--limit <n>` / `-n <n>` — cap results emitted (client-side).
- `--format json|table|plain` — default `json`.

**No `--page` flag:** cutshort returns a single result page (the server
ignores page parameters — verified 2026-10-15).

### Fetch full job detail

```bash
bun run .agents/skills/cutshort-search/cli/src/cli.ts detail <slug|url> [--format json|plain]
```

`slug` is the `id` from a search result (the last path segment of the
`publicUrl`, e.g. `Sr-Backend-Engineering-Manager-Egnyte-koBBDTQ1`); a full
`https://cutshort.io/job/<slug>` URL also works. Returns the full description
(from the page's schema.org JobPosting JSON-LD), posted date, employment type,
skills, experience and salary facts. A 404 or unparseable page exits 1 with a
`NOT_FOUND` error rather than fabricating empty content.

## Usage examples

```bash
# Media-pipeline skills on Cutshort
bun run .agents/skills/cutshort-search/cli/src/cli.ts search -q "gstreamer" --limit 5 --format table

# Embedded roles in Bengaluru, posted in the last week
bun run .agents/skills/cutshort-search/cli/src/cli.ts search -q "embedded software engineer bangalore" --jobage 7

# C++ roles, capped at 10
bun run .agents/skills/cutshort-search/cli/src/cli.ts search -q "C++" -n 10 --format table

# Full detail for one posting
bun run .agents/skills/cutshort-search/cli/src/cli.ts detail Sr-Backend-Engineering-Manager-Egnyte-koBBDTQ1 --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use; `{meta:{count,page,total}, results:[...]}` |
| `table` | Quick human-readable scanning |
| `plain` | Reading a single job's full detail (`detail` command) |

Each search result carries at least `id`, `title`, `company`, `location`,
`date`, `url` (missing values are `null`, never omitted), plus `experience`,
`salary`, `skills` and `remoteType` when the portal reports them.

## Notes

- **Parsing anchor:** the SSR page embeds everything in a Next.js
  `<script id="__NEXT_DATA__">` tag. Search jobs live at
  `props.pageProps.dehydratedState.queries[*].state.data.data.pageData.jobs`;
  the detail page's schema.org `JobPosting` JSON-LD (under
  `...data.seoData.jsonlds`) carries the full description HTML, `datePosted`,
  `employmentType` and skills. See `url-reference.md` for the full map.
- **Store `publicUrl`, never `authApplyUrl`.** The raw payload also contains
  an `authApplyUrl` under `cutshort.io/profile/view/j/...` — a robots-
  disallowed path requiring login. The CLI's `url`/`id` are always the public
  `cutshort.io/job/<slug>` form.
- **Renewed postings:** the search-level `postedDate` and the detail page's
  `datePosted` can differ when an employer renews a listing; each endpoint
  reports its own value.
- The portal ignores page parameters, so a search is one request — keep
  `--limit` modest and pre-filter with `-q` rather than paginating.
