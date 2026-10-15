---
name: smartrecruiters-search
version: 1.0.0
description: >
  Use this skill to search jobs on SmartRecruiters-hosted boards via the
  public api.smartrecruiters.com REST API — the ATS used by companies like
  TAPI, Qantas Group, Syntegon and Colliers. Invoke for openings at a
  specific company known to use SmartRecruiters, or to look up a
  jobs.smartrecruiters.com posting URL. Trigger phrases: smartrecruiters
  jobs, smartrecruiters board, company smartrecruiters careers, look up
  this smartrecruiters posting.
context: fork
allowed-tools: Bash(bun run .agents/skills/smartrecruiters-search/cli/src/cli.ts *)
---

# SmartRecruiters Search Skill

Search jobs on **SmartRecruiters-hosted boards** through the public
`api.smartrecruiters.com` REST API. No authentication, **zero runtime
dependencies** — runs with just `bun`.

> ⚠️ **Personal use only.** Keep volume low; no commercial or bulk use.

## Scope: per-organization

One board per call — the org token is the segment in
`jobs.smartrecruiters.com/<org>/<id>`. No global search across orgs.

## Commands

### Search

```bash
bun run .agents/skills/smartrecruiters-search/cli/src/cli.ts search -o <org> [-q "<keywords>"] [flags]
```

- `--org, -o <org>` — **required** board token.
- `--query, -q <text>` — server-side keyword search (the API's `q` parameter).
- `--limit, -n` — cap results (max 100 per API page).
- `--format json|table|plain`.

### Detail

```bash
bun run .agents/skills/smartrecruiters-search/cli/src/cli.ts detail <org>/<id> [--format json|plain]
bun run .agents/skills/smartrecruiters-search/cli/src/cli.ts detail <full-job-url> [--format json|plain]
```

Description from `jobAd.sections.jobDescription`, plus location, department
and release date.

## Usage examples

```bash
bun run .agents/skills/smartrecruiters-search/cli/src/cli.ts search -o TAPI -q "engineer" -n 10 --format table
bun run .agents/skills/smartrecruiters-search/cli/src/cli.ts search -o Syntegon -q "embedded"
bun run .agents/skills/smartrecruiters-search/cli/src/cli.ts detail TAPI/<id> --format plain
```

## Notes

- List: `GET /v1/companies/<org>/postings?limit=&q=` → `{totalFound, content:[...]}`.
- Detail: `GET /v1/companies/<org>/postings/<id>` — description HTML under
  `jobAd.sections.jobDescription`.
- `releasedDate` (ISO) → `date` (the posting's release date).
- Errors → stderr `{"error","code"}`, exit 1 (`NO_ORG`, `BAD_ID`,
  `NOT_FOUND`, `FETCH_FAILED`, `UNKNOWN_FLAG`, `BAD_CMD`).
