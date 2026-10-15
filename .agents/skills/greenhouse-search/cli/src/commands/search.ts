import { API_BASE, fetchJson, writeError } from "../helpers.js"

export interface SearchOpts {
  org: string
  query?: string
  limit?: number
  format: "json" | "table" | "plain"
}

interface RawJob {
  id: unknown
  title: unknown
  updated_at: unknown
  absolute_url: unknown
  location?: { name?: unknown }
  departments?: Array<{ name?: unknown }>
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
    payload = await fetchJson(`${API_BASE}/${encodeURIComponent(opts.org)}/jobs`)
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "FETCH_FAILED")
    return 1
  }
  const jobs = (payload as { jobs?: unknown } | null)?.jobs
  if (!Array.isArray(jobs)) {
    writeError(`board not found or unreadable: ${opts.org}`, "NOT_FOUND")
    return 1
  }

  const q = opts.query?.toLowerCase()
  const mapped = (jobs as RawJob[])
    .map((j) => {
      const id = typeof j.id === "number" || typeof j.id === "string" ? String(j.id) : null
      const title = typeof j.title === "string" ? j.title : null
      if (!id || !title) return null
      const location =
        j.location && typeof j.location.name === "string" ? j.location.name : null
      const dept = j.departments?.[0]?.name
      return {
        id,
        title,
        company: opts.org,
        location,
        // Greenhouse exposes updated_at (ISO), not a created date: `date`
        // reflects the posting's last update, documented in SKILL.md.
        date: typeof j.updated_at === "string" ? j.updated_at.slice(0, 10) : null,
        url: typeof j.absolute_url === "string" ? j.absolute_url : `https://job-boards.greenhouse.io/${opts.org}/jobs/${id}`,
        department: typeof dept === "string" ? dept : null,
      }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)

  const filtered = q
    ? mapped.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          (j.location ?? "").toLowerCase().includes(q) ||
          (j.department ?? "").toLowerCase().includes(q),
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
