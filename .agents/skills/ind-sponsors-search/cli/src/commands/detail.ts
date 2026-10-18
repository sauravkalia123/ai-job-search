import { htmlFetch, parseJobDetail, writeError, type JobDetail } from "../helpers.js"

export interface DetailOpts {
  id: string
  format: "json" | "plain"
}

export function normalizeUrl(input: string): string | null {
  const trimmed = input.trim()
  try {
    const url = new URL(trimmed)
    if (url.protocol !== "http:" && url.protocol !== "https:") return null
    return url.toString()
  } catch {
    return null
  }
}

function renderPlain(job: JobDetail): string {
  const lines = [
    job.title,
    `${job.company ?? "—"} · ${job.location ?? "—"}`,
    job.date ? `Date: ${job.date}` : "",
    job.deadline ? `Deadline: ${job.deadline}` : "",
    job.employmentType ? `Employment: ${job.employmentType}` : "",
    `Status: ${job.isActive ? "ACTIVE / UNKNOWN" : "CLOSED / EXPIRED"}`,
    job.description ?? "(no description)",
    `Apply: ${job.applyUrl ?? job.url}`,
    `URL: ${job.url}`,
  ].filter(Boolean)
  return lines.join("\n") + "\n"
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const url = normalizeUrl(opts.id)
  if (!url) {
    writeError(`Could not parse an external http(s) job URL from "${opts.id}"`, "BAD_ID")
    return 1
  }
  try {
    const html = await htmlFetch(url)
    if (!html) {
      writeError("Job not found", "NOT_FOUND")
      return 1
    }
    const job = parseJobDetail(html, url)
    if (opts.format === "json") process.stdout.write(JSON.stringify(job, null, 2) + "\n")
    else process.stdout.write(renderPlain(job))
    return 0
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    writeError(message, message.includes("title") ? "PARSE_ERROR" : "DETAIL_FAILED")
    return 1
  }
}
