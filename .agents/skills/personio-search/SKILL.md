---
name: personio-search
version: 1.0.0
description: >
  Use this skill to search jobs on Personio-hosted career sites
  (<org>.jobs.personio.com) via their public XML feed — the ATS used by many
  German and European companies (e.g. mm-software-gmbh, Liebherr units,
  mid-size manufacturers). Invoke for openings at a specific company known
  to use Personio, or to look up a jobs.personio.com posting. Trigger
  phrases: personio jobs, personio careers, company personio board, german
  company jobs, look up this personio posting.
context: fork
allowed-tools: Bash(bun run .agents/skills/personio-search/cli/src/cli.ts *)
---

# Personio Search Skill

Search jobs on **Personio-hosted career sites** via their public XML feed
(`https://<org>.jobs.personio.com/xml`). No authentication, **zero runtime
dependencies** — runs with just `bun`. Postings are often in German
(Language Gate applies downstream).

> ⚠️ **Personal use only.** Keep volume low; no commercial or bulk use.
> (The XML feed is the same public endpoint Personio exposes for job-board
> integrations.)

## Scope: per-organization

One board per call — the org token is the subdomain
(`mm-software-gmbh.jobs.personio.com` → `mm-software-gmbh`). Find org tokens
in Personio URLs seen anywhere else and feed them here. No global search.

## Commands

### Search

```bash
bun run .agents/skills/personio-search/cli/src/cli.ts search -o <org> [-q "<filter>"] [flags]
```

- `--org, -o <org>` — **required** subdomain token.
- `--query, -q <text>` — client-side filter on title/office/department.
- `--limit, -n`, `--format json|table|plain`.

### Detail

```bash
bun run .agents/skills/personio-search/cli/src/cli.ts detail <org>/<id> [--format json|plain]
bun run .agents/skills/personio-search/cli/src/cli.ts detail <full-job-url> [--format json|plain]
```

Full description from the feed's `jobDescription` (HTML stripped to text),
plus office, department, employment type, seniority and posted date.

## Usage examples

```bash
bun run .agents/skills/personio-search/cli/src/cli.ts search -o mm-software-gmbh --format table
bun run .agents/skills/personio-search/cli/src/cli.ts search -o mm-software-gmbh -q "embedded"
bun run .agents/skills/personio-search/cli/src/cli.ts detail mm-software-gmbh/2842113 --format plain
```

## Notes

- Feed fields: `id`, `name` (title), `office`, `department`, `employmentType`,
  `seniority`, `createdAt` (ISO → `date`), `jobDescription` (HTML, may be
  entity-escaped — the CLI decodes before stripping).
- German postings are common; downstream Language Gate flags German
  requirements against the declared A1 level.
- Errors → stderr `{"error","code"}`, exit 1 (`NO_ORG`, `BAD_ID`,
  `NOT_FOUND`, `FETCH_FAILED`, `UNKNOWN_FLAG`, `BAD_CMD`).
