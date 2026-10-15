import {
  fetchJson,
  parseFeed,
  htmlToText,
  locationFromJobPosting,
  writeError,
} from "../helpers.js"

export interface DetailOpts {
  id: string
  org?: string
  format: "json" | "plain"
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  // Accept a full job URL or "<org>/<id>"; a bare id requires --org.
  let org = opts.org
  let needle = opts.id
  if (opts.id.startsWith("http")) {
    const m = opts.id.split("?")[0].match(/^https?:\/\/([a-z0-9-]+)\.teamtailor\.com\/jobs\/([^/?#]+)/i)
    if (!m) {
      writeError("could not parse the teamtailor job URL", "BAD_ID")
      return 1
    }
    org = m[1]
    needle = m[2]
  } else if (opts.id.includes("/")) {
    const segs = opts.id.split("/").filter(Boolean)
    org = segs[0]
    needle = segs[1]
  }
  if (!org || !needle) {
    writeError('pass a full job URL, "<org>/<id>", or a bare id with --org', "BAD_ID")
    return 1
  }

  let payload: unknown
  try {
    payload = await fetchJson(`https://${org}.teamtailor.com/jobs.json`)
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "FETCH_FAILED")
    return 1
  }
  const items = parseFeed(payload)
  if (items === null) {
    writeError(`board not found or unreadable: ${org}`, "NOT_FOUND")
    return 1
  }
  const it = items.find((x) => x.id === needle || x.url.endsWith(`/${needle}`))
  if (!it) {
    writeError(`posting not found on board ${org}: ${needle}`, "NOT_FOUND")
    return 1
  }

  const jp = it.jobPosting
  const org2 =
    jp && jp.hiringOrganization !== null && typeof jp.hiringOrganization === "object"
      ? (jp.hiringOrganization as Record<string, unknown>)
      : null
  const employmentType = jp && typeof jp.employmentType === "string" ? jp.employmentType : null
  const descHtml = it.contentHtml ?? (jp && typeof jp.description === "string" ? jp.description : null)

  const detail = {
    id: it.id,
    title: it.title,
    company: org2 && typeof org2.name === "string" ? org2.name : org,
    location: locationFromJobPosting(jp),
    date: it.date,
    url: it.url,
    employmentType,
    description: descHtml ? htmlToText(descHtml) || null : null,
    isActive: true,
  }

  if (opts.format === "plain") {
    const lines = [
      `Title:       ${detail.title}`,
      `Company:     ${detail.company}`,
      `Location:    ${detail.location ?? "—"}`,
      `Posted:      ${detail.date ?? "—"}`,
      `Employment:  ${detail.employmentType ?? "—"}`,
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
