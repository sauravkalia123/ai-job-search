import { BOARD_URL_BASE, fetchBoardPostings, writeError } from "../helpers.js"

export interface SearchOpts {
  board: string
  query?: string
  limit?: number
  format: "json" | "table" | "plain"
}

function printTable(
  rows: Array<{ id: string; title: string; company: string; location: string | null; employmentType: string | null; url: string }>,
): void {
  const pad = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s.padEnd(n))
  for (const j of rows) {
    process.stdout.write(
      `${pad(j.title, 48)} | ${pad(j.location ?? "—", 22)} | ${pad(j.employmentType ?? "—", 10)} | ${j.url}\n`,
    )
  }
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  let postings
  try {
    postings = await fetchBoardPostings(opts.board)
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "FETCH_FAILED")
    return 1
  }

  // -q is a client-side filter on title/location: the public API has no
  // server-side keyword parameter.
  const q = opts.query?.toLowerCase()
  const filtered = q
    ? postings.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.locationName ?? "").toLowerCase().includes(q),
      )
    : postings
  const results = filtered.slice(0, opts.limit ?? filtered.length).map((p) => ({
    id: p.id,
    title: p.title,
    company: opts.board,
    location: p.locationName,
    // The board API carries no posting date; `detail` returns datePosted.
    date: null,
    url: `${BOARD_URL_BASE}/${opts.board}/${p.id}`,
    employmentType: p.employmentType,
    teamId: p.teamId,
  }))

  if (opts.format === "json") {
    process.stdout.write(
      JSON.stringify({ meta: { count: results.length, page: 1, total: postings.length }, results }, null, 2) + "\n",
    )
  } else {
    printTable(results)
  }
  return 0
}
