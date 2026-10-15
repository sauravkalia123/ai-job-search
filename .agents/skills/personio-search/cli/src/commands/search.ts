import { fetchXml, field, parsePositions, isoDate, writeError } from "../helpers.js"

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
    process.stdout.write(`${pad(j.title, 46)} | ${pad(j.location ?? "—", 26)} | ${pad(j.date ?? "—", 10)} | ${j.url}\n`)
  }
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  const url = `https://${opts.org}.jobs.personio.com/xml`
  let xml: string
  try {
    xml = await fetchXml(url)
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "FETCH_FAILED")
    return 1
  }
  if (!xml || !xml.includes("<position>")) {
    writeError(`board not found or empty: ${opts.org}`, "NOT_FOUND")
    return 1
  }

  const q = opts.query?.toLowerCase()
  const mapped = parsePositions(xml)
    .map((chunk) => {
      const id = field(chunk, "id")
      const title = field(chunk, "name")
      if (!id || !title) return null
      return {
        id,
        title,
        company: opts.org,
        location: field(chunk, "office"),
        date: isoDate(field(chunk, "createdAt")),
        url: `https://${opts.org}.jobs.personio.com/job/${id}`,
        department: field(chunk, "department"),
        employmentType: field(chunk, "employmentType"),
        seniority: field(chunk, "seniority"),
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
