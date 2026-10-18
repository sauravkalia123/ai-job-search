export const BASE_URL = "https://undutchables.nl"
export const SEARCH_PATH = "/vacancies"
export const DISCIPLINE_IT_ENGINEERING = "241"
export const LANGUAGE_ENGLISH = "217"

const USER_AGENT = "Mozilla/5.0 (compatible; undutchables-cli/1.0)"

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

/** Fetch a public page with bounded exponential backoff and jitter. */
export async function htmlFetch(url: string): Promise<string> {
  const maxRetries = 6
  let delay = 500

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,nl;q=0.8",
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
}

function numericEntity(codePoint: number): string {
  return codePoint >= 0 && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : ""
}

/** Decode the entities seen in portal markup without adding a runtime parser. */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, value: string) => numericEntity(Number.parseInt(value, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, value: string) => numericEntity(Number.parseInt(value, 16)))
}

/** Strip markup while keeping the paragraph and list breaks useful to readers. */
export function cleanText(html: string): string {
  const withBreaks = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|li|ul|ol|h[1-6]|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, "")

  return decodeHtmlEntities(withBreaks)
    .split("\n")
    .map((line) => line.replace(/[ \t\r\f]+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function attrValue(attrs: string, name: string): string | null {
  const match = attrs.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i"))
  return match ? decodeHtmlEntities(match[1]) : null
}

function absoluteVacancyUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl, BASE_URL)
    if (url.hostname !== "undutchables.nl" && !url.hostname.endsWith(".undutchables.nl")) return null
    const match = url.pathname.match(/^\/vacancies\/([^/]+)\/?$/i)
    if (!match) return null
    return `${BASE_URL}/vacancies/${match[1]}`
  } catch {
    return null
  }
}

function idFromVacancyUrl(url: string): string | null {
  const match = url.match(/\/vacancies\/([^/]+)$/i)
  if (!match) return null
  try {
    return decodeURIComponent(match[1])
  } catch {
    return null
  }
}

/** Parse each vacancy card independently so malformed markup cannot discard all results. */
export function parseJobCards(html: string): JobCard[] {
  const results: JobCard[] = []
  const cardPattern = /<a\b([^>]*\bclass\s*=\s*["'][^"']*\bvacancy-item\b[^"']*["'][^>]*)>([\s\S]*?)<\/a>/gi
  let match: RegExpExecArray | null

  while ((match = cardPattern.exec(html)) !== null) {
    const url = absoluteVacancyUrl(attrValue(match[1], "href") ?? "")
    if (!url) continue
    const id = idFromVacancyUrl(url)
    if (!id) continue

    const titleMatch = match[2].match(/<h4\b[^>]*>([\s\S]*?)<\/h4>/i)
    const title = titleMatch ? cleanText(titleMatch[1]) : ""
    if (!title) continue

    const locationMatch = match[2].match(/<div\b[^>]*class\s*=\s*["'][^"']*\blocation\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)
    const location = locationMatch ? cleanText(locationMatch[1]) || null : null

    if (!results.some((result) => result.id === id)) {
      results.push({
        id,
        title,
        company: null,
        companyUrl: null,
        location,
        date: null,
        deadline: null,
        url,
        description: null,
      })
    }
  }

  return results
}

export interface SearchPageResult {
  results: JobCard[]
}

export function parseSearchPage(html: string): SearchPageResult {
  return { results: parseJobCards(html) }
}

function jsonLdObjects(html: string): unknown[] {
  const objects: unknown[] = []
  const scriptPattern = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null
  while ((match = scriptPattern.exec(html)) !== null) {
    try {
      const parsed: unknown = JSON.parse(match[1].trim())
      if (Array.isArray(parsed)) objects.push(...parsed)
      else objects.push(parsed)
    } catch {
      // A malformed unrelated JSON-LD block should not prevent JobPosting parsing.
    }
  }
  return objects
}

function isJobPosting(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") return false
  const type = (value as Record<string, unknown>)["@type"]
  return type === "JobPosting" || (Array.isArray(type) && type.includes("JobPosting"))
}

function firstJobPosting(html: string): Record<string, unknown> | null {
  return jsonLdObjects(html).find(isJobPosting) ?? null
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function nestedString(value: unknown, keys: string[]): string | null {
  let current: unknown = value
  for (const key of keys) {
    if (Array.isArray(current)) current = current[0]
    if (!current || typeof current !== "object") return null
    current = (current as Record<string, unknown>)[key]
  }
  if (Array.isArray(current)) current = current[0]
  return stringValue(current)
}

export function toIsoDate(value: string | null | undefined): string | null {
  if (!value) return null
  const text = value.trim()
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const dmy = text.match(/^(\d{2})-(\d{2})-(\d{4})/)
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`
  return null
}

function detailBody(html: string): string | null {
  const start = html.search(/<div\b[^>]*id\s*=\s*["']vacancy-details["']/i)
  if (start === -1) return null
  const end = html.search(/<div\b[^>]*id\s*=\s*["']apply-modal["']/i)
  return html.slice(start, end > start ? end : undefined)
}

function sectionDescription(html: string): string | null {
  const body = detailBody(html)
  if (!body) return null
  const sectionPattern = /<h2\b[^>]*>\s*(Job description|Requirements|Working conditions|Work location|Company description|Good to know)\s*<\/h2>/gi
  const sections: string[] = []
  let match: RegExpExecArray | null
  while ((match = sectionPattern.exec(body)) !== null) {
    const contentStart = match.index + match[0].length
    const nextHeading = body.slice(contentStart).search(/<h2\b[^>]*>/i)
    const section = body.slice(contentStart, nextHeading === -1 ? body.length : contentStart + nextHeading)
    const text = cleanText(section)
    if (text) sections.push(`${match[1]}\n${text}`)
  }
  return sections.length > 0 ? sections.join("\n\n") : null
}

export function parseJobDetail(html: string, id: string, url = `${BASE_URL}/vacancies/${id}`): JobDetail {
  if (!html) throw new Error("Job not found")
  const posting = firstJobPosting(html)
  const h1Match = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)
  const title = stringValue(posting?.title) ?? (h1Match ? cleanText(h1Match[1]) : null)
  if (!title) throw new Error("Failed to parse job listing HTML")

  const organization = posting?.hiringOrganization
  const company = nestedString(organization, ["name"])
  const companyUrl = nestedString(organization, ["sameAs"])
  const location = nestedString(posting?.jobLocation, ["address", "addressLocality"])
    ?? nestedString(posting?.jobLocation, ["name"])
  const jsonDescription = stringValue(posting?.description)
  const description = sectionDescription(html) ?? (jsonDescription ? cleanText(jsonDescription) : null)
  const date = toIsoDate(stringValue(posting?.datePosted))
  const deadline = toIsoDate(stringValue(posting?.validThrough))
  const employmentType = stringValue(posting?.employmentType)

  return {
    id,
    title,
    company,
    companyUrl,
    location,
    date,
    deadline,
    url,
    description,
    employmentType,
    applyUrl: null,
  }
}

export function buildSearchUrl(options: {
  query?: string
  location?: string
  page: number
}): string {
  const path = options.page === 1 ? SEARCH_PATH : `${SEARCH_PATH}/p${options.page}`
  const params = new URLSearchParams({
    discipline: DISCIPLINE_IT_ENGINEERING,
    language: LANGUAGE_ENGLISH,
  })
  if (options.query) params.set("q", options.query)
  if (options.location) params.set("location", options.location)
  return `${BASE_URL}${path}?${params.toString()}`
}
