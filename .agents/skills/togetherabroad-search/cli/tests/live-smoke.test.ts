import { describe, expect, test } from "bun:test"
import { parseJSON, runCLI } from "./helpers"

interface SearchOutput {
  results: Array<{ id: string | null; title: string | null; url: string | null }>
}

describe("Together Abroad live smoke test", () => {
  test("public ICT category returns a real result", async () => {
    const result = await runCLI(["search", "--limit", "1"])
    const output = parseJSON<SearchOutput>(result)
    expect(output.results.length).toBeGreaterThanOrEqual(1)
    expect(output.results[0].id).not.toBeNull()
    expect(output.results[0].title).not.toBeNull()
    expect(output.results[0].url).toMatch(/^https:\/\/www\.togetherabroad\.nl\//)
  }, 30000)
})
