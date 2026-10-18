# togetherabroad-cli

Zero-runtime-dependency CLI for the public Together Abroad job board in the
Netherlands. It uses plain Bun `fetch`, chunked HTML parsing, and the detail
page's `JobPosting` JSON-LD.

## Data sources

- Default search: Together Abroad's public English/ICT category route.
- Keyword search: the public `/all-jobs/keyword/<term>/` route.
- Filtered search: the public `advsearchvacs` form POST.
- Detail: Together Abroad `/jobs/...` pages or their public `JobsRemote` route.

No authentication or runtime dependency is required. `bun install` only installs
the TypeScript/Bun development types used for checking.

## Installation

```bash
cd .agents/skills/togetherabroad-search/cli
bun install
bun run typecheck
```

## Commands

```bash
# English/ICT category
bun run src/cli.ts search --limit 5 --format table

# Keyword and location hint
bun run src/cli.ts search -q "software engineer" -l "Amsterdam" --jobage 7

# Detail by numeric ID or Together Abroad URL
bun run src/cli.ts detail 947801 --format plain
```

Search accepts `--query`/`-q`, `--location`/`-l`, `--jobage`, `--page`,
`--limit`/`-n`, and `--format json|table|plain`. Detail accepts an ID or URL
and `--format json|plain`. Errors are JSON on stderr with exit code 1.

The portal only exposes four publication-age buckets and no reliable free-text
city parameter. See `../SKILL.md` and `../url-reference.md` for those limits,
route details, and access findings.
