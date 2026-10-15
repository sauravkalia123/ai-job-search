# Ashby (jobs.ashbyhq.com) Endpoint Reference

Maintainer notes for `ashby-search`. If the CLI breaks, check these anchors.
Verified live 2026-10-15.

## robots.txt (as of 2026-10-15)

- Disallowed: `/api/`, `/meeting/`, `/b/`
- The board-search GraphQL endpoint (`/api/non-user-graphql`) is therefore
  **robots-disallowed** — used only on the user's explicit acceptance of the
  caveat, personal use, low volume. The detail page path (`/<org>/<id>`) is
  not disallowed.

## Endpoints

| Purpose | Request | Notes |
|---|---|---|
| Board search | `POST https://jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobBoardWithTeamsQuery` | JSON body: `{operationName, variables:{organizationHostedJobsPageName}, query}`; HTTP 200, no auth, honest UA fine |
| Detail | `GET https://jobs.ashbyhq.com/<org>/<postingId>` | SSR HTML with one `application/ld+json` JobPosting block |
| Frontend assets | `https://cdn.ashbyprd.com/frontend_non_user/<hash>/...` | Only needed to re-derive operation names after a redesign |

## GraphQL (verified shape)

Operation (recovered from the SPA bundle, validated live):

```graphql
query ApiJobBoardWithTeamsQuery($organizationHostedJobsPageName: String!) {
  jobBoardWithTeams(organizationHostedJobsPageName: $organizationHostedJobsPageName) {
    jobPostings { id title employmentType teamId locationName }
  }
}
```

- Response: `data.jobBoardWithTeams.jobPostings[]`
- Rejected field names on `JobPostingBriefsWithIdsAndTeamId` (recorded so
  nobody retries them): `location`, `isRemote`, `applyUrl`, `departmentName`,
  `publishedDate`; on `JobBoard`: `id`, `name`
- Validation errors hide "did you mean" suggestions; probe one field at a time

## Detail page

One `application/ld+json` block with `@type: "JobPosting"`:

| JSON-LD field | Contract field |
|---|---|
| `title` | `title` |
| `hiringOrganization.name` | `company` |
| `jobLocation` (Place/Place[] → addressLocality, addressRegion) | `location` |
| `datePosted` (ISO) | `date` |
| `description` (HTML) | `description` (tags stripped, entities decoded) |
| `employmentType` | `employmentType` |
| `identifier`, `directApply` | available if ever needed |

## Notes

- Per-org only — the public API has no global keyword search.
- Board briefs carry no dates; dates come from detail `datePosted`.
- Board page loads without a Cloudflare challenge for honest UAs
  (verified 2026-10-15); if that changes, stop — no bypassing.
