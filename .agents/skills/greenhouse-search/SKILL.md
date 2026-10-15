---
name: greenhouse-search
version: 1.0.0
description: >
  Use this skill to search jobs on Greenhouse-hosted career boards
  (job-boards.greenhouse.io/<org>) via the public boards-api.greenhouse.io
  JSON API — the ATS used by thousands of startups and tech companies
  (e.g. Hudl, Geotab, SoundCloud, Alarm.com). Invoke for openings at a
  specific company known to use Greenhouse, or to look up a Greenhouse job
  URL. Trigger phrases: greenhouse jobs, greenhouse board, company greenhouse
  careers, look up this greenhouse job posting.
context: fork
allowed-tools: Bash(bun run .agents/skills/greenhouse-search/cli/src/cli.ts *)
---

# Greenhouse Search Skill

Search jobs on **Greenhouse-hosted career boards** through the public
`boards-api.greenhouse.io` JSON API. No authentication, **zero runtime
dependencies** — runs with just `bun`. Postings are in the employer's
language (usually English).

> ⚠️ **Personal use only.** Keep volume low; no commercial or bulk use.
> (robots.txt on boards-api.greenhouse.io disallows only `/embed/`; the API
> paths used here are permitted — verified 2026-10-15.)

## Scope: per-organization

One board per call — the org token is the segment in
`job-boards.greenhouse.io/<org>/jobs/<id>`. Find org tokens in Greenhouse
URLs seen anywhere else and feed them here. No global keyword search.

## Commands

### Search

```bash
bun run .agents/skills/greenhouse-search/cli/src/cli.ts search -o <org> [-q "<filter>"] [flags]
```

- `--org, -o <org>` — **required** board token.
- `--query, -q <text>` — client-side filter on title/location/department.
- `--limit, -n`, `--format json|table|plain`.

**Dates:** Greenhouse exposes `updated_at`, not a created date — `date` is
the posting's last-update date.

### Detail

```bash
bun run .agents/skills/greenhouse-search/cli/src/cli.ts detail <org>/<jobId> [--format json|plain]
bun run .agents/skills/greenhouse-search/cli/src/cli.ts detail <full-job-url> [--format json|plain]
```

Full description (HTML stripped to text), location, and last-update date
from the API's JSON.

## Usage examples

```bash
bun run .agents/skills/greenhouse-search/cli/src/cli.ts search -o hudl -q "engineer" -n 10 --format table
bun run .agents/skills/greenhouse-search/cli/src/cli.ts search -o geotab -q "embedded"
bun run .agents/skills/greenhouse-search/cli/src/cli.ts detail hudl/8242555 --format plain
```

## Notes

- List endpoint: `GET boards-api.greenhouse.io/v1/boards/<org>/jobs`;
  detail: `.../jobs/<id>` (JSON, `content` carries the description HTML).
- A missing board exits 1 with `NOT_FOUND` (never empty-but-successful).
- Errors → stderr `{"error","code"}`, exit 1 (`NO_ORG`, `BAD_ID`,
  `NOT_FOUND`, `FETCH_FAILED`, `UNKNOWN_FLAG`, `BAD_CMD`).
