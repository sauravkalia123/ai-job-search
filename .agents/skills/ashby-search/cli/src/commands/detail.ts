import {
  BOARD_URL_BASE,
  backoffFetch,
  writeError,
  extractJobPostingLd,
  htmlToText,
  locationFromJobLocation,
} from "../helpers.js"

export interface DetailOpts {
  id: string
  board?: string
  format: "json" | "plain"
}

function printPlain(d: {
  title: string
  company: string | null
  location: string | null
  date: string | null
  employmentType: string | null
  url: string
  description: string | null
  isActive: boolean
}): void {
  const lines = [
    `Title:       ${d.title}`,
    `Company:     ${d.company ?? "—"}`,
    `Location:    ${d.location ?? "—"}`,
    `Posted:      ${d.date ?? "—"}`,
    `Employment:  ${d.employmentType ?? "—"}`,
    `URL:         ${d.url}`,
    `Active:      ${d.isActive ? "yes" : "not confirmed"}`,
    "",
    d.description ?? "(no description available)",
  ]
  process.stdout.write(lines.join("\n") + "\n")
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  // Accept a full URL, "board/id", or a bare id + --board.
  let board = opts.board
  let postingId = opts.id
  if (opts.id.startsWith("http")) {
    const segs = opts.id.split("?")[0].split("/").filter(Boolean)
    board = segs[segs.length - 2]
    postingId = segs[segs.length - 1]
  } else if (opts.id.includes("/")) {
    const segs = opts.id.split("/").filter(Boolean)
    board = segs[0]
    postingId = segs[1]
  }
  if (!board || !postingId) {
    writeError(
      "could not resolve board/postingId - pass a full URL, '<board>/<id>', or a bare id with --board",
      "BAD_ID",
    )
    return 1
  }

  const url = `${BOARD_URL_BASE}/${board}/${postingId}`
  let html: string
  try {
    const response = await backoffFetch(url, { headers: { Accept: "text/html" } })
    if (response.status === 404) {
      writeError(`posting not found: ${board}/${postingId}`, "NOT_FOUND")
      return 1
    }
    if (!response.ok) {
      writeError(`Request failed: ${response.status} ${response.statusText}`, "FETCH_FAILED")
      return 1
    }
    html = await response.text()
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "FETCH_FAILED")
    return 1
  }

  const ld = extractJobPostingLd(html)
  if (!ld) {
    writeError(`page readable but no JobPosting JSON-LD found: ${board}/${postingId}`, "NOT_FOUND")
    return 1
  }

  const org =
    ld.hiringOrganization !== null && typeof ld.hiringOrganization === "object"
      ? (ld.hiringOrganization as Record<string, unknown>)
      : null
  const descriptionHtml = typeof ld.description === "string" ? ld.description : null
  const datePosted = typeof ld.datePosted === "string" ? ld.datePosted : null
  const employmentType = typeof ld.employmentType === "string" ? ld.employmentType : null

  const detail = {
    id: postingId,
    title: typeof ld.title === "string" ? ld.title : "(untitled)",
    company: org && typeof org.name === "string" ? org.name : board,
    location: locationFromJobLocation(ld.jobLocation),
    date: datePosted ? datePosted.slice(0, 10) : null,
    url,
    employmentType,
    description: descriptionHtml ? htmlToText(descriptionHtml) || null : null,
    isActive: true,
  }

  if (opts.format === "plain") {
    printPlain(detail)
  } else {
    process.stdout.write(JSON.stringify(detail, null, 2) + "\n")
  }
  return 0
}
