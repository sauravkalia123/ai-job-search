import { expect, test } from "bun:test"
import { parseJSON, runCLI } from "./helpers.js"

interface SearchResult {
  id: string
  title: string
  url: string
}

interface SearchOutput {
  results: SearchResult[]
}

test("live search returns a real Undutchables vacancy", async () => {
  const result = await runCLI(["search", "-q", "engineer", "--limit", "1"])
  const output = parseJSON<SearchOutput>(result)
  expect(result.exitCode).toBe(0)
  expect(output.results.length).toBeGreaterThanOrEqual(1)
  expect(output.results[0].id).toBeTruthy()
  expect(output.results[0].title).toBeTruthy()
  expect(output.results[0].url).toMatch(/^https:\/\/undutchables\.nl\/vacancies\//)
})

test("live detail returns readable text for a current vacancy", async () => {
  const search = parseJSON<SearchOutput>(await runCLI(["search", "-q", "engineer", "--limit", "1"]))
  const detail = await runCLI(["detail", search.results[0].id, "--format", "plain"])
  expect(detail.exitCode).toBe(0)
  expect(detail.stdout).toContain(search.results[0].title)
  expect(detail.stdout).not.toContain("<h2>")
})
