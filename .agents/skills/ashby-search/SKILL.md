---
name: ashby-search
version: 1.0.0
description: >
  Use this skill to search job listings on Ashby-hosted career boards
  (jobs.ashbyhq.com/<org>) — the ATS used by thousands of startups and
  tech companies (e.g. Airbound, Hexa, Constellr, Extropic). Invoke for
  openings at a specific company known to use Ashby, or to pull a full
  posting's description by its jobs.ashbyhq.com URL. Trigger phrases:
  ashby, ashby jobs, jobs.ashbyhq.com, startup ATS jobs, company board
  jobs, "does <company> have openings", look up this ashby job posting.
context: fork
allowed-tools: Bash(bun run .agents/skills/ashby-search/cli/src/cli.ts *)
---

# Ashby Search Skill

Search job listings on **Ashby-hosted career boards**
(`jobs.ashbyhq.com/<org>`). Ashby is the ATS behind thousands of startup and
tech-company careers pages. No authentication, **zero runtime dependencies**
— runs with just `bun`. Postings are in English.

> ⚠️ **Personal use only — accepted robots caveat.** Ashby's `robots.txt`
> disallows `/api/`, which hosts the public, unauthenticated GraphQL endpoint
> this CLI uses for board search. The user has explicitly accepted this
> caveat for personal, low-volume job search. Keep volume low; no commercial
> or bulk use; run it on your own responsibility. The `detail` command uses
> the plain posting page (not under `/api/`), which embeds schema.org
> JobPosting JSON-LD.

## Scope: per-organization

Ashby's public API has **no global keyword search** — one board per call.
You need the organization's board name (the segment in
`jobs.ashbyhq.com/<org>`). Find org names in board URLs seen anywhere else
(other job portals, company career-page links) and feed them here.

## Commands

### Search one organization's board

```bash
bun run .agents/skills/ashby-search/cli/src/cli.ts search --board <org> [flags]
```

Key flags:
- `--board <org>` / `-b <org>` — **required.** The org's board name.
- `--query <text>` / `-q <text>` — client-side filter on title/location (the API has no server-side keyword parameter).
- `--limit <n>` / `-n <n>` — cap results emitted (client-side).
- `--format json|table|plain` — default `json`.

No `--jobage` flag: the board API carries no posting dates (`detail` returns `datePosted`).

### Fetch full job detail

```bash
bun run .agents/skills/ashby-search/cli/src/cli.ts detail <board>/<postingId> [--format json|plain]
bun run .agents/skills/ashby-search/cli/src/cli.ts detail <full-url> [--format json|plain]
```

Accepts `<board>/<id>`, a full `https://jobs.ashbyhq.com/<board>/<id>` URL,
or a bare id with `--board`. Returns the full description (from the page's
schema.org JobPosting JSON-LD), `datePosted`, hiring organization and
location. A 404 or page without JobPosting JSON-LD exits 1 with `NOT_FOUND`.

## Usage examples

```bash
# All openings on one board
bun run .agents/skills/ashby-search/cli/src/cli.ts search -b airbound --format table

# Filter by keyword
bun run .agents/skills/ashby-search/cli/src/cli.ts search -b airbound -q "engineer" -n 10

# Full detail for one posting
bun run .agents/skills/ashby-search/cli/src/cli.ts detail airbound/e11026cb-e2db-4b0c-8792-8c40fd545fb7 --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — `{meta:{count,page,total}, results:[...]}`; detail returns the full object |
| `table` | Quick human-readable scanning |
| `plain` | Reading a single job's full detail |

Each search result carries `id`, `title`, `company` (the board name),
`location` (`locationName`), `date` (always `null` at search level — use
detail), `url`, `employmentType`, `teamId`.

## Notes

- **Board search endpoint:** `POST /api/non-user-graphql?op=ApiJobBoardWithTeamsQuery`
  with `{jobBoardWithTeams(organizationHostedJobsPageName:) { jobPostings { id title employmentType teamId locationName } }}`.
- **Detail:** the posting page embeds one `application/ld+json` block with
  `@type: JobPosting` — `description` (HTML), `datePosted`,
  `hiringOrganization.name`, `jobLocation`, `employmentType`.
- Errors → stderr as `{"error","code"}`, exit 1 (`NO_BOARD`, `BAD_ID`,
  `NOT_FOUND`, `FETCH_FAILED`, `UNKNOWN_FLAG`, `BAD_CMD`, `INTERNAL_ERROR`).
- See `url-reference.md` for the full endpoint map and verification dates.
