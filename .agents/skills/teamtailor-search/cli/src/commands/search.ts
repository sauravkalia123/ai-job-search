import { fetchJson, parseFeed, locationFromJobPosting, writeError } from "../helpers.js"

export interface SearchOpts {
  org: string
  query?: string
  limit?: number
  format: "json" | "table" | "plain"
}

function printTable(
  rows: Array<{ title: string; location: string | null; date: string | null; url: string }>,
): void {
  const pad = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s.padEnd(n))
  for (const j of rows) {
    process.stdout.write(`${pad(j.title, 46)} | ${pad(j.location ?? "—", 24)} | ${pad(j.date ?? "—", 10)} | ${j.url}\n`)
  }
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  let payload: unknown
  try {
    payload = await fetchJson(`https://${opts.org}.teamtailor.com/jobs.json`)
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "FETCH_FAILED")
    return 1
  }
  const items = parseFeed(payload)
  if (items === null) {
    writeError(`board not found or unreadable: ${opts.org}`, "NOT_FOUND")
    return 1
  }

  const mapped = items.map((it) => ({
    id: it.id,
    title: it.title,
    company: opts.org,
    location: locationFromJobPosting(it.jobPosting),
    date: it.date,
    url: it.url,
  }))

  const q = opts.query?.toLowerCase()
  const filtered = q
    ? mapped.filter(
        (j) => j.title.toLowerCase().includes(q) || (j.location ?? "").toLowerCase().includes(q),
      )
    : mapped
  const results = opts.limit ? filtered.slice(0, opts.limit) : filtered

  if (opts.format === "json") {
    process.stdout.write(
      JSON.stringify({ meta: { count: results.length, page: 1, total: mapped.length }, results }, null, 2) + "\n",
    )
  } else {
    printTable(results)
  }
  return 0
}
