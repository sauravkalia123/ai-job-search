import {
  backoffFetch,
  writeError,
  extractJobPostingLd,
  htmlToText,
  locationFromJobLocation,
  type BoardTarget,
} from "../helpers.js"

export interface DetailOpts {
  id: string
  board: string | undefined
  target: BoardTarget | null
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
}): void {
  const lines = [
    `Title:       ${d.title}`,
    `Company:     ${d.company ?? "—"}`,
    `Location:    ${d.location ?? "—"}`,
    `Posted:      ${d.date ?? "—"}`,
    `Employment:  ${d.employmentType ?? "—"}`,
    `URL:         ${d.url}`,
    "",
    d.description ?? "(no description available)",
  ]
  process.stdout.write(lines.join("\n") + "\n")
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  // Accept a full job URL, or an externalPath with --board "host/site".
  let host: string
  let site: string
  let path: string
  if (opts.id.startsWith("http")) {
    const clean = opts.id.split("?")[0]
    const m = clean.match(/^https?:\/\/([^/]+)\/([^/]+)\/(.+)$/i)
    if (!m) {
      writeError("could not parse the job URL", "BAD_ID")
      return 1
    }
    host = m[1]
    site = m[2]
    path = m[3]
  } else if (opts.target) {
    host = opts.target.host
    site = opts.target.site
    path = opts.id.replace(/^\/+/, "")
  } else {
    writeError(
      'pass a full job URL, or an externalPath (e.g. "/job/...") together with --board "host/site"',
      "BAD_ID",
    )
    return 1
  }

  const url = `https://${host}/${site}/${path}`
  let html: string
  try {
    const response = await backoffFetch(url, { headers: { Accept: "text/html" } })
    if (response.status === 404) {
      writeError(`posting not found: ${url}`, "NOT_FOUND")
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
    writeError(`page readable but no JobPosting JSON-LD found: ${url}`, "NOT_FOUND")
    return 1
  }

  const org =
    ld.hiringOrganization !== null && typeof ld.hiringOrganization === "object"
      ? (ld.hiringOrganization as Record<string, unknown>)
      : null
  const descriptionHtml = typeof ld.description === "string" ? ld.description : null
  const datePosted = typeof ld.datePosted === "string" ? ld.datePosted : null

  const detail = {
    id: path,
    title: typeof ld.title === "string" ? ld.title : "(untitled)",
    company: org && typeof org.name === "string" ? org.name : null,
    location: locationFromJobLocation(ld.jobLocation),
    date: datePosted ? datePosted.slice(0, 10) : null,
    url,
    employmentType: typeof ld.employmentType === "string" ? ld.employmentType : null,
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
