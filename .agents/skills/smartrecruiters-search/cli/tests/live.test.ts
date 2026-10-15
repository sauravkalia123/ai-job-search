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

describe("smartrecruiters-cli live", () => {
  test("search returns live board postings", async () => {
    const result = await runCLI(["search", "-o", "TAPI", "--limit", "3"]);
    expect(result.exitCode).toBe(0);
    const data = parseJSON<SearchResponse>(result);
    expect(data.meta.count).toBeGreaterThanOrEqual(1);
    const first = data.results[0];
    expect(first.title.length).toBeGreaterThan(0);
    expect(first.url).toContain("jobs.smartrecruiters.com/TAPI/");
  });

  test("missing --org exits 1 with a JSON error", async () => {
    const result = await runCLI(["search", "-q", "engineer"]);
    expect(result.exitCode).toBe(1);
    const err = JSON.parse(result.stderr);
    expect(err.code).toBe("NO_ORG");
  });

  test("bogus flag exits 1 with a JSON error on stderr", async () => {
    const result = await runCLI(["search", "-o", "TAPI", "--bogus", "1"]);
    expect(result.exitCode).toBe(1);
    const err = JSON.parse(result.stderr);
    expect(err.code).toBe("UNKNOWN_FLAG");
  });

  test("detail resolves a live posting", async () => {
    const search = parseJSON<SearchResponse>(
      await runCLI(["search", "-o", "TAPI", "--limit", "1"]),
    );
    expect(search.meta.count).toBeGreaterThanOrEqual(1);
    const url = search.results[0].url;

    const result = await runCLI(["detail", url, "--format", "json"]);
    expect(result.exitCode).toBe(0);
    const detail = JSON.parse(result.stdout);
    expect(detail.title.length).toBeGreaterThan(0);
    if (detail.description !== null) {
      expect(detail.description.length).toBeGreaterThan(0);
      expect(detail.description).not.toMatch(/<[a-z]+[\s>]/i);
    }
  });
});
