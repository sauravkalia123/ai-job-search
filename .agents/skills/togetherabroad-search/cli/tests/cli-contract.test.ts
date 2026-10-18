import { describe, expect, test } from "bun:test"
import { runCLI } from "./helpers"

describe("Together Abroad CLI contract", () => {
  test("detail without an ID returns JSON on stderr", async () => {
    const result = await runCLI(["detail"])
    expect(result.exitCode).toBe(1)
    expect(result.stdout).toBe("")
    expect(JSON.parse(result.stderr)).toEqual({ error: "detail requires an <id|url>", code: "NO_ID" })
  })

  test("a bogus flag is not silently ignored", async () => {
    const result = await runCLI(["search", "--bogus", "value"])
    expect(result.exitCode).toBe(1)
    expect(result.stdout).toBe("")
    const error = JSON.parse(result.stderr)
    expect(error.code).toBe("UNKNOWN_FLAG")
    expect(error.error).toContain("--bogus")
  })

  test("unsupported age windows fail before a network request", async () => {
    const result = await runCLI(["search", "--jobage", "30"])
    expect(result.exitCode).toBe(1)
    expect(JSON.parse(result.stderr).code).toBe("UNSUPPORTED_JOBAGE")
  })
})
