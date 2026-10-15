# Personio endpoint reference

Maintainer notes for `personio-search`. Verified live 2026-10-15 (org
`mm-software-gmbh`, 29 positions).

## Endpoints

| Purpose | Request | Notes |
|---|---|---|
| Board feed | `GET https://<org>.jobs.personio.com/xml` | XML `<workzag-jobs><position>...`; 404 when board doesn't exist |
| Job page (human) | `GET https://<org>.jobs.personio.com/job/<id>` | not used by the CLI (the feed carries everything) |

## Position field map (verified)

| Field | Contract | Notes |
|---|---|---|
| `id` | `id` | numeric |
| `name` | `title` | |
| `office` | `location` | plus `additionalOffices/office` entries (not merged) |
| `department` | extra (filterable) | entity-encoded (`&amp;`) — decoded |
| `createdAt` (ISO + tz) | `date` (YYYY-MM-DD slice) | |
| `employmentType`, `seniority`, `recruitingCategory`, `occupation`, `yearsOfExperience` | extras | |
| `jobDescription` / `jobDescriptions` | `description` | HTML, possibly entity-escaped; decode-before-strip |

## Parsing notes

- Chunked per `<position>`; each chunk parsed independently.
- Fields may be CDATA-wrapped; CDATA markers are stripped before decoding.
- Decode-then-strip ordering matters (same lesson as greenhouse-search).
