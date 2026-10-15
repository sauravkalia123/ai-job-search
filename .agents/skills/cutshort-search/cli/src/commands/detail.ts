import {
  JOB_URL_BASE,
  htmlFetch,
  writeError,
  parseDetailHtml,
} from "../helpers.js"

export interface DetailOpts {
  id: string
  format: "json" | "plain"
}

function printPlain(d: NonNullable<ReturnType<typeof import("../helpers.js").parseDetailHtml>>): void {
  const lines = [
    `Title:       ${d.title}`,
    `Company:     ${d.company ?? "—"}`,
    `Location:    ${d.location ?? "—"}`,
    `Posted:      ${d.date ?? "—"}`,
    `Experience:  ${d.experience ?? "—"}`,
    `Salary:      ${d.salary ?? "—"}`,
    `Employment:  ${d.employmentType ?? "—"}`,
    `Skills:      ${d.skills ?? "—"}`,
    `Active:      ${d.isActive ? "yes" : "not confirmed"}`,
    `URL:         ${d.url}`,
    "",
    d.description ?? "(no description available)",
  ]
  process.stdout.write(lines.join("\n") + "\n")
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  // Accept a full publicUrl or a bare slug (the `id` emitted by search).
  const slug = opts.id.startsWith("http")
    ? (opts.id.split("?")[0].split("/").filter(Boolean).pop() ?? "")
    : opts.id
  if (!slug) {
    writeError("could not resolve a posting slug from the given id/url", "BAD_ID")
    return 1
  }

  let html: string
  try {
    html = await htmlFetch(`${JOB_URL_BASE}/${slug}`)
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "FETCH_FAILED")
    return 1
  }

  const detail = parseDetailHtml(html, slug)
  if (!detail) {
    // 404 or an unparseable page: report nulls honestly instead of crashing,
    // with isActive false (we could not confirm the posting is live).
    writeError(`posting not found or page unreadable: ${slug}`, "NOT_FOUND")
    return 1
  }

  if (opts.format === "plain") {
    printPlain(detail)
  } else {
    process.stdout.write(JSON.stringify(detail, null, 2) + "\n")
  }
  return 0
}
