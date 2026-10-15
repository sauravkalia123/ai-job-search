// Data source: Personio-hosted career sites (<org>.jobs.personio.com/xml) —
// the public XML feed that also powers their job-board integrations.
// Personal use only — keep volume low.

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA = "Mozilla/5.0 (compatible; personio-search-cli/1.0)"

export async function fetchXml(url: string): Promise<string> {
  const maxRetries = 6
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/xml,text/xml,*/*" },
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
    if (response.status === 404) return ""
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`)
    }
    return response.text()
  }
  throw new Error("Request failed after max retries")
}

export function decodeEntities(text: string): string {
  const numericEntity = (cp: number) =>
    cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : ""
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => numericEntity(parseInt(dec, 10)))
    .replace(/&#[xX]([0-9a-fA-F]+);/g, (_, hex) => numericEntity(parseInt(hex, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
}

/** Plain-text field value from an XML chunk: strips CDATA + decodes entities. */
export function field(chunk: string, tag: string): string | null {
  const m = chunk.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))
  if (!m) return null
  const inner = m[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .trim()
  return decodeEntities(inner) || null
}

/** HTML fragment (Personio jobDescription) -> readable text. */
export function htmlToText(html: string): string {
  let decoded = decodeEntities(html)
  if (/&(?:lt|gt|amp|quot|#\d+);/i.test(decoded)) decoded = decodeEntities(decoded)
  const withBreaks = decoded
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|ul|ol|div|h\d)>/gi, "\n")
  return decodeEntities(withBreaks.replace(/<[^>]+>/g, ""))
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

/** Split the feed into per-position chunks (one malformed position is skipped). */
export function parsePositions(xml: string): string[] {
  return xml.split(/<position>/).slice(1).map((c) => c.split("</position>")[0])
}

/** ISO date prefix (YYYY-MM-DD) from a Personio createdAt value, else null. */
export function isoDate(v: string | null): string | null {
  return v && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null
}
