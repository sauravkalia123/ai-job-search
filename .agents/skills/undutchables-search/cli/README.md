# undutchables-cli

Small, zero-runtime-dependency CLI for the public vacancy board at
[undutchables.nl](https://undutchables.nl), focused on English IT-Engineering
roles in the Netherlands.

## Personal-use warning

Undutchables' `robots.txt` disallows filtered `/vacancies?*` URLs, and its
disclaimer restricts copying and distribution of site content. Use this CLI for
your own low-volume job search only. Do not use it commercially, for bulk
collection, or for redistribution. You are responsible for complying with the
portal's current rules.

## Installation

```bash
cd .agents/skills/undutchables-search/cli
bun install
```

There are no runtime dependencies. `bun install` installs only TypeScript and
Bun type definitions for development checks.

## Commands

```bash
bun run src/cli.ts search --query engineer --limit 5 --format table
bun run src/cli.ts detail audio-visual-programmer --format plain
```

Search sends `discipline=241` (IT-Engineering) and `language=217` (English).
`--location` maps to the portal's `location` field. Page 2 and later use
`/vacancies/p2`, `/vacancies/p3`, and so on. `--jobage` is accepted as a
contract-compatible flag but rejected because the portal has no posting-age
parameter and search cards have no date to filter locally.

## Flags

| Command | Flags |
|---------|-------|
| `search` | `--query/-q`, `--location/-l`, `--jobage`, `--page`, `--limit/-n`, `--format json\|table\|plain` |
| `detail <id|url>` | `--format json\|plain` |

Errors are JSON on stderr and use exit code 1. Search JSON is shaped as:

```json
{
  "meta": { "count": 1, "page": 1 },
  "results": [
    {
      "id": "audio-visual-programmer",
      "title": "Audio Visual Programmer",
      "company": null,
      "location": "Amersfoort",
      "date": null,
      "url": "https://undutchables.nl/vacancies/audio-visual-programmer"
    }
  ]
}
```

Detail pages use JSON-LD and visible vacancy sections to return readable
descriptions, dates, locations, and any populated structured fields. The
on-page Apply button does not expose a stable application URL, so `applyUrl` is
`null`.
