# ind-sponsors-cli

Low-volume CLI for the public job cards at [IND Sponsors](https://indsponsors.nl/jobs),
a Netherlands visa-sponsorship aggregator.

The cards link to external job boards and employer career sites. Always verify
the source listing, its age, the employer, and sponsorship details before
applying. IND Sponsors' Terms prohibit automated tools without prior written
permission; use this CLI only for permitted, personal, low-volume work.

## Installation

```bash
cd .agents/skills/ind-sponsors-search/cli
bun install
```

There are no runtime dependencies. Bun's built-in `fetch` and small structural
HTML/JSON-LD parsers are used instead of a DOM dependency.

## Commands

```bash
bun run src/cli.ts search -q software --limit 5 --format table
bun run src/cli.ts detail "https://source.example/jobs/role" --format plain
```

Search accepts `--query`/`-q`, `--jobage`, `--page`, `--limit`, and
`--format json|table|plain`. Detail accepts an external `<id|url>` and
`--format json|plain`. Errors are JSON on stderr and exit with status 1.

## Filter behavior

The observed public HTML currently returns the same server-rendered 25-card set
when query and page parameters change. The CLI sends those parameters as hints,
then filters/paginates the cards it actually receives locally. `--jobage` uses
the card's displayed date; that date can be a source refresh/fetched date rather
than the original posting date. The CLI cannot see cards outside that fetched
set when the portal's pagination is not reflected in plain HTML.

The special `software` query expands to common software-role terms (engineer,
developer, technology, data, AI and analytics) so the role search remains useful
when cards use a specific title rather than the word “software”. Other queries
match case-insensitively across title, company, location and source URL.

## Detail parsing

External pages are parsed from `JobPosting` JSON-LD when present. The parser
falls back to Open Graph/meta tags, headings, visible body text, and likely apply
links because the aggregator sources heterogeneous pages. A source may return a
403/402, expire, or omit a description; those conditions are surfaced instead
of being treated as valid data.
