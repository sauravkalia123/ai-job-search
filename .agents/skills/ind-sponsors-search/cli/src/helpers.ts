export const BASE_URL = "https://indsponsors.nl"
export const JOBS_URL = `${BASE_URL}/jobs`

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const USER_AGENT = "Mozilla/5.0 (compatible; ind-sponsors-cli/1.0)"

/** Fetch HTML with exponential backoff on 429/5xx. Returns "" for a 404. */
export async function htmlFetch(url: string): Promise<string> {
  const maxRetries = 6
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
        "Accept-Language": "en,nl;q=0.8",
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
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`)
    }
    return response.text()
  }
  throw new Error("Request failed after max retries")
}

export interface JobCard {
  id: string
  title: string
  company: string | null
  location: string | null
  date: string | null
  url: string
}

export interface JobDetail extends JobCard {
  deadline: string | null
  employmentType: string | null
  applyUrl: string | null
  description: string | null
  isActive: boolean
}

function numericEntity(code: number): string {
  return code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : ""
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, value: string) => numericEntity(Number(value)))
    .replace(/&#[xX]([0-9a-fA-F]+);/g, (_, value: string) => numericEntity(parseInt(value, 16)))
}

export function stripTags(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim()
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim()
}

function absoluteUrl(value: string, base: string = BASE_URL): string | null {
  try {
    return new URL(decodeHtmlEntities(value), base).toString()
  } catch {
    return null
  }
}

function isExternalHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      !/(^|\.)indsponsors\.nl$/i.test(parsed.hostname)
  } catch {
    return false
  }
}

function isLikelyJobUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase()
    return /\/(?:job|jobs|vacature|vacatures|career|careers|viewjob|position|employment|werk|werken)(?:\/|\?|$)/.test(path) ||
      /\/e\/deliver\//.test(path)
  } catch {
    return false
  }
}

interface LinkOccurrence {
  url: string
  index: number
  text: string
}

function externalLinks(html: string): LinkOccurrence[] {
  const links: LinkOccurrence[] = []
  const linkRe = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  let match: RegExpExecArray | null
  while ((match = linkRe.exec(html)) !== null) {
    const url = absoluteUrl(match[1])
    if (url && isExternalHttpUrl(url)) {
      links.push({ url, index: match.index, text: stripTags(match[2]) })
    }
  }
  return links
}

function extractHeading(html: string): string | null {
  const heading = html.match(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/i)
  return heading ? normalizeWhitespace(stripTags(heading[1])) || null : null
}

function extractCompany(html: string, title: string | null, firstLinkText: string): string | null {
  const companyLink = html.match(
    /<a\b[^>]*\bhref\s*=\s*["'](?:https?:\/\/indsponsors\.nl)?\/company\/[^"']+["'][^>]*>([\s\S]*?)<\/a>/i,
  )
  if (companyLink) return normalizeWhitespace(stripTags(companyLink[1])) || null

  const text = normalizeWhitespace(firstLinkText.replace(/^view\s+/i, ""))
  if (title) {
    const titleAt = text.match(new RegExp(`^${escapeRegExp(title)}\\s+at\\s+(.+)$`, "i"))
    if (titleAt) return titleAt[1].trim() || null
  }
  const at = text.match(/\s+at\s+(.+)$/i)
  return at ? at[1].trim() || null : null
}

function extractLocation(html: string): string | null {
  const tagged = html.match(
    /<(?:span|p|div)\b[^>]*\b(?:location|city|place|area)\b[^>]*>([\s\S]*?)<\/(?:span|p|div)>/i,
  )
  const taggedValue = tagged ? normalizeWhitespace(stripTags(tagged[1])) : ""
  if (looksLikeLocation(taggedValue)) return taggedValue

  const tagRe = /<(?:span|p|div|li)\b[^>]*>([\s\S]*?)<\/(?:span|p|div|li)>/gi
  let match: RegExpExecArray | null
  while ((match = tagRe.exec(html)) !== null) {
    const value = normalizeWhitespace(stripTags(match[1]))
    if (looksLikeLocation(value)) return value
  }
  return null
}

function looksLikeLocation(value: string): boolean {
  return value.length <= 90 && (/^[^,\n]{1,70},\s*(?:NL|Netherlands)$/i.test(value) || value === "NL")
}

function parseDate(value: string): string | null {
  const iso = value.match(/\b(\d{4}-\d{2}-\d{2})\b/)
  if (iso) return iso[1]
  const long = value.match(/\b([A-Z][a-z]{2,9})\s+(\d{1,2}),\s+(\d{4})\b/)
  if (!long) return null
  const monthNames = [
    "january", "february", "march", "april", "may", "june", "july", "august",
    "september", "october", "november", "december",
  ]
  const abbreviated = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
  const monthName = long[1].toLowerCase()
  const month = monthNames.indexOf(monthName) >= 0
    ? monthNames.indexOf(monthName)
    : abbreviated.indexOf(monthName.slice(0, 3))
  if (month < 0) return null
  return `${long[3]}-${String(month + 1).padStart(2, "0")}-${String(Number(long[2])).padStart(2, "0")}`
}

function extractDate(html: string): string | null {
  const time = html.match(/<time\b[^>]*\bdatetime\s*=\s*["']([^"']+)["'][^>]*>/i)
  const timeDate = time ? parseDate(time[1]) : null
  if (timeDate) return timeDate
  const visibleDate = html.match(/(?:Fetched\s+)?([A-Z][a-z]{2,9}\s+\d{1,2},\s+\d{4})/i)
  return visibleDate ? parseDate(visibleDate[1]) : null
}

/**
 * Parse the public /jobs page by splitting on independent external listing
 * cards. A malformed card therefore cannot consume or invalidate its sibling.
 */
export function parseJobCards(html: string): JobCard[] {
  const links = externalLinks(html)
  const counts = new Map<string, number>()
  for (const link of links) counts.set(link.url, (counts.get(link.url) ?? 0) + 1)

  const candidates = links.filter((link, index) => {
    if (!isLikelyJobUrl(link.url)) return false
    if ((counts.get(link.url) ?? 0) >= 2) return true
    return !links.slice(0, index).some((previous) => previous.url === link.url)
  })
  const firstByUrl = new Map<string, LinkOccurrence>()
  for (const candidate of candidates) {
    if (!firstByUrl.has(candidate.url)) firstByUrl.set(candidate.url, candidate)
  }
  const first = [...firstByUrl.values()].sort((a, b) => a.index - b.index)
  const results: JobCard[] = []

  for (let i = 0; i < first.length; i++) {
    const start = first[i].index
    const end = first[i + 1]?.index ?? html.length
    const chunk = html.slice(start, end)
    const title = extractHeading(chunk) ?? normalizeWhitespace(first[i].text.replace(/^view\s+/i, "").replace(/\s+track$/i, ""))
    if (!title) continue
    const company = extractCompany(chunk, title, first[i].text)
    results.push({
      id: first[i].url,
      title,
      company,
      location: extractLocation(chunk),
      date: extractDate(chunk),
      url: first[i].url,
    })
  }
  return results
}

export function parseTotal(html: string): number | null {
  const match = html.match(/\bof\s+([\d.,]+)\s+jobs\b/i)
  if (!match) return null
  const digits = match[1].replace(/[.,]/g, "")
  const value = Number(digits)
  return Number.isSafeInteger(value) ? value : null
}

export function filterCards(cards: JobCard[], query: string | undefined, jobage: number | undefined): JobCard[] {
  let results = cards
  if (query?.trim()) {
    const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean)
    const searchable = (card: JobCard): string => `${card.title} ${card.company ?? ""} ${card.location ?? ""} ${card.url}`.toLowerCase()
    results = results.filter((card) => queryTerms.every((term) => {
      if (term === "software") {
        return /software|engineer|engineering|developer|development|technology|tech|data|\bai\b|analytics/.test(searchable(card))
      }
      return searchable(card).includes(term)
    }))
  }
  if (jobage !== undefined && jobage > 0) {
    const cutoff = Date.now() - jobage * 86400000
    results = results.filter((card) => {
      if (!card.date) return true
      const timestamp = Date.parse(`${card.date}T23:59:59Z`)
      return Number.isNaN(timestamp) || timestamp >= cutoff
    })
  }
  return results
}

function visibleHtml(html: string): string {
  return html
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
}

function visibleText(html: string): string {
  return decodeHtmlEntities(
    visibleHtml(html)
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<\/(?:p|li|div|h[1-6]|section|article)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
}

function metaContent(html: string, name: string): string | null {
  const escaped = escapeRegExp(name)
  const meta = new RegExp(
    `<meta\\b[^>]*(?:property|name|itemprop)\\s*=\\s*["']${escaped}["'][^>]*\\bcontent\\s*=\\s*["']([^"']*)["'][^>]*>|<meta\\b[^>]*\\bcontent\\s*=\\s*["']([^"']*)["'][^>]*(?:property|name|itemprop)\\s*=\\s*["']${escaped}["'][^>]*>`,
    "i",
  ).exec(html)
  return meta ? normalizeWhitespace(decodeHtmlEntities(meta[1] ?? meta[2])) || null : null
}

function jsonLdNodes(html: string): unknown[] {
  const nodes: unknown[] = []
  const scriptRe = /<script\b[^>]*\btype\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null
  while ((match = scriptRe.exec(html)) !== null) {
    try {
      const parsed: unknown = JSON.parse(match[1].trim())
      nodes.push(parsed)
    } catch {
      // A malformed unrelated JSON-LD block must not hide a valid job block.
    }
  }
  return nodes
}

function findJobPosting(node: unknown): Record<string, unknown> | null {
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findJobPosting(item)
      if (found) return found
    }
    return null
  }
  if (!node || typeof node !== "object") return null
  const record = node as Record<string, unknown>
  const type = record["@type"]
  if ((typeof type === "string" && type.toLowerCase() === "jobposting") ||
      (Array.isArray(type) && type.some((value: unknown) => typeof value === "string" && value.toLowerCase() === "jobposting"))) {
    return record
  }
  if (record["@graph"]) return findJobPosting(record["@graph"])
  return null
}

function firstText(value: unknown): string | null {
  if (typeof value === "string") return normalizeWhitespace(decodeHtmlEntities(value)) || null
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstText(item)
      if (found) return found
    }
  }
  return null
}

function nestedText(value: unknown, keys: string[]): string | null {
  let current = value
  for (const key of keys) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return null
    current = (current as Record<string, unknown>)[key]
  }
  return firstText(current)
}

function jsonLocation(value: unknown): string | null {
  if (Array.isArray(value)) {
    const parts = value.map(jsonLocation).filter((part): part is string => Boolean(part))
    return parts[0] ?? null
  }
  if (typeof value === "string") return normalizeWhitespace(value) || null
  if (!value || typeof value !== "object") return null
  const record = value as Record<string, unknown>
  const address = record.address
  if (typeof address === "string") return normalizeWhitespace(address) || null
  if (address && typeof address === "object") {
    const a = address as Record<string, unknown>
    const parts = [a.addressLocality, a.addressRegion, a.addressCountry]
      .map(firstText)
      .filter((part): part is string => Boolean(part))
    if (parts.length) return parts.join(", ")
  }
  return firstText(record.name)
}

function cleanDescription(value: string | null): string | null {
  if (!value) return null
  const text = decodeHtmlEntities(value)
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(?:p|li|div|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
  return text || null
}

function applicationUrl(html: string, baseUrl: string): string | null {
  const linkRe = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  let match: RegExpExecArray | null
  while ((match = linkRe.exec(html)) !== null) {
    const label = stripTags(match[2]).toLowerCase()
    const href = match[1].toLowerCase()
    if (/apply|solliciteer|solliciteren|application|aanmelden/.test(`${label} ${href}`)) {
      return absoluteUrl(match[1], baseUrl)
    }
  }
  return null
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export function parseJobDetail(html: string, url: string): JobDetail {
  const posting = jsonLdNodes(html).map(findJobPosting).find((node): node is Record<string, unknown> => Boolean(node))
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)
  const h1Title = h1 ? stripTags(h1[1]) : null
  const title = firstText(posting?.title) ?? metaContent(html, "og:title") ?? h1Title
  if (!title) throw new Error("Failed to parse job listing HTML: no title found")

  const company = nestedText(posting?.hiringOrganization, ["name"]) ?? null
  const location = jsonLocation(posting?.jobLocation) ?? null
  const date = firstText(posting?.datePosted) ?? null
  const deadline = firstText(posting?.validThrough) ?? null
  const description = cleanDescription(firstText(posting?.description) ?? metaContent(html, "og:description") ?? metaContent(html, "description") ?? visibleText(html))
  const canonical = firstText(posting?.url) ?? metaContent(html, "og:url") ?? url
  const applyUrl = applicationUrl(html, url) ?? canonical
  const deadlineTime = deadline ? Date.parse(deadline) : NaN

  return {
    id: url,
    title: normalizeWhitespace(title),
    company,
    location,
    date,
    url,
    deadline,
    employmentType: firstText(posting?.employmentType) ?? null,
    applyUrl,
    description,
    isActive: Number.isNaN(deadlineTime) || deadlineTime >= Date.now(),
  }
}
