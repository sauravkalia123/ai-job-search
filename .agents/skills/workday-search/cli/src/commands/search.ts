import {
  searchJobs,
  writeError,
  type BoardTarget,
} from "../helpers.js"

export interface SearchOpts {
  board: string
  target: BoardTarget
  query?: string
  page: number
  limit: number
  format: "json" | "table" | "plain"
}

const SERVER_PAGE_SIZE = 20

function printTable(
  rows: Array<{ title: string; location: string | null; postedOn: string | null; url: string }>,
): void {
  const pad = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s.padEnd(n))
  for (const j of rows) {
    process.stdout.write(
      `${pad(j.title, 46)} | ${pad(j.location ?? "—", 24)} | ${pad(j.postedOn ?? "—", 18)} | ${j.url}\n`,
    )
  }
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  const offset = (Math.max(1, opts.page) - 1) * SERVER_PAGE_SIZE
  let result
  try {
    result = await searchJobs(opts.target, opts.query, SERVER_PAGE_SIZE, offset)
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "FETCH_FAILED")
    return 1
  }

  const rows = result.postings
    .map((raw) => {
      const p = raw as Record<string, unknown>
      const title = typeof p.title === "string" ? p.title : null
      const externalPath = typeof p.externalPath === "string" ? p.externalPath : null
      if (!title || !externalPath) return null
      return {
        id: externalPath,
        title,
        company: opts.target.tenant,
        location: typeof p.locationsText === "string" ? p.locationsText : null,
        // Workday exposes only relative labels ("Posted 2 Days Ago"), never a
        // date at search level - we will not parse that into a fake date.
        date: null as string | null,
        postedOn: typeof p.postedOn === "string" ? p.postedOn : null,
        url: `https://${opts.target.host}/${opts.target.site}${externalPath}`,
      }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)

  const results = rows.slice(0, opts.limit)

  if (opts.format === "json") {
    process.stdout.write(
      JSON.stringify(
        { meta: { count: results.length, page: opts.page, total: result.total }, results },
        null, 2,
      ) + "\n",
    )
  } else {
    printTable(results)
  }
  return 0
}
