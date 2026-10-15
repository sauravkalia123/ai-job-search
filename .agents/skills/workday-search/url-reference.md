# Workday tenant endpoint reference

Maintainer notes for `workday-search`. Verified live 2026-10-15 on
`cisco.wd5.myworkdayjobs.com`.

## robots.txt (per tenant — re-check per board)

cisco.wd5: `Sitemap: .../Cisco_Careers/siteMap.xml`; `User-agent: * Allow:
/Cisco_Careers/ Disallow: /refreshFacet/`. The cxs path (`/wday/cxs/...`)
matches no rule → default allow. Documented per tenant; if a tenant
disallows it, skip that tenant.

## Endpoints

| Purpose | Request | Notes |
|---|---|---|
| Search | `POST https://<host>/wday/cxs/<tenant>/<site>/jobs` | Body `{"appliedFacets":{},"limit":20,"offset":0,"searchText":"..."}`; JSON response `{facets, jobPostings, total, userAuthenticated}` |
| Detail | `GET https://<host>/<site>/<externalPath>` | SSR HTML with one `application/ld+json` JobPosting block |

`externalPath` in list results already starts with `/job/...`; the detail URL
is `https://<host>/<site>` + externalPath (do NOT add another `/job/`).

**Do not use** `POST .../wday/cxs/<tenant>/<site>/job/<externalPath>`: it
returned HTTP 400 on cisco.wd5 (verified 2026-10-15); the HTML page +
JSON-LD route is the reliable one.

## Search response field map

| Raw | Contract | Notes |
|---|---|---|
| `title` | `title` | |
| `externalPath` | `id` and URL suffix | starts with `/job/` |
| `locationsText` | `location` | |
| `postedOn` | `postedOn` (extra) | relative label ("Posted 2 Days Ago") — never converted to a date |
| — | `date` | always `null` at search level (no real date in this payload) |
| — | `company` | the tenant name (org name comes from detail JSON-LD) |

## Detail JSON-LD

`@type: JobPosting`: `title`, `description` (HTML), `datePosted` (ISO),
`hiringOrganization.name`, `jobLocation` (Place[] → addressLocality +
addressRegion), `employmentType`, `identifier`, `applicantLocationRequirements`,
`jobLocationType`.
