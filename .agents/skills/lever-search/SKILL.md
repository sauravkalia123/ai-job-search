---
name: lever-search
version: 1.0.0
description: >
  Use this skill to search jobs on Lever-hosted career boards
  (jobs.lever.co/<org>) via the public api.lever.co/v0/postings API —
  the ATS used by many startups and tech companies. Invoke for openings at
  a specific company known to use Lever, or to look up a jobs.lever.co
  posting URL. Trigger phrases: lever jobs, lever board, company lever
  careers, look up this lever job posting.
context: fork
allowed-tools: Bash(bun run .agents/skills/lever-search/cli/src/cli.ts *)
---

# Lever Search Skill

Search jobs on **Lever-hosted career boards** through the public
`api.lever.co/v0/postings/<org>` API. No authentication, **zero runtime
dependencies** — runs with just `bun`.

> ⚠️ **Personal use only.** robots.txt allows all with `Crawl-delay: 1` —
> honor it by keeping volume low; no commercial or bulk use.

## Scope: per-organization

One board per call — the org token is the segment in
`jobs.lever.co/<org>/<id>`. No global keyword search. Find org tokens in
Lever URLs seen anywhere else and feed them here.

## Commands

### Search

```bash
bun run .agents/skills/lever-search/cli/src/cli.ts search -o <org> [-q "<filter>"] [flags]
```

- `--org, -o <org>` — **required** board token.
- `--query, -q <text>` — client-side filter on title/location/team.
- `--limit, -n`, `--format json|table|plain`.

**Dates:** from the posting's `createdAt` epoch — the true posting date.

### Detail

```bash
bun run .agents/skills/lever-search/cli/src/cli.ts detail <org>/<id> [--format json|plain]
bun run .agents/skills/lever-search/cli/src/cli.ts detail <hostedUrl> [--format json|plain]
```

(The list response already carries full descriptions, so detail re-reads the
board and picks the one posting — two requests total per detail, honoring
the crawl-delay.)

## Usage examples

```bash
bun run .agents/skills/lever-search/cli/src/cli.ts search -o tala -n 10 --format table
bun run .agents/skills/lever-search/cli/src/cli.ts search -o tala -q "engineer"
bun run .agents/skills/lever-search/cli/src/cli.ts detail tala/<id> --format plain
```

## Notes

- Missing boards answer `{"ok":false,"error":"Document not found"}` — the CLI
  maps that to exit 1 `NOT_FOUND`, never empty-but-successful.
- Fields: `text`→title, `categories.location/team/commitment`,
  `workplaceType`, `createdAt`→`date`, `hostedUrl`→`url`,
  `descriptionPlain`→`description` (HTML `description` stripped as fallback).
- Errors → stderr `{"error","code"}`, exit 1 (`NO_ORG`, `BAD_ID`,
  `NOT_FOUND`, `FETCH_FAILED`, `UNKNOWN_FLAG`, `BAD_CMD`).
