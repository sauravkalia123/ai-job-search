import { BASE_URL, DETAIL_ROUTE, htmlFetch, parseJobDetail, writeError } from "../helpers.js"

export interface DetailOpts {
  id: string
  format: "json" | "plain"
}

const ALLOWED_HOST = /(^|\.)togetherabroad\.nl$/i

export function normalizeId(input: string): { id: string; url: string } | null {
  const value = input.trim()
  if (/^\d{5,}$/.test(value)) return { id: value, url: `${DETAIL_ROUTE}/${value}/bb/1` }

  let parsed: URL
  try {
    parsed = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`)
  } catch {
    return null
  }
  if (!ALLOWED_HOST.test(parsed.hostname)) return null
  const vid = parsed.pathname.match(/\/vid\/(\d+)/i)?.[1]
    ?? parsed.pathname.match(/-(\d{5,})(?:-\d+)?\.html$/i)?.[1]
  if (!vid) return null
  return { id: vid, url: parsed.pathname.includes("/jobs/") ? parsed.toString() : `${DETAIL_ROUTE}/${vid}/bb/1` }
}

function renderPlain(job: Awaited<ReturnType<typeof parseJobDetail>>): string {
  const lines = [
    job.title,
    `${job.company || "—"} · ${job.location || "—"}`,
    `Published: ${job.date || "—"}`,
    `Deadline: ${job.deadline || "—"}`,
    `Employment: ${job.employmentType || "—"}`,
    `Status: ${job.isActive ? "ACTIVE" : "CLOSED / EXPIRED"}`,
    `Apply: ${job.applyUrl || "—"}`,
    `URL: ${job.url}`,
    "",
    job.description || "(no description)",
  ]
  return lines.join("\n") + "\n"
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const target = normalizeId(opts.id)
  if (!target) {
    writeError(`Could not parse a Together Abroad job ID or URL from "${opts.id}"`, "BAD_ID")
    return 1
  }
  try {
    const html = await htmlFetch(target.url)
    if (!html) {
      writeError("Job not found", "NOT_FOUND")
      return 1
    }
    const job = parseJobDetail(html, target.id, target.url)
    process.stdout.write(opts.format === "plain" ? renderPlain(job) : JSON.stringify(job, null, 2) + "\n")
    return 0
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    writeError(message, message.includes("Failed to parse") ? "PARSE_FAILED" : "DETAIL_FAILED")
    return 1
  }
}
