---
name: undutchables-search
version: 1.0.0
description: >
  Search Undutchables Recruitment Agency's public vacancy board for jobs in the
  Netherlands, especially international and multilingual roles in Amsterdam,
  Rotterdam, Utrecht, Eindhoven, The Hague and other Dutch cities. Trigger for
  Undutchables jobs, Undutchables vacancies, Netherlands jobs, Dutch job
  openings, find work in the Netherlands, vacatures bij Undutchables,
  vacatures in Nederland, werken in Nederland, baan zoeken in Nederland,
  IT-baan Nederland, and Engelstalige vacatures.
context: fork
enabled: true
allowed-tools: Bash(bun run .agents/skills/undutchables-search/cli/src/cli.ts *)
---

# Undutchables Search Skill

Search the public vacancy pages at [undutchables.nl](https://undutchables.nl)
for Netherlands-based roles. The default search scope is the portal's
**IT-Engineering** discipline (`discipline=241`) and **English** preferred
language (`language=217`), which is useful for international technology roles.
The CLI also supports the portal's free-text and location filters.

## ⚠️ Personal use only

Undutchables' `robots.txt` disallows filtered `/vacancies?*` URLs. This skill
uses those public filtered pages because they are the portal's search interface,
so use it **only for your own personal job search**, keep request volume low,
do not use it commercially or for bulk collection, and run it on your own
responsibility. Detail pages are not disallowed by the published robots file.

## Commands

### Search vacancies

```bash
bun run .agents/skills/undutchables-search/cli/src/cli.ts search [flags]
```

| Flag | Description |
|------|-------------|
| `--query <text>` / `-q` | Free-text vacancy search; optional |
| `--location <text>` / `-l` | Portal location filter, such as Amsterdam or Utrecht |
| `--jobage <days>` | Accepted for the common portal contract, but Undutchables exposes no posting-age query parameter; using it exits with `UNSUPPORTED_FILTER` rather than pretending to filter |
| `--page <n>` | 1-indexed page; page 2 uses `/vacancies/p2` |
| `--limit <n>` / `-n` | Client-side result cap |
| `--format json\|table\|plain` | Output format; default is `json` |

The search always sends `discipline=241` and `language=217`. The portal does
not display a posting date in result cards, so search `date` values are
honestly `null`; dates are available from detail-page JSON-LD.

### Fetch one vacancy

```bash
bun run .agents/skills/undutchables-search/cli/src/cli.ts detail <id|url> [--format json|plain]
```

The `id` is the vacancy slug returned by search, for example
`audio-visual-programmer`. A full `https://undutchables.nl/vacancies/<slug>` URL
is also accepted.

## Usage examples

```bash
# English IT / engineering vacancies in the Netherlands
bun run .agents/skills/undutchables-search/cli/src/cli.ts search -q engineer --limit 5 --format table

# Technology vacancies around Amsterdam
bun run .agents/skills/undutchables-search/cli/src/cli.ts search -q "technical engineer" -l Amsterdam --format table

# Page two of the English IT vacancy results
bun run .agents/skills/undutchables-search/cli/src/cli.ts search -q programmer --page 2 --limit 5

# Roles in Utrecht, emitted as plain text
bun run .agents/skills/undutchables-search/cli/src/cli.ts search -q developer -l Utrecht --format plain

# Read a full posting after taking its id from search output
bun run .agents/skills/undutchables-search/cli/src/cli.ts detail audio-visual-programmer --format plain

# A Dutch-language search phrase can be passed as normal query text
bun run .agents/skills/undutchables-search/cli/src/cli.ts search -q "technische vacature" --limit 3
```

## Output formats

| Format | Use |
|--------|-----|
| `json` | Default, suitable for `/scrape` and passing IDs to `detail` |
| `table` | Compact vacancy list for human scanning |
| `plain` | Readable text; especially useful for one detail page |

Search JSON has the interchangeable shape
`{ "meta": { "count": ..., "page": ... }, "results": [...] }`.
Each result includes `id`, `title`, `company`, `location`, `date`, and `url`;
unavailable fields are `null`. Detail JSON adds the full description and
available structured fields. Errors go to stderr as JSON and exit with code 1.

## Notes

- Data source: server-rendered HTML from `/vacancies` and `/vacancies/p2`, with
  `discipline=241`, `language=217`, optional `q` and `location` parameters.
- Cards contain a title, canonical vacancy URL, and location, but no company or
  posting date. The parser therefore leaves `company` and `date` null instead
  of copying the recruitment agency name or inventing a date.
- Detail pages use slugs rather than numeric IDs. Their `JobPosting` JSON-LD
  supplies `title`, `description`, `datePosted`, `jobLocation`, and other
  fields when populated. The HTML vacancy sections supplement the JSON-LD
  description with requirements and working conditions.
- The portal's visible apply control opens an on-page form rather than exposing
  a stable external application URL. `applyUrl` is consequently `null`.
- No login or API credential is required for the public pages.
- See `url-reference.md` for the researched selectors, parameters, and robots
  caveat.
