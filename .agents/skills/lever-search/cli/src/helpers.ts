// Data source: Lever's public postings API (api.lever.co/v0/postings/<org>).
// No authentication. robots.txt: Allow all, Crawl-delay 1 — keep volume low.
//
// Personal use only — no commercial or bulk use.

export const API_BASE = "https://api.lever.co/v0/postings"

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA = "Mozilla/5.0 (compatible; lever-search-cli/1.0)"

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

/** Fetch one org's postings; returns null when the board does not exist. */
export async function fetchPostings(org: string): Promise<Array<Record<string, unknown>> | null> {
  const payload = await fetchJson(`${API_BASE}/${encodeURIComponent(org)}?mode=json`)
  if (payload === null) return null
  if (Array.isArray(payload)) return payload as Array<Record<string, unknown>>
  // Lever answers missing boards with {"ok":false,"error":"Document not found"}.
  return null
}

export interface Posting {
  id: string
  title: string
  company: string
  location: string | null
  team: string | null
  commitment: string | null
  workplaceType: string | null
  date: string | null
  url: string
  description: string | null
}

/** Normalize a raw lever posting. descriptionPlain preferred over HTML. */
export function mapPosting(raw: Record<string, unknown>, org: string): Posting | null {
  const id = typeof raw.id === "string" ? raw.id : null
  const title = typeof raw.text === "string" ? raw.text : null
  if (!id || !title) return null
  const cats =
    raw.categories !== null && typeof raw.categories === "object"
      ? (raw.categories as Record<string, unknown>)
      : {}
  const createdAt = typeof raw.createdAt === "number" ? raw.createdAt : null
  const hostedUrl =
    typeof raw.hostedUrl === "string" ? raw.hostedUrl : `https://jobs.lever.co/${org}/${id}`
  const plain = typeof raw.descriptionPlain === "string" ? raw.descriptionPlain : null
  const html = typeof raw.description === "string" ? raw.description : null
  return {
    id,
    title,
    company: org,
    location: typeof cats.location === "string" ? cats.location : null,
    team: typeof cats.team === "string" ? cats.team : null,
    commitment: typeof cats.commitment === "string" ? cats.commitment : null,
    workplaceType: typeof raw.workplaceType === "string" ? raw.workplaceType : null,
    date: createdAt ? new Date(createdAt).toISOString().slice(0, 10) : null,
    url: hostedUrl,
    description: plain ?? (html ? htmlToText(html) : null),
  }
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

/** Parse a jobs.lever.co/<org>/<id> URL into its parts. */
export function parseHostedUrl(url: string): { org: string; id: string } | null {
  const m = url.split("?")[0].match(/^https?:\/\/jobs\.lever\.co\/([a-z0-9_-]+)\/([a-z0-9-]+)$/i)
  return m ? { org: m[1], id: m[2] } : null
}
