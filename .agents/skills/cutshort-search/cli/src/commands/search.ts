import {
  SEARCH_URL,
  htmlFetch,
  writeError,
  parseSearchHtml,
  jobageCutoff,
  type JobCard,
} from "../helpers.js"

export interface SearchOpts {
  query?: string
  jobage?: number
  limit?: number
  format: "json" | "table" | "plain"
}

function printTable(jobs: JobCard[]): void {
  const pad = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s.padEnd(n))
  for (const j of jobs) {
    process.stdout.write(
      `${pad(j.title, 48)} | ${pad(j.company ?? "—", 24)} | ${pad(j.location ?? "—", 22)} | ${pad(j.date ?? "no-date", 10)} | ${j.url}\n`,
    )
  }
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  // Cutshort ignores page params server-side (verified 2026-10-15: page=2
  // returns the same result set), so there is no --page flag to offer.
  const url = opts.query
    ? `${SEARCH_URL}?searchKeyword=${encodeURIComponent(opts.query)}`
    : SEARCH_URL

  let html: string
  try {
    html = await htmlFetch(url)
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "FETCH_FAILED")
    return 1
  }

  const jobs = parseSearchHtml(html)
  const cutoff = jobageCutoff(opts.jobage)
  // Postings with no parsable date are kept, not dropped: the portal does
  // expose postedDate, but a null here means "could not read it", and
  // discarding on unreadable data would hide jobs silently.
  const filtered =
    cutoff === null
      ? jobs
      : jobs.filter(
          (j) => j.date === null || (Date.parse(j.date + "T00:00:00Z") || 0) >= cutoff,
        )
  const results = opts.limit ? filtered.slice(0, opts.limit) : filtered

  if (opts.format === "json") {
    process.stdout.write(
      JSON.stringify({ meta: { count: results.length, page: 1, total: jobs.length }, results }, null, 2) + "\n",
    )
  } else {
    printTable(results)
  }
  return 0
}
