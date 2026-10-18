---
name: togetherabroad-search
version: 1.0.0
description: >
  Search public Together Abroad job listings for the Netherlands, especially
  English-speaking and ICT roles for internationals and expats. Trigger on
  Together Abroad, togetherabroad.nl, Netherlands jobs, Dutch jobs, jobs in
  Nederland, vacatures in Nederland, werken in Nederland, baan zoeken,
  vacatures zoeken, ICT vacatures, Engelstalige vacatures, internationale
  vacatures, expat jobs, and jobs in Amsterdam, Rotterdam, Utrecht, Eindhoven,
  Delft, or The Hague.
context: fork
enabled: true
allowed-tools: Bash(bun run .agents/skills/togetherabroad-search/cli/src/cli.ts *)
---

# Together Abroad Search Skill

Search public job listings from [Together Abroad](https://www.togetherabroad.nl),
the Netherlands-focused career portal for internationals. The default search is
the portal's public English/ICT category. Keyword searches use the portal's
public keyword route, while location and posting-age filters use its public
search form.

## When to use this skill

- Find English-speaking, international, expat, or ICT jobs in the Netherlands.
- Search Dutch vacancies (`vacatures`) and roles in Dutch cities such as
  Amsterdam, Rotterdam, Utrecht, Eindhoven, Delft, or Den Haag.
- Fetch the full description and direct external application URL for one result.

## Commands

### Search listings

```bash
bun run .agents/skills/togetherabroad-search/cli/src/cli.ts search [flags]
```

Flags:

- `--query <text>` / `-q` — keyword search. With no other filter this uses the
  public `/all-jobs/keyword/<term>/` route; omit it to search the English/ICT
  category.
- `--location <text>` / `-l` — location hint. Together Abroad exposes country,
  postcode, and distance fields but no reliable free-text city field in the
  public form, so the CLI includes the supplied place in the keyword search.
- `--jobage <days>` — posting-age filter. Supported values are positive whole
  numbers from 1 through 14 and are mapped to Together Abroad's `today`,
  `last3days`, `thisweek`, or `last2weeks` buckets.
- `--page <n>` — 1-indexed page number.
- `--limit <n>` / `-n` — client-side result cap.
- `--format json|table|plain` — default `json`.

### Fetch a listing

```bash
bun run .agents/skills/togetherabroad-search/cli/src/cli.ts detail <id|url> [--format json|plain]
```

`id` is the numeric vacancy ID from search results. A Together Abroad `/jobs/...`
URL or its internal `JobsRemote` detail URL is also accepted. Detail output keeps
the Together Abroad posting URL in `url` and exposes the employer's direct
application destination in `applyUrl` when present.

## Usage examples

```bash
# Current English/ICT vacancies in the Netherlands
bun run .agents/skills/togetherabroad-search/cli/src/cli.ts search --limit 5 --format table

# Software roles for an Amsterdam search
bun run .agents/skills/togetherabroad-search/cli/src/cli.ts search -q "software engineer" -l "Amsterdam" --limit 5 --format table

# Data engineering roles around Utrecht, posted in the last week
bun run .agents/skills/togetherabroad-search/cli/src/cli.ts search -q "data engineer" -l "Utrecht" --jobage 7 --format table

# Dutch-language search for a developer vacancy in Eindhoven
bun run .agents/skills/togetherabroad-search/cli/src/cli.ts search -q "softwareontwikkelaar" -l "Eindhoven" --limit 10

# Read one result and see the direct application URL
bun run .agents/skills/togetherabroad-search/cli/src/cli.ts detail 947801 --format plain
```

## Output formats

| Format | Best for |
|---|---|
| `json` | Default programmatic output; includes `meta.count`, `meta.page`, and result objects. |
| `table` | Quick human-readable scanning of search results. |
| `plain` | Compact search output or readable full detail text. |

Every search result has `id`, `title`, `company`, `location`, `date`, and `url`;
unknown fields are `null`, never omitted. Errors are written only to stderr as
`{"error":"...","code":"..."}` and exit with status 1.

## Notes and limitations

- The no-filter default is the public English/ICT category route
  `/information-technology-jobs-netherlands.html`. It is a category listing,
  not a complete all-sector Netherlands search.
- A keyword-only query uses `/all-jobs/keyword/<term>/`, which searches the
  broader Together Abroad vacancy index rather than restricting results to ICT.
- When `--location` is used, the portal's public form has no dependable city
  parameter. The location is therefore included in `main_keywords`; treat it
  as a search hint, not a geographic radius guarantee.
- `--jobage` is translated to the portal's four available publication buckets;
  exact arbitrary-day filtering is unavailable and values above 14 days are
  rejected rather than silently widened.
- Together Abroad listings may be syndicated or employer-hosted. The `url`
  remains the Together Abroad posting page, while `applyUrl` preserves a direct
  external employer/ATS destination found on the detail page.
- Reconnaissance found public pages with `index, follow` metadata. The fetched
  `robots.txt` response contained no disallow directives, and no explicit
  prohibition on low-volume automated access was found in the public pages
  checked. Keep requests low and re-check the portal's current robots and terms
  before repeated or bulk use; the portal's footer links to privacy and terms
  pages whose conventional URLs returned 404 during reconnaissance.
