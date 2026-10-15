#!/usr/bin/env bun
// Self-contained CLI for Ashby-hosted job boards (jobs.ashbyhq.com).
// No external CLI framework: runs anywhere `bun` is available.
//
// ⚠️ Personal use only. The board-search GraphQL endpoint lives under a path
// robots.txt disallows (/api/) — use accepted by the user for personal,
// low-volume job search. Keep volume low; no commercial or bulk use.

import { runSearch, type SearchOpts } from "./commands/search.js"
import { runDetail, type DetailOpts } from "./commands/detail.js"

interface Flags {
  _: string[]
  [k: string]: string | boolean | string[]
}

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { _: [] }
  const alias: Record<string, string> = { q: "query", n: "limit", b: "board" }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith("--") || a.startsWith("-")) {
      const key = alias[a.replace(/^-+/, "")] ?? a.replace(/^-+/, "")
      const next = argv[i + 1]
      if (next === undefined || next.startsWith("-")) {
        flags[key] = true
      } else {
        flags[key] = next
        i++
      }
    } else {
      ;(flags._ as string[]).push(a)
    }
  }
  return flags
}

const HELP = `ashby-cli — search jobs on Ashby-hosted boards (jobs.ashbyhq.com/<org>)

USAGE
  bun run src/cli.ts search --board <org> [-q "<filter>"] [flags]
  bun run src/cli.ts detail <org>/<postingId> [--format json|plain]
  bun run src/cli.ts detail <full-url> [--format json|plain]

Ashby hosts one board per organization; the public API has NO global search,
so --board is required (find org names in board URLs like
jobs.ashbyhq.com/airbound).

SEARCH FLAGS
  --board, -b <org>    Organization board name. REQUIRED.
  --query, -q <text>   Client-side filter on title/location.
  --limit, -n <n>      Cap results emitted (client-side).
  --format <fmt>       json (default) | table | plain.

  No --jobage flag: the board API carries no posting dates (detail does).

DETAIL
  Accepts "<board>/<postingId>" or a full jobs.ashbyhq.com URL (a bare id
  works with --board).

EXAMPLES
  bun run src/cli.ts search -b airbound --format table
  bun run src/cli.ts search -b airbound -q "engineer" -n 10
  bun run src/cli.ts detail airbound/e11026cb-e2db-4b0c-8792-8c40fd545fb7 --format plain

⚠️ Personal use only — robots.txt disallows the /api/ path used for search;
use is by explicit user decision, keep volume low.
`

const KNOWN_FLAGS: Record<string, Set<string>> = {
  search: new Set(["board", "query", "limit", "format", "help", "h"]),
  detail: new Set(["board", "format", "help", "h"]),
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2)
  const flags = parseFlags(argv)
  const cmd = (flags._ as string[])[0]

  if (!cmd || flags.help || flags.h) {
    process.stdout.write(HELP)
    return cmd ? 0 : 1
  }

  // Reject unknown flags: a silently discarded filter changes results with
  // no error.
  const knownFlags = KNOWN_FLAGS[cmd]
  if (knownFlags) {
    for (const key of Object.keys(flags)) {
      if (key === "_" || knownFlags.has(key)) continue
      process.stderr.write(
        JSON.stringify({
          error: `unknown flag --${key} for '${cmd}' - flags are never silently ignored, because a discarded filter changes what the search returns; see --help for the supported flags`,
          code: "UNKNOWN_FLAG",
        }) + "\n",
      )
      return 1
    }
  }

  if (cmd === "search") {
    const board = typeof flags.board === "string" ? flags.board : undefined
    if (!board) {
      process.stderr.write(
        JSON.stringify({
          error: 'the --board/-b flag is required (e.g. -b "airbound" from jobs.ashbyhq.com/airbound)',
          code: "NO_BOARD",
        }) + "\n",
      )
      return 1
    }
    const fmt = (flags.format as string) || "json"
    const parseIntFlag = (name: string, raw: string | boolean | string[]): number | null => {
      const val = typeof raw === "string" ? Number(raw.trim()) : NaN
      if (!Number.isInteger(val) || val < 1) {
        process.stderr.write(
          JSON.stringify({ error: `--${name} must be a whole number of at least 1, got "${raw}"`, code: "BAD_ARG" }) + "\n",
        )
        return null
      }
      return val
    }
    let limit: number | undefined
    if (flags.limit !== undefined) {
      const v = parseIntFlag("limit", flags.limit)
      if (v === null) return 1
      limit = v
    }
    const opts: SearchOpts = {
      board,
      query: typeof flags.query === "string" && flags.query.length > 0 ? flags.query : undefined,
      limit,
      format: (["json", "table", "plain"].includes(fmt) ? fmt : "json") as SearchOpts["format"],
    }
    return runSearch(opts)
  }

  if (cmd === "detail") {
    const id = (flags._ as string[])[1]
    if (!id) {
      process.stderr.write(JSON.stringify({ error: "detail requires <org>/<postingId> or a full URL", code: "NO_ID" }) + "\n")
      return 1
    }
    const fmt = (flags.format as string) || "json"
    const opts: DetailOpts = {
      id,
      board: typeof flags.board === "string" ? flags.board : undefined,
      format: (fmt === "plain" ? "plain" : "json") as DetailOpts["format"],
    }
    return runDetail(opts)
  }

  process.stderr.write(JSON.stringify({ error: `Unknown command "${cmd}"`, code: "BAD_CMD" }) + "\n")
  return 1
}

main()
  .then((code) => process.exit(code))
  .catch((e) => {
    process.stderr.write(
      JSON.stringify({
        error: e instanceof Error ? e.message : String(e),
        code: "INTERNAL_ERROR",
      }) + "\n",
    )
    process.exit(1)
  })
