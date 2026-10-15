#!/usr/bin/env bun
// Self-contained CLI for Teamtailor-hosted career sites
// (<sub>.teamtailor.com/jobs.json). No external CLI framework.
//
// Personal use only — keep volume low; no commercial or bulk use.

import { runSearch, type SearchOpts } from "./commands/search.js"
import { runDetail, type DetailOpts } from "./commands/detail.js"

interface Flags {
  _: string[]
  [k: string]: string | boolean | string[]
}

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { _: [] }
  const alias: Record<string, string> = { q: "query", n: "limit", o: "org" }
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

const HELP = `teamtailor-cli — search jobs on Teamtailor-hosted career sites (<org>.teamtailor.com)

USAGE
  bun run src/cli.ts search -o <org> [-q "<filter>"] [flags]
  bun run src/cli.ts detail <org>/<id> [--format json|plain]
  bun run src/cli.ts detail <full-job-url> [--format json|plain]

The org is the subdomain token: combine.teamtailor.com -> "combine".

SEARCH FLAGS
  --org, -o <org>      Board subdomain token. REQUIRED.
  --query, -q <text>   Client-side filter on title/location.
  --limit, -n <n>      Cap results emitted (client-side).
  --format <fmt>       json (default) | table | plain.

EXAMPLES
  bun run src/cli.ts search -o combine --format table
  bun run src/cli.ts search -o combine -q "embedded"
  bun run src/cli.ts detail combine/e44bb67c-e920-4ab9-b258-14a96214e8b2 --format plain

Personal use only — keep volume low.
`

const KNOWN_FLAGS: Record<string, Set<string>> = {
  search: new Set(["org", "query", "limit", "format", "help", "h"]),
  detail: new Set(["org", "format", "help", "h"]),
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

  const org = typeof flags.org === "string" ? flags.org : undefined

  if (cmd === "search") {
    if (!org) {
      process.stderr.write(
        JSON.stringify({
          error: 'the --org/-o flag is required (e.g. -o "combine" from combine.teamtailor.com)',
          code: "NO_ORG",
        }) + "\n",
      )
      return 1
    }
    const fmt = (flags.format as string) || "json"
    let limit: number | undefined
    if (flags.limit !== undefined) {
      const val = typeof flags.limit === "string" ? Number(flags.limit.trim()) : NaN
      if (!Number.isInteger(val) || val < 1) {
        process.stderr.write(
          JSON.stringify({ error: `--limit must be a whole number of at least 1, got "${flags.limit}"`, code: "BAD_ARG" }) + "\n",
        )
        return 1
      }
      limit = val
    }
    const opts: SearchOpts = {
      org,
      query: typeof flags.query === "string" && flags.query.length > 0 ? flags.query : undefined,
      limit,
      format: (["json", "table", "plain"].includes(fmt) ? fmt : "json") as SearchOpts["format"],
    }
    return runSearch(opts)
  }

  if (cmd === "detail") {
    const id = (flags._ as string[])[1]
    if (!id) {
      process.stderr.write(JSON.stringify({ error: "detail requires <org>/<id> or a full job URL", code: "NO_ID" }) + "\n")
      return 1
    }
    const fmt = (flags.format as string) || "json"
    const opts: DetailOpts = {
      id,
      org,
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
