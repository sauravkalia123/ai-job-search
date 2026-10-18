# IND Sponsors URL Reference

Investigated against the public site on 17 October 2026. The site is an
aggregator and its job cards link out to the source job board or employer site.

## Search

```text
GET https://indsponsors.nl/jobs
```

Observed URL parameters:

| Parameter | Meaning | CLI handling |
|---|---|---|
| `query` | Search text retained by the page URL | Sent as a URL hint and matched locally |
| `page` | Page number retained by the page URL | Sent as a URL hint and paged locally |
| `jobage` | No stable server-side age filter observed | Applied locally from the card date |
| `limit` | Not a portal parameter | Applied locally |

The public response showed the heading `Showing 1–25 of 52 jobs`, `Per page25`,
and repeated external links for each card. Requests such as
`/jobs?query=software`, `/jobs?page=2`, and alternate keyword/page parameter
names returned the same server-rendered card set during reconnaissance. The
CLI therefore does not claim that the URL parameters are server-side filters.
It sends `query` and `page` for forward compatibility, then applies the filters
to the HTML it actually received. The current plain HTML page exposes only the
currently rendered 25-card set.

`robots.txt` is available at `https://indsponsors.nl/robots.txt` and contains
`User-agent: *` / `Allow: /`. The Terms at `https://indsponsors.nl/terms`
prohibit scraping, crawling, redistribution, and automated tools or AI agents
without prior written permission; the skill documents low-volume personal use
and does not bypass that restriction.

## Search-card structure

The observed rendered card sequence contains:

1. an external source link with text like `View <title> at <company>`;
2. the listing heading (`h3` in the observed page);
3. company text, sometimes an `indsponsors.nl/company/...` link;
4. a location such as `Amsterdam, NL`, `Leeuwarden, NL`, `Drachten, NL`, or `NL`;
5. a source date/fetched date and a second `View Job` link to the same external URL.

The parser splits the HTML at the first occurrence of each repeated external
listing URL, then parses each card independently. It accepts heading and
location class variations rather than depending on a framework-generated class
name. This keeps one malformed card from invalidating the rest.

The card result shape is:

```json
{
  "id": "https://external-source.example/jobs/role",
  "title": "Role title",
  "company": "Company or null",
  "location": "Amsterdam, NL or null",
  "date": "2026-08-25 or null",
  "url": "https://external-source.example/jobs/role"
}
```

The external URL is deliberate: it is the usable detail/apply destination and
the aggregator does not provide a stable internal job identifier in the public
card markup.

## Detail

Detail receives the external URL from a search result and fetches it directly.
External source markup varies, so the parser tries these sources in order:

1. `<script type="application/ld+json">` objects whose `@type` is
   `JobPosting` (including `@graph` and arrays): `title`, `hiringOrganization`,
   `jobLocation`, `datePosted`, `validThrough`, `employmentType`, `description`
   and `url`;
2. Open Graph and description metadata plus the first visible `<h1>`;
3. visible body text and anchors whose text or path indicates applying.

The response includes `applyUrl` when an application link can be identified,
`deadline` from JSON-LD `validThrough`, and `isActive` based on that deadline
when available. All source links remain external and must be verified before
use. A 404 becomes `NOT_FOUND`; a 402/403/block page or markup without a usable
title is reported rather than fabricated as a job.
