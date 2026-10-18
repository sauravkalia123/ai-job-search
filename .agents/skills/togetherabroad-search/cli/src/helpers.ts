export const BASE_URL = "https://www.togetherabroad.nl"
export const CATEGORY_URL = `${BASE_URL}/information-technology-jobs-netherlands.html`
export const SEARCH_URL = `${BASE_URL}/index.php/page/advsearchvacs/bb/1`
export const DETAIL_ROUTE = `${BASE_URL}/index.php/page/JobsRemote/command/detail/vid`

const USER_AGENT = "Mozilla/5.0 (compatible; togetherabroad-search-cli/1.0)"

function isPortalHost(hostname: string): boolean {
  return hostname === "togetherabroad.nl" || hostname.endsWith(".togetherabroad.nl")
}

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

export interface FetchOptions {
  method?: "GET" | "POST"
  body?: string
  headers?: Record<string, string>
}

/** Fetch public HTML with exponential backoff and jitter on throttling/server errors. */
export async function htmlFetch(url: string, options: FetchOptions = {}): Promise<string> {
  const maxRetries = 6
  let delay = 500

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      method: options.method ?? "GET",
      body: options.body,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,nl;q=0.8",
        ...(options.method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
        ...options.headers,
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    })

    if (response.status === 429 || response.status >= 500) {
      if (attempt === maxRetries) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`)
      }
      const jitter = Math.floor(Math.random() * 500)
      await new Promise((resolve) => setTimeout(resolve, delay + jitter))
      delay = Math.min(delay * 2, 8000)
      continue
    }
    if (response.status === 404) return ""
    if (!response.ok) throw new Error(`Request failed: ${response.status} ${response.statusText}`)
    return response.text()
  }

  throw new Error("Request failed after max retries")
}

export interface JobCard {
  id: string
  title: string
  company: string | null
  companyUrl: string | null
  location: string | null
  date: string | null
  deadline: string | null
  url: string
  description: string | null
}

export interface JobDetail extends JobCard {
  employmentType: string | null
  applyUrl: string | null
  isActive: boolean
  reference: string | null
}

function numericEntity(code: number): string {
  return code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : ""
}

function decodeEntitiesOnce(text: string): string {
  return text
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, decimal: string) => numericEntity(Number.parseInt(decimal, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hexadecimal: string) => numericEntity(Number.parseInt(hexadecimal, 16)))
}

export function decodeHtmlEntities(text: string): string {
  let result = text
  for (let i = 0; i < 3; i++) {
    const next = decodeEntitiesOnce(result)
    if (next === result) break
    result = next
  }
  return result
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ")
}

export function cleanInline(html: string): string {
  return decodeHtmlEntities(stripTags(html)).replace(/\s+/g, " ").trim()
}

export function cleanRichText(html: string): string {
  const withBreaks = html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|li|ul|ol|div|h[1-6]|tr)>/gi, "\n")
  return decodeHtmlEntities(stripTags(withBreaks))
    .split(/\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function findMatchingDiv(html: string, openIndex: number, openTagEnd: number): number {
  let depth = 1
  const tagRe = /<\/?div\b[^>]*>/gi
  tagRe.lastIndex = openTagEnd
  let match: RegExpExecArray | null
  while ((match = tagRe.exec(html)) !== null) {
    if (/^<\s*div\b/i.test(match[0])) depth++
    else depth--
    if (depth === 0) return match.index + match[0].length
  }
  return html.length
}

/** Extract each result card independently so malformed markup affects one card only. */
function extractCardBlocks(html: string): string[] {
  const blocks: string[] = []
  const openRe = /<div\b[^>]*class=["'][^"']*\bjslItemContainer\b[^"']*["'][^>]*>/gi
  let match: RegExpExecArray | null
  while ((match = openRe.exec(html)) !== null) {
    const end = findMatchingDiv(html, match.index, match.index + match[0].length)
    blocks.push(html.slice(match.index, end))
    openRe.lastIndex = end
  }
  return blocks
}

function absoluteUrl(value: string): string {
  try {
    return new URL(decodeHtmlEntities(value), BASE_URL).toString()
  } catch {
    return value
  }
}

function idFromUrl(url: string): string | null {
  const path = decodeHtmlEntities(url)
  const all = [...path.matchAll(/-(\d{5,})(?:-|\.html|$)/g)].map((m) => m[1])
  return all[0] ?? path.match(/\/vid\/(\d+)/i)?.[1] ?? null
}

function normalizeDate(value: string | null): string | null {
  if (!value) return null
  const text = cleanInline(value).toLowerCase()
  if (!text) return null
  if (/^today$/.test(text)) return new Date().toISOString().slice(0, 10)
  if (/^yesterday$/.test(text)) return new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  let match = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) return `${match[1]}-${match[2]}-${match[3]}`
  match = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/)
  if (match) return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`
  return cleanInline(value) || null
}

function fieldByClass(block: string, className: string): string | null {
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = block.match(new RegExp(`<[^>]+class=["'][^"']*\\b${escaped}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/[^>]+>`, "i"))
  return match ? cleanInline(match[1]) || null : null
}

function parseCardBlock(block: string, hrefHint?: string, titleHint?: string): JobCard | null {
  const href = hrefHint ?? block.match(/href=["']([^"']*(?:\/jobs\/[^"']+|\/index\.php\/page\/JobsRemote\/command\/detail\/[^"']+))["']/i)?.[1]
  if (!href) return null
  const url = absoluteUrl(href)
  const id = idFromUrl(url)
  if (!id) return null

  const title = fieldByClass(block, "jslFunctionName") ?? titleHint ?? null
  if (!title) return null
  const company = fieldByClass(block, "jslEmployee")
  const location = fieldByClass(block, "jslLocation") ?? fieldByClass(block, "jslArea")
  const description = fieldByClass(block, "jslChapo")
  const plain = cleanInline(block)
  const published = plain.match(/\bPublished:\s*(today|yesterday|\d{1,2}[./-]\d{1,2}[./-]\d{4}|\d{4}-\d{2}-\d{2})\b/i)?.[1] ?? null
  const companyLink = block.match(/class=["'][^"']*\bjslEmployee\b[^"']*["'][\s\S]*?href=["']([^"']+)["']/i)?.[1] ?? null

  return {
    id,
    title,
    company,
    companyUrl: companyLink ? absoluteUrl(companyLink) : null,
    location,
    date: normalizeDate(published),
    deadline: null,
    url,
    description: description || null,
  }
}

/** Parse Together Abroad's card HTML, with a link-based fallback for markup drift. */
export function parseJobCards(html: string): JobCard[] {
  const results: JobCard[] = []
  const seen = new Set<string>()

  for (const block of extractCardBlocks(html)) {
    const card = parseCardBlock(block)
    if (card && !seen.has(card.id)) {
      seen.add(card.id)
      results.push(card)
    }
  }

  if (results.length > 0) return results

  const linkRe = /<a\b[^>]*href=["']([^"']*(?:\/jobs\/[^"']+|\/index\.php\/page\/JobsRemote\/command\/detail\/[^"']+))["'][^>]*>([\s\S]*?)<\/a>/gi
  let match: RegExpExecArray | null
  while ((match = linkRe.exec(html)) !== null) {
    const title = cleanInline(match[2])
    if (!title || /^\s*$/.test(title)) continue
    const around = html.slice(Math.max(0, match.index - 2500), Math.min(html.length, match.index + 5000))
    const card = parseCardBlock(around, match[1], title)
    if (card && !seen.has(card.id)) {
      seen.add(card.id)
      results.push(card)
    }
  }
  return results
}

export function parseResultCount(html: string): number | null {
  const text = cleanInline(html)
  if (/\b0\s+jobs found\b/i.test(text)) return 0
  const match = text.match(/([\d.,]+)\s+jobs found\b/i)
  if (!match) return null
  const number = Number.parseInt(match[1].replace(/[.,]/g, ""), 10)
  return Number.isFinite(number) ? number : null
}

function metaContent(html: string, key: string): string | null {
  const match = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${key}["']`, "i"))
  return match ? decodeHtmlEntities(match[1] ?? match[2]).trim() || null : null
}

function visibleHtml(html: string): string {
  return html
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
}

function extractJsonLd(html: string): Record<string, unknown> | null {
  const scripts = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
  for (const script of scripts) {
    try {
      const parsed: unknown = JSON.parse(script[1].trim())
      const candidates = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === "object" && Array.isArray((parsed as { "@graph"?: unknown[] })["@graph"])
          ? (parsed as { "@graph": unknown[] })["@graph"]
          : [parsed]
      const posting = candidates.find((item): item is Record<string, unknown> => {
        if (!item || typeof item !== "object") return false
        const type = (item as { "@type"?: unknown })["@type"]
        return type === "JobPosting" || (Array.isArray(type) && type.includes("JobPosting"))
      })
      if (posting) return posting
    } catch {
      // A page may contain unrelated or malformed JSON-LD before JobPosting.
    }
  }
  return null
}

function asText(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null
  if (Array.isArray(value)) return value.map(asText).filter((item): item is string => Boolean(item)).join(", ") || null
  return null
}

function locationFromPosting(value: unknown): string | null {
  const locations = Array.isArray(value) ? value : [value]
  const rendered: string[] = []
  for (const item of locations) {
    if (!item || typeof item !== "object") continue
    const address = (item as { address?: unknown }).address
    if (typeof address === "string") {
      rendered.push(address)
      continue
    }
    if (!address || typeof address !== "object") continue
    const a = address as Record<string, unknown>
    const parts = [a.addressLocality, a.addressRegion, a.addressCountry]
      .map(asText)
      .filter((part): part is string => Boolean(part))
    if (parts.length > 0) rendered.push(parts.join(", "))
  }
  return rendered.join("; ") || null
}

function externalApplyUrl(html: string): string | null {
  const assignments = [...html.matchAll(/\b(?:window\.)?location\s*=\s*["']([^"']+)["']/gi)]
  for (const assignment of assignments) {
    try {
      const parsed = new URL(decodeHtmlEntities(assignment[1]), BASE_URL)
      if (!isPortalHost(parsed.hostname)) {
        return parsed.toString()
      }
    } catch {
      // Ignore non-URL JavaScript assignments.
    }
  }
  const hrefs = [...visibleHtml(html).matchAll(/href=["'](https?:\/\/[^"']+)["']/gi)]
  for (const href of hrefs) {
    try {
      const parsed = new URL(decodeHtmlEntities(href[1]))
      if (!isPortalHost(parsed.hostname) && !/facebook|twitter|linkedin|instagram/i.test(parsed.hostname)) {
        return parsed.toString()
      }
    } catch {
      // Ignore malformed links.
    }
  }
  return null
}

function canonicalUrl(html: string, fallback: string): string {
  const match = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
  return match ? absoluteUrl(match[1]) : fallback
}

export function parseJobDetail(html: string, id: string, requestedUrl: string): JobDetail {
  const posting = extractJsonLd(html)
  const titleFromHeading = html.match(/<h1[^>]*class=["'][^"']*jbdTitle[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i)?.[1]
  const title = asText(posting?.title) ?? cleanInline(titleFromHeading ?? html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "")
  if (!title) throw new Error("Failed to parse job listing JSON-LD or title")

  const organization = posting?.hiringOrganization
  const company = organization && typeof organization === "object"
    ? asText((organization as { name?: unknown }).name)
    : asText(organization)
  let location = locationFromPosting(posting?.jobLocation)
  if (!location || location.toLowerCase() === "nl") {
    const heading = cleanInline(html.match(/class=["'][^"']*jbdTextSh[^"']*["'][^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? "")
    const comma = heading.lastIndexOf(",")
    location = comma >= 0 ? heading.slice(comma + 1).trim() || location : location
  }

  const description = asText(posting?.description)
  const date = normalizeDate(asText(posting?.datePosted) ?? metaContent(html, "article:published_time"))
  const deadline = normalizeDate(asText(posting?.validThrough))
  const employmentType = asText(posting?.employmentType)
  const reference = posting?.identifier && typeof posting.identifier === "object"
    ? asText((posting.identifier as { value?: unknown }).value)
    : asText(posting?.identifier)
  const applyUrl = externalApplyUrl(html)
  const url = canonicalUrl(html, requestedUrl)
  const isActive = !deadline || deadline >= new Date().toISOString().slice(0, 10)
  const sameAs = organization && typeof organization === "object"
    ? asText((organization as { sameAs?: unknown }).sameAs)
    : null
  let companyUrl: string | null = null
  if (sameAs) {
    try {
      if (!isPortalHost(new URL(sameAs, BASE_URL).hostname)) companyUrl = sameAs
    } catch {
      companyUrl = null
    }
  }

  return {
    id,
    title,
    company,
    companyUrl,
    location,
    date,
    deadline,
    url,
    description: description ? cleanRichText(description) : null,
    employmentType,
    applyUrl,
    isActive,
    reference,
  }
}
