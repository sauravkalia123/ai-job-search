import { API_BASE, fetchJson, locationText, writeError } from "../helpers.js"

export interface SearchOpts {
  org: string
  query?: string
  limit: number
  format: "json" | "table" | "plain"
}

function printTable(
  rows: Array<{ title: string; location: string | null; date: string | null; url: string }>,
): void {
  const pad = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s.padEnd(n))
  for (const j of rows) {
    process.stdout.write(`${pad(j.title, 46)} | ${pad(j.location ?? "—", 26)} | ${pad(j.date ?? "—", 10)} | ${j.url}\n`)
  }
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  // -q uses the API's server-side `q` parameter (verified during build).
  const params = new URLSearchParams({ limit: String(Math.min(opts.limit, 100)) })
  if (opts.query) params.set("q", opts.query)
  let payload: unknown
  try {
    payload = await fetchJson(`${API_BASE}/${encodeURIComponent(opts.org)}/postings?${params}`)
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "FETCH_FAILED")
    return 1
  }
  const p = payload as Record<string, unknown> | null
  if (!p || !Array.isArray(p.content)) {
    writeError(`board not found or unreadable: ${opts.org}`, "NOT_FOUND")
    return 1
  }

  const results = (p.content as Array<Record<string, unknown>>)
    .map((j) => {
      const id = typeof j.id === "string" ? j.id : null
      const title = typeof j.name === "string" ? j.name : null
      if (!id || !title) return null
      const released = typeof j.releasedDate === "string" ? j.releasedDate : null
      return {
        id,
        title,
        company: opts.org,
        location: locationText(j.location),
        // releasedDate (ISO) = the posting's release date on SmartRecruiters.
        date: released ? released.slice(0, 10) : null,
        url: `https://jobs.smartrecruiters.com/${opts.org}/${id}`,
        department:
          j.department !== null && typeof j.department === "object"
            ? ((j.department as Record<string, unknown>).label as string | undefined) ?? null
            : null,
      }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)

  if (opts.format === "json") {
    process.stdout.write(
      JSON.stringify(
        { meta: { count: results.length, page: 1, total: typeof p.totalFound === "number" ? p.totalFound : results.length }, results },
        null, 2,
      ) + "\n",
    )
  } else {
    printTable(results)
  }
  return 0
}
