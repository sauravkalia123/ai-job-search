# SmartRecruiters endpoint reference

Maintainer notes for `smartrecruiters-search`. Verified live 2026-10-15
(orgs TAPI=31, QantasGroup=67, Syntegon=108 postings).

## Endpoints

| Purpose | Request | Notes |
|---|---|---|
| Board list | `GET https://api.smartrecruiters.com/v1/companies/<org>/postings?limit=100&q=<kw>` | `{totalFound, offset, limit, content:[...]}`; `q` is server-side full-text |
| Detail | `GET https://api.smartrecruiters.com/v1/companies/<org>/postings/<id>` | includes `jobAd` |
| Job page (human) | `GET https://jobs.smartrecruiters.com/<org>/<id>` | not used by the CLI |

## List item field map

| Raw | Contract | Notes |
|---|---|---|
| `id` | `id` | |
| `name` | `title` | |
| `location.{city,region,country}` | `location` | joined with ", " |
| `releasedDate` (ISO) | `date` | posting release date |
| `department.label` | `department` | |

## Detail extras

`jobAd.sections.jobDescription.{text,html}` — description (html preferred,
stripped to text). Also `qualifications` and other sections if ever needed.
