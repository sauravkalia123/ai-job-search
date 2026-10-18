import {
  filterCards,
  htmlFetch,
  JOBS_URL,
  parseJobCards,
  parseTotal,
  writeError,
  type JobCard,
} from "../helpers.js"

export interface SearchOpts {
  query?: string
  jobage?: number
  page: number
  limit?: number
  format: "json" | "table" | "plain"
}

function buildUrl(opts: SearchOpts): string {
  const params = new URLSearchParams()
  if (opts.query) params.set("query", opts.query)
  params.set("page", String(opts.page))
  if (opts.jobage !== undefined) params.set("jobage", String(opts.jobage))
  return `${JOBS_URL}?${params.toString()}`
}

function renderTable(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  const header = ["ID", "TITLE", "COMPANY", "LOCATION", "DATE"].join(" | ")
  const rows = cards.map((card) => [
    card.id,
    card.title,
    card.company ?? "—",
    card.location ?? "—",
    card.date ?? "—",
  ].map((value) => value.replace(/\|/g, "\\|")).join(" | "))
  return [header, "---", ...rows].join("\n")
}

function renderPlain(cards: JobCard[]): string {
  return cards.map((card) => [
    card.title,
    `  ${card.company ?? "—"} · ${card.location ?? "—"} · ${card.date ?? "—"}`,
    `  id: ${card.id}`,
    `  ${card.url}`,
  ].join("\n")).join("\n\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const html = await htmlFetch(buildUrl(opts))
    if (!html) {
      writeError("The IND Sponsors jobs page was not found", "NOT_FOUND")
      return 1
    }
    const fetched = parseJobCards(html)
    const filtered = filterCards(fetched, opts.query, opts.jobage)
    const pageSize = 25
    const pageStart = (opts.page - 1) * pageSize
    let results = filtered.slice(pageStart, pageStart + pageSize)
    if (opts.limit !== undefined) results = results.slice(0, opts.limit)
    const output = {
      meta: {
        count: results.length,
        total: parseTotal(html) ?? fetched.length,
        page: opts.page,
        perPage: pageSize,
      },
      results,
    }

    if (opts.format === "json") process.stdout.write(JSON.stringify(output, null, 2) + "\n")
    else if (opts.format === "table") process.stdout.write(renderTable(results) + "\n")
    else process.stdout.write(renderPlain(results) + (results.length ? "\n" : ""))
    return 0
  } catch (error) {
    writeError(error instanceof Error ? error.message : String(error), "SEARCH_FAILED")
    return 1
  }
}
