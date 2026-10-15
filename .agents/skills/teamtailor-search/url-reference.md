# Teamtailor endpoint reference

Maintainer notes for `teamtailor-search`. Verified live 2026-10-15 (orgs
`combine` — 8 jobs, `bloqit` — 21 jobs).

## Endpoints

| Purpose | Request | Notes |
|---|---|---|
| Board feed | `GET https://<org>.teamtailor.com/jobs.json` | JSON Feed 1.x: `{version, title, home_page_url, feed_url, items:[...]}`; 404 when subdomain doesn't exist |
| Job page (human) | `GET https://<org>.teamtailor.com/jobs/<id>-<slug>` | not used by the CLI (the feed carries everything) |

## Item field map

| Feed field | Contract | Notes |
|---|---|---|
| `id` | `id` | uuid |
| `title` | `title` | |
| `url` | `url` | `https://<org>.teamtailor.com/jobs/<numericid>-<slug>` |
| `date_published` (ISO + tz) | `date` (YYYY-MM-DD slice) | |
| `content_html` | `description` | full JD HTML; stripped to text |
| `_jobposting` | location/employmentType | embedded schema.org JobPosting JSON-LD |

No pagination — the feed carries the whole board.
