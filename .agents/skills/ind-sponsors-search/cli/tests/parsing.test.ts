import { describe, expect, test } from "bun:test"
import { filterCards, parseJobCards, parseJobDetail, parseTotal } from "../src/helpers"

const SEARCH_HTML = `
<main>
  <article class="job-card">
    <a href="https://jobs.example.test/acme/software-engineer">View Software Engineer at Acme</a>
    <span class="badge">English-friendly</span>
    <h3>Software Engineer</h3>
    <a href="https://indsponsors.nl/company/acme">Acme</a>
    <span class="location">Amsterdam, NL</span>
    <time datetime="2026-10-10">Fetched Oct 10, 2026</time>
    <a href="https://jobs.example.test/acme/software-engineer">View Job</a>
  </article>
  <article class="job-card">
    <a href="https://jobs.example.test/other/data-analyst">View Data Analyst at Other</a>
    <h3>Data Analyst</h3>
    <span>Utrecht, NL</span>
    <time datetime="2026-08-01">Aug 1, 2026</time>
    <a href="https://jobs.example.test/other/data-analyst">View Job</a>
  </article>
  <p>Showing 1–2 of 52 jobs</p>
</main>`

describe("IND Sponsors search parsing", () => {
  test("splits repeated external listing links into independent cards", () => {
    expect(parseJobCards(SEARCH_HTML)).toEqual([
      {
        id: "https://jobs.example.test/acme/software-engineer",
        title: "Software Engineer",
        company: "Acme",
        location: "Amsterdam, NL",
        date: "2026-10-10",
        url: "https://jobs.example.test/acme/software-engineer",
      },
      {
        id: "https://jobs.example.test/other/data-analyst",
        title: "Data Analyst",
        company: "Other",
        location: "Utrecht, NL",
        date: "2026-08-01",
        url: "https://jobs.example.test/other/data-analyst",
      },
    ])
  })

  test("applies the software role-family expansion locally", () => {
    const cards = parseJobCards(SEARCH_HTML)
    expect(filterCards(cards, "software", undefined).map((card) => card.title)).toEqual([
      "Software Engineer",
      "Data Analyst",
    ])
    expect(filterCards(cards, "no-such-role", undefined)).toHaveLength(0)
  })

  test("parses the total count from the public page heading", () => {
    expect(parseTotal(SEARCH_HTML)).toBe(52)
  })
})

describe("IND Sponsors external detail parsing", () => {
  test("prefers JobPosting JSON-LD and preserves readable description", () => {
    const html = `<html><head>
      <script type="application/ld+json">${JSON.stringify({
        "@type": "JobPosting",
        title: "Backend Developer",
        hiringOrganization: { name: "Example BV" },
        jobLocation: { address: { addressLocality: "Eindhoven", addressCountry: "NL" } },
        datePosted: "2026-10-01",
        validThrough: "2099-01-01",
        employmentType: "FULL_TIME",
        description: "<p>Build APIs &amp; services.</p><ul><li>TypeScript</li></ul>",
      })}</script>
    </head><body><h1>Wrong fallback</h1></body></html>`
    const detail = parseJobDetail(html, "https://source.example/jobs/backend")
    expect(detail).toMatchObject({
      title: "Backend Developer",
      company: "Example BV",
      location: "Eindhoven, NL",
      date: "2026-10-01",
      deadline: "2099-01-01",
      employmentType: "FULL_TIME",
      isActive: true,
    })
    expect(detail.description).toContain("Build APIs & services.")
    expect(detail.description).toContain("TypeScript")
  })

  test("falls back to metadata and visible headings when JSON-LD is absent", () => {
    const detail = parseJobDetail(
      `<html><head><meta property="og:title" content="Courier role" /><meta name="description" content="Deliver in Amsterdam" /></head><body><h1>Courier role</h1></body></html>`,
      "https://www.uber.com/nl/nl/e/deliver/amsterdam-noord-holland-nl/",
    )
    expect(detail.title).toBe("Courier role")
    expect(detail.description).toBe("Deliver in Amsterdam")
  })
})
