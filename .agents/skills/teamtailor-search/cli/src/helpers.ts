// Data source: Teamtailor-hosted career sites (<sub>.teamtailor.com/jobs.json)
// — a JSON Feed whose items carry the full JobPosting. Personal use only.

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA = "Mozilla/5.0 (compatible; teamtailor-search-cli/1.0)"

export async function fetchJson(url: string): Promise<unknown> {
  const maxRetries = 6
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
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
    if (response.status === 404) return null
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`)
    }
    return response.json()
  }
  throw new Error("Request failed after max retries")
}

export interface FeedItem {
  id: string
  title: string
  url: string
  date: string | null
  contentHtml: string | null
  jobPosting: Record<string, unknown> | null
}

/** Parse a Teamtailor jobs.json (JSON Feed): returns items, or null if absent. */
export function parseFeed(payload: unknown): FeedItem[] | null {
  const feed = payload as { items?: unknown } | null
  if (!feed || !Array.isArray(feed.items)) return null
  const items: FeedItem[] = []
  for (const raw of feed.items) {
    if (raw === null || typeof raw !== "object") continue
    const j = raw as Record<string, unknown>
    const id = typeof j.id === "string" ? j.id : null
    const title = typeof j.title === "string" ? j.title : null
    const url = typeof j.url === "string" ? j.url : null
    if (!title || (!id && !url)) continue
    items.push({
      id: id ?? url!,
      title,
      url: url ?? id!,
      date: typeof j.date_published === "string" ? j.date_published.slice(0, 10) : null,
      contentHtml: typeof j.content_html === "string" ? j.content_html : null,
      jobPosting:
        j._jobposting !== null && typeof j._jobposting === "object"
          ? (j._jobposting as Record<string, unknown>)
          : null,
    })
  }
  return items
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
  let decoded = decodeHtmlEntities(html)
  if (/&(?:lt|gt|amp|quot|#\d+);/i.test(decoded)) decoded = decodeHtmlEntities(decoded)
  const withBreaks = decoded
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|ul|ol|div|h\d)>/gi, "\n")
  return decodeHtmlEntities(withBreaks.replace(/<[^>]+>/g, ""))
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

/** Flatten JobPosting jobLocation (Place|Place[]|string) to a short string. */
export function locationFromJobPosting(jp: Record<string, unknown> | null): string | null {
  if (!jp) return null
  const raw = jp.jobLocation
  const places = Array.isArray(raw) ? raw : raw !== null && typeof raw === "object" ? [raw] : []
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
