// Data source: Greenhouse's public boards API (boards-api.greenhouse.io).
// No authentication. robots.txt disallows only /embed/ — the API paths used
// here are permitted (verified 2026-10-15).
//
// Personal use only — keep volume low; no commercial or bulk use.

export const API_BASE = "https://boards-api.greenhouse.io/v1/boards"

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA = "Mozilla/5.0 (compatible; greenhouse-search-cli/1.0)"

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
  // Greenhouse escapes its content (it arrives as "&lt;div&gt;..."), so decode
  // FIRST — stripping tags before decoding would let the decode resurrect
  // them. Decode twice if still double-escaped.
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

/** Normalize a job-boards.greenhouse.io absolute_url to its API detail path. */
export function boardTargetFromUrl(url: string): { org: string; id: string } | null {
  const m = url
    .split("?")[0]
    .match(/^https?:\/\/(?:job-boards\.)?greenhouse\.io\/(?:embed\/job_board\?for=)?([a-z0-9_-]+)\/jobs\/(\d+)/i)
  if (!m) return null
  return { org: m[1], id: m[2] }
}
