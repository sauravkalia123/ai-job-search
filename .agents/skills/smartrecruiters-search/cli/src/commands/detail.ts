import { API_BASE, fetchJson, htmlToText, locationText, writeError } from "../helpers.js"

export interface DetailOpts {
  id: string
  org?: string
  format: "json" | "plain"
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  // Accept a jobs.smartrecruiters.com URL, "<org>/<id>", or bare id + --org.
  let org = opts.org
  let id = opts.id
  if (opts.id.startsWith("http")) {
    const m = opts.id.split("?")[0].match(/^https?:\/\/jobs\.smartrecruiters\.com\/([^/]+)\/([^/?#]+)/i)
    if (!m) {
      writeError("could not parse the smartrecruiters job URL", "BAD_ID")
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

  let payload: unknown
  try {
    payload = await fetchJson(`${API_BASE}/${encodeURIComponent(org)}/postings/${encodeURIComponent(id)}`)
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "FETCH_FAILED")
    return 1
  }
  const j = payload as Record<string, unknown> | null
  if (!j || typeof j.name !== "string") {
    writeError(`posting not found: ${org}/${id}`, "NOT_FOUND")
    return 1
  }

  // Description lives under jobAd.sections.jobDescription.{text|html}.
  const jobAd =
    j.jobAd !== null && typeof j.jobAd === "object" ? (j.jobAd as Record<string, unknown>) : null
  const sections =
    jobAd !== null && jobAd.sections !== null && typeof jobAd.sections === "object"
      ? (jobAd.sections as Record<string, unknown>)
      : null
  const jd =
    sections !== null && sections.jobDescription !== null && typeof sections.jobDescription === "object"
      ? (sections.jobDescription as Record<string, unknown>)
      : null
  let descHtml: string | null = null
  if (jd) {
    if (typeof jd.html === "string" && jd.html.trim()) descHtml = jd.html
    else if (typeof jd.text === "string" && jd.text.trim()) descHtml = jd.text
  }
  const released = typeof j.releasedDate === "string" ? j.releasedDate : null

  const detail = {
    id,
    title: j.name,
    company: org,
    location: locationText(j.location),
    date: released ? released.slice(0, 10) : null,
    url: `https://jobs.smartrecruiters.com/${org}/${id}`,
    department:
      j.department !== null && typeof j.department === "object"
        ? ((j.department as Record<string, unknown>).label as string | undefined) ?? null
        : null,
    description: descHtml ? htmlToText(descHtml) || null : null,
    isActive: true,
  }

  if (opts.format === "plain") {
    const lines = [
      `Title:       ${detail.title}`,
      `Company:     ${detail.company}`,
      `Location:    ${detail.location ?? "—"}`,
      `Released:    ${detail.date ?? "—"}`,
      `Department:  ${detail.department ?? "—"}`,
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
