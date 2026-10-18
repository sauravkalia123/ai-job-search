import { BASE_URL, htmlFetch, parseJobDetail, writeError, type JobDetail } from "../helpers.js"

export interface DetailOpts {
  id: string
  format: "json" | "plain"
}

function normalizeId(input: string): string | null {
  const trimmed = input.trim()
  if (/^[a-z0-9][a-z0-9-]*$/i.test(trimmed)) return trimmed

  let parsed: URL
  try {
    parsed = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`)
  } catch {
    return null
  }
  if (parsed.hostname !== "undutchables.nl" && !parsed.hostname.endsWith(".undutchables.nl")) return null
  const match = parsed.pathname.match(/^\/vacancies\/([a-z0-9][a-z0-9-]*)\/?$/i)
  return match ? match[1] : null
}

export { normalizeId }

function renderPlain(job: JobDetail): string {
  const fields = [
    job.title,
    `${job.company ?? "—"} · ${job.location ?? "—"}`,
    job.date ? `Date posted: ${job.date}` : "",
    job.deadline ? `Deadline: ${job.deadline}` : "",
    job.employmentType ? `Employment: ${job.employmentType}` : "",
    "",
    job.description ?? "(no description)",
    "",
    `URL: ${job.url}`,
  ]
  return fields.filter((line) => line !== "").join("\n")
}

export async function runDetail(options: DetailOpts): Promise<number> {
  const id = normalizeId(options.id)
  if (!id) {
    writeError(`Could not parse an Undutchables vacancy id or URL from "${options.id}"`, "BAD_ID")
    return 1
  }

  const url = `${BASE_URL}/vacancies/${id}`
  try {
    const html = await htmlFetch(url)
    if (!html) {
      writeError("Job not found", "NOT_FOUND")
      return 1
    }
    const job = parseJobDetail(html, id, url)
    if (options.format === "plain") process.stdout.write(renderPlain(job) + "\n")
    else process.stdout.write(JSON.stringify(job, null, 2) + "\n")
    return 0
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    writeError(message, message === "Job not found" ? "NOT_FOUND" : "DETAIL_FAILED")
    return 1
  }
}
