---
name: teamtailor-search
version: 1.0.0
description: >
  Use this skill to search jobs on Teamtailor-hosted career sites
  (<org>.teamtailor.com) via their public jobs.json JSON-Feed — the ATS used
  by many European startups and scale-ups (e.g. Combine, Bloq.it). Invoke for
  openings at a specific company known to use Teamtailor, or to look up a
  teamtailor.com posting URL. Trigger phrases: teamtailor jobs, teamtailor
  careers, company teamtailor board, look up this teamtailor posting.
context: fork
allowed-tools: Bash(bun run .agents/skills/teamtailor-search/cli/src/cli.ts *)
---

# Teamtailor Search Skill

Search jobs on **Teamtailor-hosted career sites** via their public
`https://<org>.teamtailor.com/jobs.json` JSON-Feed. No authentication,
**zero runtime dependencies** — runs with just `bun`.

> ⚠️ **Personal use only.** Keep volume low; no commercial or bulk use.

## Scope: per-organization

One board per call — the org token is the subdomain
(`combine.teamtailor.com` → `combine`). Find org tokens in Teamtailor URLs
seen anywhere else and feed them here. No global search.

## Commands

### Search

```bash
bun run .agents/skills/teamtailor-search/cli/src/cli.ts search -o <org> [-q "<filter>"] [flags]
```

- `--org, -o <org>` — **required** subdomain token.
- `--query, -q <text>` — client-side filter on title/location.
- `--limit, -n`, `--format json|table|plain`.

### Detail

```bash
bun run .agents/skills/teamtailor-search/cli/src/cli.ts detail <org>/<id> [--format json|plain]
bun run .agents/skills/teamtailor-search/cli/src/cli.ts detail <full-job-url> [--format json|plain]
```

Full description from the feed's `content_html` (or the embedded JobPosting
JSON-LD), plus location and posted date.

## Usage examples

```bash
bun run .agents/skills/teamtailor-search/cli/src/cli.ts search -o combine --format table
bun run .agents/skills/teamtailor-search/cli/src/cli.ts search -o bloqit -q "embedded"
bun run src detail combine/<uuid> --format plain
```

## Notes

- `jobs.json` is a JSON Feed: `items[]` with `id` (uuid), `title`, `url`,
  `date_published` (ISO → `date`), `content_html`, and an embedded
  `_jobposting` JobPosting JSON-LD (location via `jobLocation`).
- Errors → stderr `{"error","code"}`, exit 1 (`NO_ORG`, `BAD_ID`,
  `NOT_FOUND`, `FETCH_FAILED`, `UNKNOWN_FLAG`, `BAD_CMD`).
