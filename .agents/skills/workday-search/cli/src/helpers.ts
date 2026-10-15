// Data sources: Workday tenant sites (e.g. cisco.wd5.myworkdayjobs.com).
// Search uses the site's own cxs JSON endpoint; detail uses the public job
// page's schema.org JobPosting JSON-LD. No authentication.
//
// Personal use only — keep volume low; no commercial or bulk use.

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA = "Mozilla/5.0 (compatible; workday-search-cli/1.0)"

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

export interface BoardTarget {
  host: string
  tenant: string
  site: string
}

/**
 * Parse a Workday board reference: "cisco.wd5.myworkdayjobs.com/Cisco_Careers"
 * (optionally with scheme, and with any extra path segments on a job URL).
 * tenant = the first DNS label; site = the first path segment.
 */
export function parseBoardTarget(raw: string): BoardTarget | null {
  const s = raw.trim().replace(/^https?:\/\//i, "")
  const segs = s.split("/").filter(Boolean)
  if (segs.length < 2) return null
  const host = segs[0].toLowerCase()
  const m = host.match(/^([a-z0-9][a-z0-9-]*)\.wd(\d+)\.myworkdayjobs\.com$/i)
  if (!m) return null
  return { host, tenant: m[1], site: segs[1] }
}

export async function searchJobs(
  target: BoardTarget,
  searchText: string | undefined,
  limit: number,
  offset: number,
): Promise<{ total: number; postings: Array<Record<string, unknown>> }> {
  const url = `https://${target.host}/wday/cxs/${target.tenant}/${target.site}/jobs`
  const body: Record<string, unknown> = { appliedFacets: {}, limit, offset }
  if (searchText) body.searchText = searchText
  const response = await backoffFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`)
  }
  const payload = (await response.json()) as Record<string, unknown>
  const postings = Array.isArray(payload.jobPostings) ? payload.jobPostings : []
  const total = typeof payload.total === "number" ? payload.total : postings.length
  return { total, postings }
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

export function htmlToText(html: string): string {
  const withBreaks = html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|ul|ol|div|h\d)>/gi, "\n")
  return decodeHtmlEntities(withBreaks.replace(/<[^>]+>/g, ""))
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export function extractJobPostingLd(html: string): Record<string, unknown> | null {
  const blocks = html.matchAll(
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
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
