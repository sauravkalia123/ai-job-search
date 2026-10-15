import { API_BASE, fetchJson, writeError, htmlToText, boardTargetFromUrl } from "../helpers.js"

export interface DetailOpts {
  id: string
  org?: string
  format: "json" | "plain"
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  // Accept a full absolute_url, "<org>/<id>", or a bare id with --org.
  let org = opts.org
  let id = opts.id
  if (opts.id.startsWith("http")) {
    const t = boardTargetFromUrl(opts.id)
    if (!t) {
      writeError("could not parse the greenhouse job URL", "BAD_ID")
      return 1
    }
    org = t.org
    id = t.id
  } else if (opts.id.includes("/")) {
    const segs = opts.id.split("/").filter(Boolean)
    org = segs[0]
    id = segs[1]
  }
  if (!org || !id || !/^\d+$/.test(id)) {
    writeError(
      'pass a full job URL, "<org>/<id>", or a bare numeric id with --org',
      "BAD_ID",
    )
    return 1
  }

  let payload: unknown
  try {
    payload = await fetchJson(`${API_BASE}/${encodeURIComponent(org)}/jobs/${id}`)
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "FETCH_FAILED")
    return 1
  }
  const j = payload as Record<string, unknown> | null
  if (!j || typeof j.title !== "string") {
    writeError(`posting not found: ${org}/${id}`, "NOT_FOUND")
    return 1
  }

  const location =
    j.location !== null && typeof j.location === "object"
      ? ((j.location as Record<string, unknown>).name as string | undefined) ?? null
      : null
  const contentHtml = typeof j.content === "string" ? j.content : null
  const updated = typeof j.updated_at === "string" ? j.updated_at : null

  const detail = {
    id,
    title: j.title,
    company: org,
    location,
    date: updated ? updated.slice(0, 10) : null,
    url:
      typeof j.absolute_url === "string"
        ? j.absolute_url
        : `https://job-boards.greenhouse.io/${org}/jobs/${id}`,
    // Greenhouse exposes updated_at (ISO), not a created date.
    updatedAt: updated,
    description: contentHtml ? htmlToText(contentHtml) || null : null,
    isActive: true,
  }

  if (opts.format === "plain") {
    const lines = [
      `Title:       ${detail.title}`,
      `Company:     ${detail.company}`,
      `Location:    ${detail.location ?? "—"}`,
      `Updated:     ${detail.date ?? "—"}`,
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
