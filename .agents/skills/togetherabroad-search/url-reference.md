# Together Abroad URL Reference

Reconnaissance date: 2026-10-17. The portal is public and did not require a
credential for the routes below.

## Category search

```text
GET https://www.togetherabroad.nl/information-technology-jobs-netherlands.html
```

This is the public English/ICT category page linked from the site's category
navigation. Pagination is carried as `JobsListPage=<n>` in the query string.
The HTML result cards use the `jslItemContainer` wrapper. Within a card:

- `jslFunctionName` contains the title and the internal `/jobs/...html` link.
- `jslEmployee` contains the employer text when supplied.
- Publication text is rendered as `Published: today`, `yesterday`, or a
  relative/absolute date.
- A card link contains a numeric vacancy ID, normally in a URL like
  `/jobs/job-gnc-pointing-systems-engineer-947801-31.html`.

The route returned real ICT listings such as `GNC & Pointing Systems Engineer`
and `Senior Command & Data Handling Engineer` during reconnaissance.

## Keyword search

```text
GET https://www.togetherabroad.nl/all-jobs/keyword/<URL-encoded-term>/
```

The route is public and renders the same result-card HTML. `JobsListPage=<n>`
selects the page. It searches the broader vacancy index; it is not limited to
ICT. For example, the public `software engineer` route returned real postings
and displayed its current total in the results header.

## Form search

```text
POST https://www.togetherabroad.nl/index.php/page/advsearchvacs/bb/1
```

The visible search form uses `application/x-www-form-urlencoded` and these
fields:

| Field | Meaning | CLI mapping |
|---|---|---|
| `main_keywords` | Keyword text | `--query`, plus `--location` when supplied |
| `main_keywords_options[]` | Fields searched | `title`, `description`, `profile_culture`, `salary`, `chapo`, `refs` |
| `main_pubdate` | Publication bucket | `today`, `last3days`, `thisweek`, `last2weeks` from `--jobage` |
| `proximity_countryCode` | Country | `NL` for the Netherlands market |
| `proximity_zipCode` | Optional postcode | Not inferred from free-text `--location` |
| `command` | Form command | `submitrequest` |
| `origin` | Form origin | `hook` |
| `JobsListPage` | Page number | Query-string pagination on the POST URL |

The public form exposes country/postcode/distance controls but no stable free
text city field. The CLI therefore treats `--location` as an additional keyword
hint and documents that limitation.

## Detail

Canonical detail pages have this shape:

```text
GET https://www.togetherabroad.nl/jobs/<slug>-<vacancy-id>-31.html
```

The portal also serves an internal form:

```text
GET https://www.togetherabroad.nl/index.php/page/JobsRemote/command/detail/vid/<vacancy-id>/bb/1
```

The CLI accepts either URL or a numeric vacancy ID. Detail pages include a
`<script type="application/ld+json">` `JobPosting` object with `identifier`,
`hiringOrganization`, `jobLocation`, `title`, `description`, `datePosted`, and
`validThrough`. The parser uses those fields first and falls back to visible
Together Abroad headings for location/title where JSON-LD is incomplete.

The Apply button currently contains a JavaScript `location='https://...'`
destination. The parser exposes that direct employer/ATS destination as
`applyUrl` and keeps the Together Abroad page as `url`; it does not replace the
portal URL with the external destination.

## Access findings

- `https://www.togetherabroad.nl/robots.txt` returned no disallow directives in
  the reconnaissance fetch.
- Search and detail pages were reachable without login or an API key and carry
  `robots` metadata of `index, follow`.
- The footer links to privacy and terms pages, but the conventional
  `/privacy-policy`, `/privacy.html`, `/terms-and-conditions`, and
  `/terms-and-conditions.html` guesses returned 404 during reconnaissance. No
  explicit automated-access prohibition was observed in the public pages
  checked. Keep volume low and verify the current site policies before use.
