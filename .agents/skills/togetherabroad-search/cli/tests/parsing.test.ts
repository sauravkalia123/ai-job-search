import { describe, expect, test } from "bun:test"
import { parseJobCards, parseJobDetail, parseResultCount } from "../src/helpers"

const CARD_PAGE = `<div class="hookItemContainer jslItemContainer vac-block">
  <div class="hookItemTitle jslFunctionName"><a href="https://www.togetherabroad.nl/jobs/job-platform-engineer-947801-31.html">Platform Engineer &amp;amp; Cloud</a></div>
  <div class="hookItemWord jslKeyword jslEmployee"><a href="https://example.test/acme">Acme &amp; BV</a></div>
  <div class="hookItemWord jslKeyword jslChapo">Build cloud platforms.</div>
  <div>Published: <span>16.10.2026</span></div>
</div>
<div class="hookItemContainer jslItemContainer vac-block">
  <div class="hookItemTitle jslFunctionName"><a href="/jobs/job-data-engineer-947802-31.html">Data Engineer</a></div>
  <div class="hookItemWord jslKeyword jslEmployee">Data Co</div>
  <div>Published: 16.10.2026</div>
</div>`

const DETAIL_PAGE = `<html><head>
<link rel="canonical" href="https://www.togetherabroad.nl/jobs/job-platform-engineer-947801-31.html">
</head><body>
<script type="application/ld+json">{"@type":"JobPosting","identifier":{"value":"TOO432729"},"title":"Platform Engineer","hiringOrganization":{"name":"Acme BV"},"jobLocation":{"address":{"addressLocality":"Amsterdam","addressCountry":"NL"}},"description":"<p>Build reliable platforms.</p><ul><li>Work with cloud systems.</li></ul>","datePosted":"2026-10-16","validThrough":"2026-11-15","employmentType":"FULL_TIME"}</script>
<h1 class="jbdTitle">Platform Engineer</h1>
<input type="button" onClick="location='https://jobs.example.test/acme/947801'">
</body></html>`

describe("Together Abroad search parsing", () => {
  test("parses independent result cards and decodes nested entities", () => {
    const [first, second] = parseJobCards(CARD_PAGE)
    expect(first).toMatchObject({
      id: "947801",
      title: "Platform Engineer & Cloud",
      company: "Acme & BV",
      date: "2026-10-16",
      url: "https://www.togetherabroad.nl/jobs/job-platform-engineer-947801-31.html",
    })
    expect(second).toMatchObject({ id: "947802", title: "Data Engineer", company: "Data Co" })
  })

  test("reads the portal total without confusing it with emitted results", () => {
    expect(parseResultCount("5770 jobs found of which 500 are shown")).toBe(5770)
    expect(parseResultCount("No jobs found")).toBe(0)
  })
})

describe("Together Abroad detail parsing", () => {
  test("parses JobPosting JSON-LD and keeps the external apply URL", () => {
    const job = parseJobDetail(DETAIL_PAGE, "947801", "https://www.togetherabroad.nl/index.php/page/JobsRemote/command/detail/vid/947801/bb/1")
    expect(job).toMatchObject({
      id: "947801",
      title: "Platform Engineer",
      company: "Acme BV",
      location: "Amsterdam, NL",
      date: "2026-10-16",
      deadline: "2026-11-15",
      applyUrl: "https://jobs.example.test/acme/947801",
      url: "https://www.togetherabroad.nl/jobs/job-platform-engineer-947801-31.html",
    })
    expect(job.description).toContain("Build reliable platforms.")
    expect(job.description).toContain("Work with cloud systems.")
  })
})
