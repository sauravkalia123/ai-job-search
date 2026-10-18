import { describe, expect, test } from "bun:test"
import { runCLI } from "./helpers"

describe("IND Sponsors CLI error contract", () => {
  test("detail without a required external URL writes JSON to stderr", async () => {
    const result = await runCLI(["detail"])
    expect(result.exitCode).toBe(1)
    expect(result.stdout).toBe("")
    expect(JSON.parse(result.stderr)).toEqual({
      error: "detail requires an <id|url>",
      code: "MISSING_REQUIRED",
    })
  })

  test("a bogus flag is rejected instead of silently ignored", async () => {
    const result = await runCLI(["search", "--bogus", "value"])
    expect(result.exitCode).toBe(1)
    expect(result.stdout).toBe("")
    const error = JSON.parse(result.stderr)
    expect(error.code).toBe("UNKNOWN_FLAG")
    expect(error.error).toContain("--bogus")
  })

  test("a detail URL must use http or https", async () => {
    const result = await runCLI(["detail", "javascript:alert(1)"])
    expect(result.exitCode).toBe(1)
    expect(JSON.parse(result.stderr).code).toBe("BAD_ID")
  })
})
