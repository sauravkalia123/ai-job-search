import { describe, test, expect } from "bun:test";
import { runCLI, parseJSON } from "./helpers";

interface SearchResponse {
  meta: { count: number; page: number; total: number };
  results: Array<{
    id: string;
    title: string;
    company: string;
    location: string | null;
    date: string | null;
    url: string;
  }>;
}

describe("workday-cli live", () => {
  test("search returns live postings with server-side keyword filter", async () => {
    const result = await runCLI([
      "search",
      "-b",
      "cisco.wd5.myworkdayjobs.com/Cisco_Careers",
      "-q",
      "embedded software",
      "--limit",
      "3",
    ]);
    expect(result.exitCode).toBe(0);
    const data = parseJSON<SearchResponse>(result);
    expect(data.meta.count).toBeGreaterThanOrEqual(1);
    expect(data.meta.total).toBeGreaterThanOrEqual(data.meta.count);
    const first = data.results[0];
    expect(first.title.length).toBeGreaterThan(0);
    expect(first.url).toContain("cisco.wd5.myworkdayjobs.com/Cisco_Careers/");
  });

  test("missing --board exits 1 with a JSON error", async () => {
    const result = await runCLI(["search", "-q", "engineer"]);
    expect(result.exitCode).toBe(1);
    const err = JSON.parse(result.stderr);
    expect(err.code).toBe("NO_BOARD");
  });

  test("bogus flag exits 1 with a JSON error on stderr", async () => {
    const result = await runCLI(["search", "-b", "cisco.wd5.myworkdayjobs.com/Cisco_Careers", "--bogus", "1"]);
    expect(result.exitCode).toBe(1);
    const err = JSON.parse(result.stderr);
    expect(err.code).toBe("UNKNOWN_FLAG");
  });

  test("detail resolves a live posting with JSON-LD facts", async () => {
    const search = parseJSON<SearchResponse>(
      await runCLI([
        "search",
        "-b",
        "cisco.wd5.myworkdayjobs.com/Cisco_Careers",
        "-q",
        "embedded software",
        "--limit",
        "1",
      ]),
    );
    expect(search.meta.count).toBeGreaterThanOrEqual(1);
    const url = search.results[0].url;

    const result = await runCLI(["detail", url, "--format", "json"]);
    expect(result.exitCode).toBe(0);
    const detail = JSON.parse(result.stdout);
    expect(detail.title.length).toBeGreaterThan(0);
    expect(detail.date).not.toBeNull();
    if (detail.description !== null) {
      expect(detail.description.length).toBeGreaterThan(0);
      expect(detail.description).not.toMatch(/<[a-z]+[\s>]/i);
    }
  });
});
