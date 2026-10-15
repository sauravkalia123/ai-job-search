// Data source: cutshort.io public job pages (SSR). No authentication required.
// Both search and detail embed their payload in a Next.js `__NEXT_DATA__`
// <script> tag; we parse that JSON instead of scraping markup, so the parsing
// anchors are JSON paths rather than CSS classes (see ../url-reference.md).

export const SEARCH_URL = "https://cutshort.io/jobs"
export const JOB_URL_BASE = "https://cutshort.io/job"

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA = "Mozilla/5.0 (compatible; cutshort-search-cli/1.0)"

/** Fetch HTML with exponential backoff on 429/5xx. Returns "" on a 404. */
export async function htmlFetch(url: string): Promise<string> {
  const maxRetries = 6
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
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

// The Next.js payload is deeply nested and only partially stable, so type the
// frame loosely and narrow with guards instead of mirroring every level.
export interface NextData {
  props?: { pageProps?: { dehydratedState?: { queries?: unknown } } }
}

export function extractNextData(html: string): NextData | null {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
  if (!m) return null
  try {
    return JSON.parse(m[1]) as NextData
  } catch {
    return null
  }
}

export function asRecord(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null
}

export function asArray(v: unknown): unknown[] | null {
  return Array.isArray(v) ? v : null
}

export function str(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null
}

/**
 * Walk the dehydrated react-query slots and return the `jobs` array from the
 * slot whose data.data.pageData carries it. One malformed slot must not break
 * the walk, so every step is guarded.
 */
export function findSearchJobs(next: NextData): unknown[] | null {
  const queries = asArray(next.props?.pageProps?.dehydratedState?.queries)
  if (!queries) return null
  for (const q of queries) {
    const data = asRecord(asRecord(q)?.state)?.data
    const inner = asRecord(asRecord(data)?.data)
    const pageData = asRecord(inner?.pageData)
    const jobs = pageData ? asArray(pageData.jobs) : null
    if (jobs) return jobs
  }
  return null
}

/** Find the array of schema.org JSON-LD objects on a detail page. */
export function findJsonLds(next: NextData): unknown[] | null {
  const queries = asArray(next.props?.pageProps?.dehydratedState?.queries)
  if (!queries) return null
  for (const q of queries) {
    const data = asRecord(asRecord(q)?.state)?.data
    const inner = asRecord(asRecord(data)?.data)
    const seo = asRecord(inner?.seoData)
    const jsonlds = seo ? asArray(seo.jsonlds) : null
    if (jsonlds) return jsonlds
  }
  return null
}

/**
 * Convert a Unicode code point to a string. Uses `fromCodePoint` (not
 * `fromCharCode`) so supplementary-plane code points decode correctly, and
 * drops out-of-range values instead of throwing.
 */
function numericEntity(cp: number): string {
  return cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : ""
}

export function decodeHtmlEntities(text: string): string {
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

/** HTML fragment -> readable text, keeping paragraph/list breaks as newlines. */
export function htmlToText(html: string): string {
  const withBreaks = html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|ul|ol|div|h\d)>/gi, "\n")
  return decodeHtmlEntities(withBreaks.replace(/<[^>]+>/g, ""))
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export interface JobCard {
  id: string
  title: string
  company: string | null
  location: string | null
  date: string | null
  url: string
  experience: string | null
  salary: string | null
  skills: string | null
  remoteType: string | null
}

/** Map one raw cutshort search-job object to the contract JobCard (or null). */
export function mapSearchJob(raw: unknown): JobCard | null {
  const j = asRecord(raw)
  if (!j) return null
  const id = str(j._id)
  const title = str(j.headline)
  if (!id || !title) return null

  const summary = asRecord(j.jobFactSummary)
  const companyDetails = asRecord(j.companyDetails)
  const publicUrl = str(j.publicUrl)

  // The `id` is the publicUrl slug (not the Mongo _id): detail resolves by
  // slug, and authApplyUrl is a robots-disallowed /profile/ path that must
  // never be used as the posting URL.
  const slug = publicUrl ? publicUrl.split("/").filter(Boolean).pop() : null

  const skills = asArray(j.allSkills)
  const posted = summary ? str(summary.postedDate) : null
  const date = posted ? posted.slice(0, 10) : null

  return {
    id: slug ?? id,
    title,
    company: (companyDetails && str(companyDetails.name)) ?? (summary ? str(summary.companyName) : null),
    location: str(j.locationsText) ?? (summary ? str(summary.locations) : null),
    date,
    url: publicUrl ?? `${JOB_URL_BASE}/${id}`,
    experience: summary ? str(summary.experience) : null,
    salary: str(j.salaryRangeText),
    skills: skills ? skills.filter((s) => typeof s === "string").join(", ") || null : null,
    remoteType: str(j.remoteType),
  }
}

export function parseSearchHtml(html: string): JobCard[] {
  const next = extractNextData(html)
  if (!next) return []
  const rawJobs = findSearchJobs(next)
  if (!rawJobs) return []
  const results: JobCard[] = []
  for (const raw of rawJobs) {
    const card = mapSearchJob(raw)
    if (card) results.push(card)
  }
  return results
}

export interface JobDetail extends JobCard {
  description: string | null
  employmentType: string | null
  isActive: boolean
}

/**
 * Parse a detail page. The schema.org JobPosting JSON-LD carries the full
 * description HTML, datePosted, employmentType, skills and hiringOrganization;
 * the pageData slot carries the vanity facts (locations, experience). The
 * search-level postedDate can differ from the detail datePosted when an
 * employer renews a listing - both are the portal's own values, so we keep
 * whatever each endpoint reports.
 */
export function parseDetailHtml(html: string, slug: string): JobDetail | null {
  if (!html) return null
  const next = extractNextData(html)
  if (!next) return null

  let jl: Record<string, unknown> | null = null
  const jsonlds = findJsonLds(next)
  if (jsonlds) {
    for (const raw of jsonlds) {
      const rec = asRecord(raw)
      if (rec && rec["@type"] === "JobPosting") {
        jl = rec
        break
      }
    }
  }

  // Fallback facts from the pageData slot (vanity summary of the main job).
  let summary: Record<string, unknown> | null = null
  const queries = asArray(next.props?.pageProps?.dehydratedState?.queries)
  if (queries) {
    for (const q of queries) {
      const data = asRecord(asRecord(q)?.state)?.data
      const inner = asRecord(asRecord(data)?.data)
      const pageData = asRecord(inner?.pageData)
      const facts = pageData ? asRecord(pageData.jobFactSummary) : null
      if (facts) {
        summary = facts
        break
      }
    }
  }

  const title = (jl ? str(jl.title) : null) ?? (summary ? str(summary.roleTitle) : null) ?? "(untitled)"
  const org = jl ? asRecord(jl.hiringOrganization) : null
  const datePosted = jl ? str(jl.datePosted) : null
  const descHtml = jl ? str(jl.description) : null
  const employment = jl ? jl.employmentType : null

  return {
    id: slug,
    title,
    company: (org ? str(org.name) : null) ?? (summary ? str(summary.companyName) : null),
    location: summary ? str(summary.locations) : null,
    date: datePosted ? datePosted.slice(0, 10) : null,
    url: `${JOB_URL_BASE}/${slug}`,
    experience: summary ? str(summary.experience) : null,
    salary: summary ? str(summary.salary) : null,
    skills: jl ? str(jl.skills) : null,
    remoteType: null,
    description: descHtml ? htmlToText(descHtml) || null : null,
    employmentType:
      typeof employment === "string"
        ? employment
        : Array.isArray(employment)
          ? employment.filter((s) => typeof s === "string").join(", ") || null
          : null,
    // Absence of the JobPosting block (or a bare 404) means we cannot confirm
    // the posting is live - not proof it is closed.
    isActive: jl !== null,
  }
}

/** Epoch-ms cutoff for a posting-age filter, or null when unfiltered. */
export function jobageCutoff(days: number | undefined): number | null {
  if (!days || days <= 0 || days >= 9999) return null
  return Date.now() - days * 86400_000
}
