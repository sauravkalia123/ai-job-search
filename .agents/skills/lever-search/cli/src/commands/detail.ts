import { fetchPostings, mapPosting, parseHostedUrl, writeError } from "../helpers.js"

export interface DetailOpts {
  id: string
  org?: string
  format: "json" | "plain"
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  // Accept a hostedUrl, "<org>/<id>", or a bare id with --org.
  let org = opts.org
  let id = opts.id
  if (opts.id.startsWith("http")) {
    const parsed = parseHostedUrl(opts.id)
    if (!parsed) {
      writeError("could not parse the lever job URL", "BAD_ID")
      return 1
    }
    org = parsed.org
    id = parsed.id
  } else if (opts.id.includes("/")) {
    const segs = opts.id.split("/").filter(Boolean)
    org = segs[0]
    id = segs[1]
  }
  if (!org || !id) {
    writeError('pass a full hostedUrl, "<org>/<id>", or a bare id with --org', "BAD_ID")
    return 1
  }

  let raws
  try {
    raws = await fetchPostings(org)
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "FETCH_FAILED")
    return 1
  }
  if (raws === null) {
    writeError(`board not found: ${org}`, "NOT_FOUND")
    return 1
  }
  const raw = raws.find((r) => r.id === id)
  if (!raw) {
    writeError(`posting not found on board ${org}: ${id}`, "NOT_FOUND")
    return 1
  }
  const detail = mapPosting(raw, org)
  if (!detail) {
    writeError(`posting unreadable: ${org}/${id}`, "NOT_FOUND")
    return 1
  }

  if (opts.format === "plain") {
    const lines = [
      `Title:       ${detail.title}`,
      `Company:     ${detail.company}`,
      `Location:    ${detail.location ?? "—"}`,
      `Team:        ${detail.team ?? "—"}`,
      `Posted:      ${detail.date ?? "—"}`,
      `Commitment:  ${detail.commitment ?? "—"}`,
      `Workplace:   ${detail.workplaceType ?? "—"}`,
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
