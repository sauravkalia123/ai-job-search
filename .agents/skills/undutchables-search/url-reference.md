# Undutchables URL Reference

Researched against the public Undutchables site at
`https://undutchables.nl`.

> **Robots caveat:** `https://undutchables.nl/robots.txt` contains
> `Disallow: /vacancies?*`. Filtered search URLs below are therefore outside
> the site's published crawler allowance. This skill is documented and
> intended for low-volume personal use only.

## Search

```text
GET https://undutchables.nl/vacancies
GET https://undutchables.nl/vacancies/p2
```

For page `n`, the path is `/vacancies` for page 1 and `/vacancies/p<n>` for
later pages. Query parameters are retained on every page.

| Parameter | Meaning | Value used by this skill |
|-----------|---------|--------------------------|
| `discipline` | Vacancy discipline | `241` = IT-Engineering |
| `language` | Preferred language | `217` = English |
| `q` | Text search | User's `--query`, omitted when empty |
| `location` | Portal location filter | User's `--location`, omitted when empty |
| `suggestion` | Algolia location helper | Not sent; the server accepts the visible `location` field without it |
| `lat`, `lng` | Algolia location helper | Not sent; no coordinates are available from a text-only CLI |
| `jobage` | Posting-age filter | No such portal parameter was found; `--jobage` fails honestly with `UNSUPPORTED_FILTER` |

The search form is `#vacancy-finder-form` with `action="/vacancies"`.
Its relevant controls are `select[name="discipline"]`,
`select[name="language"]`, `input[name="location"]`, and
`input[name="q"]`.

## Result cards

The result page renders cards as:

```html
<a class="vacancy-item" href="https://undutchables.nl/vacancies/<slug>">
  <h4>Job title</h4>
  <div class="location">City</div>
</a>
```

The CLI splits and parses each `a.vacancy-item` independently. It derives the
stable `id` from the final URL path segment, reads the `h4` title and
`.location` text, and normalizes the URL to the Undutchables origin. Search
cards do not expose a company name or posting date; those fields are `null`.
There is no result-count element in the researched markup, so `meta.count` is
the number of parsed cards after the client-side `--limit` cap.

## Detail

```text
GET https://undutchables.nl/vacancies/<slug>
```

The detail page has `#vacancy-details`, an `h1` title, and an `h4` line such as
`Amsterdam, reference 2026-01018`. The main content is divided by `h2` labels:
`Job description`, `Requirements`, `Working conditions`, `Work location`,
`Company description`, and `Good to know`.

It also embeds a `script[type="application/ld+json"]` `JobPosting` object:

| JSON-LD field | Output field | Notes |
|---------------|--------------|-------|
| `title` | `title` | Fallback to the page `h1` |
| `description` | `description` | HTML is decoded and converted to readable text |
| `datePosted` | `date` | `DD-MM-YYYY` is normalized to `YYYY-MM-DD` |
| `hiringOrganization.name` | `company` | Used only when populated by the page |
| `hiringOrganization.sameAs` | `companyUrl` | Used only when populated |
| `jobLocation.address.addressLocality` | `location` | |
| `validThrough` | `deadline` | Empty values become `null` |
| `employmentType` | `employmentType` | Empty values become `null` |

The CLI supplements the JSON-LD description with the visible vacancy sections
when they are present. The `Apply` button opens an embedded form and has no
stable href, so `applyUrl` is `null` rather than a guessed form endpoint.

## Access and terms

- `robots.txt`: `/vacancies?*` is disallowed; `/vacancies` without a query and
  the detail path are not disallowed by the published file.
- The disclaimer says Undutchables content is protected and may not be copied
  or distributed without permission. Keep requests low, use the output only for
  personal job searching, and do not crawl or redistribute the board.
- Public pages require no login and no API token.
