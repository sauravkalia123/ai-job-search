// Data sources: Ashby's open non-user GraphQL API for board search, and the
// public job pages' schema.org JobPosting JSON-LD for detail. No authentication.
//
// ⚠️ Personal use only. jobs.ashbyhq.com/robots.txt disallows /api/ — the
// user has explicitly accepted this caveat for personal, low-volume use.
// Keep volume low; no commercial or bulk use.

export const GRAPHQL_URL = "https://jobs.ashbyhq.com/api/non-user-graphql"
export const BOARD_URL_BASE = "https://jobs.ashbyhq.com"

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA = "Mozilla/5.0 (compatible; ashby-search-cli/1.0)"

export async function backoffFetch(url: string, init: RequestInit): Promise<Response> {
  const maxRetries = 6
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      ...init,
      headers: { "User-Agent": UA, ...(init.headers as Record<string, string>) },
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
    })
    if (response.status === 429 || response.status >= 500) {
      if (attempt === maxRetries) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`)
      }
      const jitter = Math.floor(Math.random() * 500)
      await new Promise((r) => setTimeout(r, delay + jitter))
      delay = Math.min(delay * 2, 8000)
      continue
    }
    return response
  }
  throw new Error("Request failed after max retries")
}

const BOARD_QUERY =
  "query ApiJobBoardWithTeamsQuery($organizationHostedJobsPageName: String!) { " +
  "jobBoardWithTeams(organizationHostedJobsPageName: $organizationHostedJobsPageName) { " +
  "jobPostings { id title employmentType teamId locationName } } }"

export interface PostingBrief {
  id: string
  title: string
  employmentType: string | null
  teamId: string | null
  locationName: string | null
}

/**
 * Fetch one organization's board. Per-org only: Ashby's public API has no
 * global keyword search (verified 2026-10-15).
 */
export async function fetchBoardPostings(board: string): Promise<PostingBrief[]> {
  const response = await backoffFetch(`${GRAPHQL_URL}?op=ApiJobBoardWithTeamsQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      operationName: "ApiJobBoardWithTeamsQuery",
      variables: { organizationHostedJobsPageName: board },
      query: BOARD_QUERY,
    }),
  })
  if (response.status === 404) return []
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`)
  }
  const payload = (await response.json()) as {
    data?: { jobBoardWithTeams?: { jobPostings?: unknown } }
    errors?: Array<{ message?: string }>
  }
  if (payload.errors?.length) {
    const first = payload.errors[0]?.message ?? "unknown GraphQL error"
    throw new Error(`GraphQL error: ${first}`)
  }
  const postings = payload.data?.jobBoardWithTeams?.jobPostings
  if (!Array.isArray(postings)) return []
  const results: PostingBrief[] = []
  for (const raw of postings) {
    const p = raw as Record<string, unknown>
    if (typeof p.id !== "string" || typeof p.title !== "string") continue
    results.push({
      id: p.id,
      title: p.title,
      employmentType: typeof p.employmentType === "string" ? p.employmentType : null,
      teamId: typeof p.teamId === "string" ? p.teamId : null,
      locationName: typeof p.locationName === "string" ? p.locationName : null,
    })
  }
  return results
}

export function decodeHtmlEntities(text: string): string {
  const numericEntity = (cp: number) =>
    cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : ""
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => numericEntity(parseInt(dec, 10)))
    .replace(/&#[xX]([0-9a-fA-F]+);/g, (_, hex) => numericEntity(parseInt(hex, 16)))
    .replace(/&nbsp;/g, " ")
}

/** HTML fragment -> readable text, keeping block-level breaks as newlines. */
export function htmlToText(html: string): string {
  const withBreaks = html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|ul|ol|div|h\d)>/gi, "\n")
  return decodeHtmlEntities(withBreaks.replace(/<[^>]+>/g, ""))
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

/** Extract the schema.org JobPosting JSON-LD object from a job page. */
export function extractJobPostingLd(html: string): Record<string, unknown> | null {
  const blocks = html.matchAll(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
  )
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block[1]) as Record<string, unknown>
      if (parsed["@type"] === "JobPosting") return parsed
    } catch {
      // one malformed block must not break the scan
    }
  }
  return null
}

/** Flatten jobLocation (Place | Place[] | string) to a short location string. */
export function locationFromJobLocation(v: unknown): string | null {
  const places = Array.isArray(v) ? v : v !== null && typeof v === "object" ? [v] : []
  const parts: string[] = []
  for (const place of places) {
    if (place === null || typeof place !== "object") continue
    const address = (place as Record<string, unknown>).address
    if (address !== null && typeof address === "object") {
      const a = address as Record<string, unknown>
      const locality = typeof a.addressLocality === "string" ? a.addressLocality : null
      const region = typeof a.addressRegion === "string" ? a.addressRegion : null
      const joined = [locality, region].filter(Boolean).join(", ")
      if (joined) parts.push(joined)
    }
  }
  return parts.length > 0 ? parts.join(" | ") : null
}
