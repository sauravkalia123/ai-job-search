# cutshort.io URL & Payload Reference

Maintainer notes for `cutshort-search`. If the CLI suddenly returns zero
results or null fields, the portal changed one of the anchors below — update
`cli/src/helpers.ts` accordingly. Verified live 2026-10-15.

## robots.txt (as of 2026-10-15)

- Disallowed: `/apply/`, `/view/j/`, `/vj/`, `/profile/`
- Permitted: `/jobs`, `/job/<slug>` (the paths this CLI uses)

## Endpoints

| Purpose | Request | Notes |
|---|---|---|
| Search | `GET https://cutshort.io/jobs?searchKeyword=<url-encoded query>` | SSR HTML, HTTP 200, honest UA accepted |
| Default listing | `GET https://cutshort.io/jobs` | Same shape, no keyword |
| Detail | `GET https://cutshort.io/job/<slug>` | SSR HTML; 404 when posting is gone |
| (Never used) apply path | `https://cutshort.io/profile/view/j/<_id>` | Login-gated + robots-disallowed; appears in payloads as `authApplyUrl` — do not fetch or store |

**Pagination: none.** `&page=2` returns the same result set as page 1
(server ignores the parameter). A search is always a single request; the CLI
deliberately offers no `--page` flag.

## Search payload

Everything is inside `<script id="__NEXT_DATA__">` as JSON:

```
props.pageProps.dehydratedState.queries[*]
  .state.data.data.pageData.jobs[]        <- the result array
```

Walk `queries` in order and take the first slot whose `pageData` has `jobs`
(other slots hold facets/filters).

### Job object field map

| Raw field | Contract field | Notes |
|---|---|---|
| `_id` | (fallback id) | Mongo-style id |
| `headline` | `title` | |
| `publicUrl` | `url` and `id` | `https://cutshort.io/job/<slug>`; `id` = last path segment |
| `companyDetails.name` | `company` | fallback `jobFactSummary.companyName` |
| `locationsText` | `location` | fallback `jobFactSummary.locations` (e.g. "Bengaluru (Bangalore)", "Remote only") |
| `jobFactSummary.postedDate` | `date` | ISO timestamp; CLI slices to `YYYY-MM-DD` |
| `jobFactSummary.experience` | `experience` | vanity range, e.g. "11 - 20 years" |
| `salaryRangeText` | `salary` | e.g. "₹60L - ₹70L / yr", "Best in industry" |
| `allSkills` | `skills` | string array, joined |
| `remoteType` | `remoteType` | e.g. `remote_only`, `remote_not_okay` |
| `authApplyUrl` | — | login-gated, robots-disallowed; never store |

## Detail payload

Same `__NEXT_DATA__` frame. Two sources inside `dehydratedState.queries[*].state.data.data`:

1. **`seoData.jsonlds[]`** — schema.org objects. Take the entry with
   `@type == "JobPosting"`:
   - `description` — **full JD as HTML** (`<p>`, `<strong>`, lists); the CLI
     strips tags and decodes entities, keeping paragraph/list breaks
   - `datePosted` — ISO timestamp
   - `title`, `employmentType` (string or array), `skills`,
     `hiringOrganization.name`, `baseSalary`, `identifier`, `directApply`
2. **`pageData.jobFactSummary`** — vanity facts (`roleTitle`, `companyName`,
   `locations`, `experience`, `salary`, `postedDate`, `postedDateLabel`)

`isActive` is `true` only when a JobPosting JSON-LD was found; a 404 or
unparseable page exits 1 with `NOT_FOUND` (the CLI never renders empty
content as a live posting).

**Quirk:** a renewed listing can carry a *different* `datePosted` on the
detail page than the search-level `postedDate` (each is the portal's own
value for that endpoint; neither is inferred).

## Error conventions

- Errors → stderr as `{"error": "...", "code": "..."}`, exit 1
  (`UNKNOWN_FLAG`, `BAD_ARG`, `NO_ID`, `BAD_ID`, `FETCH_FAILED`, `NOT_FOUND`,
  `BAD_CMD`, `INTERNAL_ERROR`)
- 429/5xx: exponential backoff + jitter, max ~6 retries, then `FETCH_FAILED`
- 404 on detail → `NOT_FOUND` (never null-fields pretending to be a live job)
