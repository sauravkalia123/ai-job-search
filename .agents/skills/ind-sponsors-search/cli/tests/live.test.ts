import { describe, expect, test } from "bun:test"
import { parseJSON, runCLI } from "./helpers"

interface SearchOutput {
  results: Array<{ id: string; title: string; url: string }>
}

describe("IND Sponsors live smoke test", () => {
  test("software search returns a real external listing", async () => {
    const result = await runCLI(["search", "--query", "software", "--limit", "1"])
    const output = parseJSON<SearchOutput>(result)
    expect(output.results.length).toBeGreaterThanOrEqual(1)
    expect(output.results[0].id).toBeTruthy()
    expect(output.results[0].title).toBeTruthy()
    expect(output.results[0].url).toMatch(/^https?:\/\//)
  }, 30000)
})
