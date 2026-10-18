import { expect, test } from "bun:test"
import { parseJSON, runCLI } from "./helpers.js"

test("unknown flags fail with a JSON error on stderr", async () => {
  const result = await runCLI(["search", "--bogus"])
  expect(result.exitCode).toBe(1)
  expect(result.stdout).toBe("")
  const error = parseJSON<{ code: string } & Record<string, unknown>>({ ...result, exitCode: 0, stdout: result.stderr })
  expect(error.code).toBe("UNKNOWN_FLAG")
})

test("detail without an id fails with a JSON error on stderr", async () => {
  const result = await runCLI(["detail"])
  expect(result.exitCode).toBe(1)
  expect(result.stdout).toBe("")
  expect(JSON.parse(result.stderr).code).toBe("MISSING_REQUIRED")
})

test("jobage is rejected instead of silently pretending to filter", async () => {
  const result = await runCLI(["search", "--jobage", "7"])
  expect(result.exitCode).toBe(1)
  expect(JSON.parse(result.stderr).code).toBe("UNSUPPORTED_FILTER")
})
