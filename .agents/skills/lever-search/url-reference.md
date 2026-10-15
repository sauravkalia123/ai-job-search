# Lever endpoint reference

Maintainer notes for `lever-search`. Verified live 2026-10-15 (org `tala`).

## robots.txt

api.lever.co: `User-agent: * Allow: /` + `Crawl-delay: 1`. Honor the delay by
keeping request volume low (the CLI makes 1 call per search, 2 per detail).

## Endpoints

| Purpose | Request | Notes |
|---|---|---|
| Board postings | `GET https://api.lever.co/v0/postings/<org>?mode=json` | Bare JSON array on success; `{"ok":false,"error":"Document not found"}` when the board doesn't exist |
| Detail | same call, then filter by `id` | mode=json already carries full descriptions — no separate detail endpoint needed |

## Posting field map (mode=json)

| Raw | Contract | Notes |
|---|---|---|
| `id` | `id` | hex id |
| `text` | `title` | |
| `hostedUrl` | `url` | `jobs.lever.co/<org>/<id>` |
| `createdAt` (epoch ms) | `date` | true posting date, ISO-sliced |
| `categories.location` | `location` | |
| `categories.team` / `categories.commitment` | extras | |
| `workplaceType` | extra | |
| `descriptionPlain` | `description` | HTML `description` stripped as fallback |

## Quirks

- Error shape is a 200-or-4xx JSON object, not an array — the CLI treats any
  non-array response as "board not found" rather than crashing.
- Some orgs that historically used Lever return Document-not-found today
  (they moved off); probe with the org's jobs.lever.co URL when unsure.
