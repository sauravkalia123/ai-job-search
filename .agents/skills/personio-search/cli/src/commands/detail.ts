import {
  fetchXml,
  field,
  parsePositions,
  htmlToText,
  isoDate,
  writeError,
} from "../helpers.js"

export interface DetailOpts {
  id: string
  org?: string
  format: "json" | "plain"
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  // Accept "<org>/<id>" or a full job URL; a bare id requires --org.
  let org = opts.org
  let id = opts.id
  if (opts.id.startsWith("http")) {
    const m = opts.id.split("?")[0].match(/^https?:\/\/([a-z0-9-]+)\.jobs\.personio\.com\/job\/([^/?#]+)/i)
    if (!m) {
      writeError("could not parse the personio job URL", "BAD_ID")
      return 1
    }
    org = m[1]
    id = m[2]
  } else if (opts.id.includes("/")) {
    const segs = opts.id.split("/").filter(Boolean)
    org = segs[0]
    id = segs[1]
  }
  if (!org || !id) {
    writeError('pass a full job URL, "<org>/<id>", or a bare id with --org', "BAD_ID")
    return 1
  }

  let xml: string
  try {
    xml = await fetchXml(`https://${org}.jobs.personio.com/xml`)
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "FETCH_FAILED")
    return 1
  }
  const chunk = parsePositions(xml).find((c) => field(c, "id") === id)
  if (!chunk) {
    writeError(`posting not found on board ${org}: ${id}`, "NOT_FOUND")
    return 1
  }

  const title = field(chunk, "name") ?? "(untitled)"
  const descHtml = field(chunk, "jobDescription") ?? field(chunk, "jobDescriptions") ?? ""
  const detail = {
    id,
    title,
    company: org,
    location: field(chunk, "office"),
    date: isoDate(field(chunk, "createdAt")),
    url: `https://${org}.jobs.personio.com/job/${id}`,
    department: field(chunk, "department"),
    employmentType: field(chunk, "employmentType"),
    seniority: field(chunk, "seniority"),
    description: descHtml ? htmlToText(descHtml) || null : null,
    isActive: true,
  }

  if (opts.format === "plain") {
    const lines = [
      `Title:       ${detail.title}`,
      `Company:     ${detail.company}`,
      `Location:    ${detail.location ?? "—"}`,
      `Posted:      ${detail.date ?? "—"}`,
      `Department:  ${detail.department ?? "—"}`,
      `Employment:  ${detail.employmentType ?? "—"}`,
      `Seniority:   ${detail.seniority ?? "—"}`,
      `URL:         ${detail.url}`,
      "",
      detail.description ?? "(no description available)",
    ]
    process.stdout.write(lines.join("\n") + "\n")
  } else {
    process.stdout.write(JSON.stringify(detail, null, 2) + "\n")
  }
  return 0
}
