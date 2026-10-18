import {
  buildSearchUrl,
  htmlFetch,
  parseSearchPage,
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

function renderTable(results: JobCard[]): string {
  if (results.length === 0) return "No results."
  const header = ["ID", "TITLE", "LOCATION", "DATE"].join("\t")
  const rows = results.map((result) =>
    [result.id, result.title, result.location ?? "—", result.date ?? "—"].join("\t"),
  )
  return [header, ...rows].join("\n")
}

function renderPlain(results: JobCard[]): string {
  return results
    .map((result) =>
      [
        `id: ${result.id}`,
        `title: ${result.title}`,
        `company: ${result.company ?? "-"}`,
        `location: ${result.location ?? "-"}`,
        `date: ${result.date ?? "-"}`,
        `url: ${result.url}`,
      ].join("\n"),
    )
    .join("\n\n")
}

export async function runSearch(options: SearchOpts): Promise<number> {
  if (options.jobage !== undefined) {
    writeError(
      "Undutchables has no posting-age query parameter and result cards expose no date for local filtering; --jobage cannot be applied",
      "UNSUPPORTED_FILTER",
    )
    return 1
  }

  try {
    const html = await htmlFetch(buildSearchUrl(options))
    let results = parseSearchPage(html).results
    if (options.limit !== undefined) results = results.slice(0, options.limit)

    const output = { meta: { count: results.length, page: options.page }, results }
    if (options.format === "json") process.stdout.write(JSON.stringify(output, null, 2) + "\n")
    else if (options.format === "table") process.stdout.write(renderTable(results) + "\n")
    else process.stdout.write((renderPlain(results) ? renderPlain(results) + "\n" : "No results.\n"))
    return 0
  } catch (error) {
    writeError(error instanceof Error ? error.message : String(error), "SEARCH_FAILED")
    return 1
  }
}
