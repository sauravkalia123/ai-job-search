# Greenhouse endpoint reference

Maintainer notes for `greenhouse-search`. Verified live 2026-10-15.

## robots.txt

boards-api.greenhouse.io: `User-agent: * Disallow: /embed/` — the `/v1/`
paths used here are permitted. job-boards.greenhouse.io serves HTTP 200.

## Endpoints

| Purpose | Request | Notes |
|---|---|---|
| Board list | `GET https://boards-api.greenhouse.io/v1/boards/<org>/jobs` | `{jobs:[...], meta:{}}`; 404 when board doesn't exist |
| Board list + descriptions | append `?content=true` | adds `content` (HTML) per job — not used by default |
| Detail | `GET https://boards-api.greenhouse.io/v1/boards/<org>/jobs/<id>` | `{id, title, content, location:{name}, absolute_url, updated_at, metadata, ...}` |
| (Never used) | `/embed/` paths | robots-disallowed |

## Field map

| Raw | Contract | Notes |
|---|---|---|
| `id` | `id` | numeric |
| `title` | `title` | |
| `location.name` | `location` | |
| `absolute_url` | `url` | `job-boards.greenhouse.io/<org>/jobs/<id>` |
| `updated_at` (ISO) | `date` | last update, NOT a created date — documented in SKILL.md |
| `departments[].name` | `department` (extra) | list endpoint |
| `content` (HTML) | `description` | detail endpoint; stripped to text |

Board URL forms recognized for detail: `job-boards.greenhouse.io/<org>/jobs/<id>`,
`greenhouse.io/<org>/jobs/<id>`, and the legacy `.../embed/job_board?for=<org>` pattern.
