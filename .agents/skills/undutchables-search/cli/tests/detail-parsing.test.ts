import { expect, test } from "bun:test"
import { parseJobDetail, toIsoDate } from "../src/helpers.js"

const DETAIL_FIXTURE = `
<div id="vacancy-details" class="vacancy-details">
  <h1>Backend Engineer | English</h1>
  <h2>Job description</h2>
  <p>Build reliable <strong>services</strong>.<br>Work with the team.</p>
  <h2>Requirements</h2>
  <ul><li>TypeScript experience</li><li>Good communication</li></ul>
  <h2>Working conditions</h2>
  <p>Full time.</p>
  <h2>Work location</h2>
  Rotterdam
</div>
<div id="apply-modal"></div>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "JobPosting",
  "title": "Backend Engineer | English",
  "description": "<p>Build reliable <strong>services</strong>.</p>",
  "datePosted": "07-10-2026",
  "hiringOrganization": { "@type": "Organization", "name": "Example client", "sameAs": "https://example.test" },
  "jobLocation": { "address": { "addressLocality": "Rotterdam" } },
  "validThrough": "2026-12-31",
  "employmentType": "FULL_TIME"
}
</script>`

test("parses JSON-LD and readable vacancy sections", () => {
  const job = parseJobDetail(DETAIL_FIXTURE, "backend-engineer-english")
  expect(job.title).toBe("Backend Engineer | English")
  expect(job.company).toBe("Example client")
  expect(job.location).toBe("Rotterdam")
  expect(job.date).toBe("2026-10-07")
  expect(job.deadline).toBe("2026-12-31")
  expect(job.employmentType).toBe("FULL_TIME")
  expect(job.applyUrl).toBeNull()
  expect(job.description).toContain("Job description")
  expect(job.description).toContain("Build reliable services.")
  expect(job.description).toContain("Requirements")
  expect(job.description).not.toContain("<strong>")
})

test("normalizes the date shapes present in JSON-LD", () => {
  expect(toIsoDate("07-10-2026")).toBe("2026-10-07")
  expect(toIsoDate("2026-12-31T00:00:00+01:00")).toBe("2026-12-31")
  expect(toIsoDate("")).toBeNull()
})
