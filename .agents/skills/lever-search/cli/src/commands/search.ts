import { fetchPostings, mapPosting, writeError } from "../helpers.js"

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
  let raws
  try {
    raws = await fetchPostings(opts.org)
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "FETCH_FAILED")
    return 1
  }
  if (raws === null) {
    writeError(`board not found: ${opts.org}`, "NOT_FOUND")
    return 1
  }

  const mapped = raws
    .map((r) => mapPosting(r, opts.org))
    .filter((p): p is NonNullable<typeof p> => p !== null)

  const q = opts.query?.toLowerCase()
  const filtered = q
    ? mapped.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.location ?? "").toLowerCase().includes(q) ||
          (p.team ?? "").toLowerCase().includes(q),
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
