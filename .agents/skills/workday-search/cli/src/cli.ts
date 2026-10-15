#!/usr/bin/env bun
// Self-contained CLI for Workday tenant job sites (<tenant>.wd<N>.myworkdayjobs.com).
// No external CLI framework: runs anywhere `bun` is available.
//
// Personal use only — keep volume low; no commercial or bulk use.

import { runSearch, type SearchOpts } from "./commands/search.js"
import { runDetail, type DetailOpts } from "./commands/detail.js"
import { parseBoardTarget, writeError, type BoardTarget } from "./helpers.js"

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

const HELP = `workday-cli — search jobs on Workday tenant sites (<tenant>.wd<N>.myworkdayjobs.com)

USAGE
  bun run src/cli.ts search -b "<host>/<site>" [-q "<keywords>"] [flags]
  bun run src/cli.ts detail <full-job-url> [--format json|plain]
  bun run src/cli.ts detail "<externalPath>" -b "<host>/<site>" [--format json|plain]

The board reference is the Workday host plus site segment, e.g.
"cisco.wd5.myworkdayjobs.com/Cisco_Careers" (take both from any job URL on
that tenant).

SEARCH FLAGS
  --board, -b <ref>    Workday host/site. REQUIRED.
  --query, -q <text>   Server-side keyword search (the site's own searchText).
  --page <n>           1-indexed page (20 results per server page).
  --limit, -n <n>      Cap results emitted (client-side).
  --format <fmt>       json (default) | table | plain.

  Search results carry no real dates (only "Posted N Days Ago" labels);
  detail returns datePosted from the posting page.

EXAMPLES
  bun run src/cli.ts search -b cisco.wd5.myworkdayjobs.com/Cisco_Careers -q "embedded software" -n 10
  bun run src/cli.ts detail "https://cisco.wd5.myworkdayjobs.com/Cisco_Careers/job/Lysaker-Norway/Embedded-Software-Engineer_2027896"

Personal use only — keep volume low.
`

const KNOWN_FLAGS: Record<string, Set<string>> = {
  search: new Set(["board", "query", "page", "limit", "format", "help", "h"]),
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

  const board = typeof flags.board === "string" ? flags.board : undefined
  const target: BoardTarget | null = board ? parseBoardTarget(board) : null

  if (cmd === "search") {
    if (!board || !target) {
      process.stderr.write(
        JSON.stringify({
          error: 'the --board/-b flag is required, formatted "host/site" (e.g. -b "cisco.wd5.myworkdayjobs.com/Cisco_Careers")',
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
    let page = 1
    if (flags.page !== undefined) {
      const v = parseIntFlag("page", flags.page)
      if (v === null) return 1
      page = v
    }
    let limit = SERVER_PAGE_SIZE_DEFAULT
    if (flags.limit !== undefined) {
      const v = parseIntFlag("limit", flags.limit)
      if (v === null) return 1
      limit = v
    }
    const opts: SearchOpts = {
      board,
      target,
      query: typeof flags.query === "string" && flags.query.length > 0 ? flags.query : undefined,
      page,
      limit,
      format: (["json", "table", "plain"].includes(fmt) ? fmt : "json") as SearchOpts["format"],
    }
    return runSearch(opts)
  }

  if (cmd === "detail") {
    const id = (flags._ as string[])[1]
    if (!id) {
      process.stderr.write(JSON.stringify({ error: "detail requires a job URL or externalPath", code: "NO_ID" }) + "\n")
      return 1
    }
    const fmt = (flags.format as string) || "json"
    const opts: DetailOpts = {
      id,
      board,
      target,
      format: (fmt === "plain" ? "plain" : "json") as DetailOpts["format"],
    }
    return runDetail(opts)
  }

  process.stderr.write(JSON.stringify({ error: `Unknown command "${cmd}"`, code: "BAD_CMD" }) + "\n")
  return 1
}

const SERVER_PAGE_SIZE_DEFAULT = 20

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
