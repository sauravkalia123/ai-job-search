import {
  BASE_URL,
  CATEGORY_URL,
  SEARCH_URL,
  htmlFetch,
  parseJobCards,
  parseResultCount,
  writeError,
  type JobCard,
} from "../helpers.js"

export interface SearchOpts {
  query?: string
  location?: string
  jobage?: number
  page: number
  limit?: number
  format: "json" | "table" | "plain"
}

export function publicationBucket(days: number | undefined): string | null {
  if (days === undefined) return null
  if (days <= 1) return "today"
  if (days <= 3) return "last3days"
  if (days <= 7) return "thisweek"
  if (days <= 14) return "last2weeks"
  return null
}

export function buildSearchUrl(opts: SearchOpts): string {
  if (!opts.query && !opts.location && opts.jobage === undefined) {
    return `${CATEGORY_URL}?JobsListPage=${opts.page}`
  }
  if (opts.query && !opts.location && opts.jobage === undefined) {
    return `${BASE_URL}/all-jobs/keyword/${encodeURIComponent(opts.query)}/?JobsListPage=${opts.page}`
  }
  return `${SEARCH_URL}?JobsListPage=${opts.page}`
}

function buildForm(opts: SearchOpts): string {
  const form = new URLSearchParams()
  const keywords = [opts.query, opts.location].filter(Boolean).join(" ")
  if (keywords) form.set("main_keywords", keywords)
  for (const field of ["title", "description", "profile_culture", "salary", "chapo", "refs"]) {
    form.append("main_keywords_options[]", field)
  }
  const bucket = publicationBucket(opts.jobage)
  if (bucket) form.set("main_pubdate", bucket)
  form.set("proximity_countryCode", "NL")
  form.set("command", "submitrequest")
  form.set("origin", "hook")
  return form.toString()
}

function renderTable(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  const header = `${"ID".padEnd(9)} ${"TITLE".padEnd(42)} ${"COMPANY".padEnd(28)} ${"LOCATION".padEnd(20)} DATE`
  const rows = cards.map((card) =>
    `${card.id.padEnd(9)} ${(card.title || "").slice(0, 42).padEnd(42)} ${(card.company || "—").slice(0, 28).padEnd(28)} ${(card.location || "—").slice(0, 20).padEnd(20)} ${card.date || "—"}`,
  )
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

function renderPlain(cards: JobCard[]): string {
  return cards
    .map((card) => `${card.title}\n  ${card.company || "—"} · ${card.location || "—"} · ${card.date || "—"}\n  id: ${card.id}\n  ${card.url}`)
    .join("\n\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const usesPost = Boolean(opts.location) || opts.jobage !== undefined
    const html = usesPost
      ? await htmlFetch(buildSearchUrl(opts), { method: "POST", body: buildForm(opts) })
      : await htmlFetch(buildSearchUrl(opts))
    let results = parseJobCards(html)
    if (opts.limit !== undefined) results = results.slice(0, opts.limit)
    const total = parseResultCount(html)

    if (opts.format === "table") process.stdout.write(renderTable(results) + "\n")
    else if (opts.format === "plain") process.stdout.write(renderPlain(results) + (results.length ? "\n" : "No results.\n"))
    else {
      process.stdout.write(JSON.stringify({ meta: { count: results.length, page: opts.page, total }, results }, null, 2) + "\n")
    }
    return 0
  } catch (error) {
    writeError(error instanceof Error ? error.message : String(error), "SEARCH_FAILED")
    return 1
  }
}
