import { expect, test } from "bun:test"
import { buildSearchUrl, parseJobCards, parseSearchPage } from "../src/helpers.js"

const SEARCH_FIXTURE = `
<form id="vacancy-finder-form" action="/vacancies">
  <a class="vacancy-item" href="https://undutchables.nl/vacancies/data-engineer-english">
    <h4>Data &amp; Platform Engineer</h4>
    <div class="location"> Amsterdam </div>
  </a>
  <a class="vacancy-item" href="/vacancies/software-developer-utrecht">
    <h4>Software Developer</h4>
    <div class="location">Utrecht</div>
  </a>
  <a class="vacancy-item" href="https://example.com/vacancies/not-undutchables">
    <h4>Ignore this</h4>
  </a>
</form>`

test("parses result cards independently and keeps unavailable fields null", () => {
  const parsed = parseSearchPage(SEARCH_FIXTURE)
  expect(parsed.results).toHaveLength(2)
  expect(parsed.results[0]).toEqual({
    id: "data-engineer-english",
    title: "Data & Platform Engineer",
    company: null,
    companyUrl: null,
    location: "Amsterdam",
    date: null,
    deadline: null,
    url: "https://undutchables.nl/vacancies/data-engineer-english",
    description: null,
  })
  expect(parseJobCards(SEARCH_FIXTURE)[1].id).toBe("software-developer-utrecht")
})

test("builds the researched filter and pagination URL", () => {
  const url = new URL(buildSearchUrl({ query: "engineer", location: "Amsterdam", page: 2 }))
  expect(url.pathname).toBe("/vacancies/p2")
  expect(url.searchParams.get("discipline")).toBe("241")
  expect(url.searchParams.get("language")).toBe("217")
  expect(url.searchParams.get("q")).toBe("engineer")
  expect(url.searchParams.get("location")).toBe("Amsterdam")
})
