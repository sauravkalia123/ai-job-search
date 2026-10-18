#!/usr/bin/env bun

import { runSearch, type SearchOpts } from "./commands/search.js"
import { runDetail, type DetailOpts } from "./commands/detail.js"
import { writeError } from "./helpers.js"

interface Flags {
  _: string[]
  [key: string]: string | boolean | string[]
}

const aliases: Record<string, string> = { q: "query", l: "location", n: "limit" }

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { _: [] }
  for (let index = 0; index < argv.length; index++) {
    const token = argv[index]
    if (!token.startsWith("-")) {
      flags._.push(token)
      continue
    }
    const rendered = token.replace(/^-+/, "")
    const equals = rendered.indexOf("=")
    const rawKey = equals >= 0 ? rendered.slice(0, equals) : rendered
    const key = aliases[rawKey] ?? rawKey
    if (equals >= 0) {
      flags[key] = rendered.slice(equals + 1)
      continue
    }
    const next = argv[index + 1]
    if (next !== undefined && !next.startsWith("-")) {
      flags[key] = next
      index++
    } else {
      flags[key] = true
    }
  }
  return flags
}

const HELP = `togetherabroad-cli — search public Together Abroad jobs in the Netherlands

USAGE
  bun run src/cli.ts search [flags]
  bun run src/cli.ts detail <id|url> [--format json|plain]

SEARCH FLAGS
  --query, -q <text>       Keyword search; omit for the English/ICT category
  --location, -l <text>    Location hint (included in the form keyword search)
  --jobage <days>          Positive age bucket, 1 through 14 days
  --page <n>               1-indexed page number
  --limit, -n <n>          Client-side result cap
  --format <fmt>           json (default) | table | plain

EXAMPLES
  bun run src/cli.ts search --limit 5 --format table
  bun run src/cli.ts search -q "software engineer" -l "Amsterdam" --jobage 7
  bun run src/cli.ts detail 947801 --format plain
`

const knownFlags: Record<string, Set<string>> = {
  search: new Set(["query", "location", "jobage", "page", "limit", "format", "help", "h"]),
  detail: new Set(["format", "help", "h"]),
}

function badArg(error: string, code = "BAD_ARG"): number {
  writeError(error, code)
  return 1
}

function positiveInteger(name: string, value: string | boolean | string[]): number | null {
  const number = typeof value === "string" ? Number(value.trim()) : NaN
  if (!Number.isInteger(number) || number < 1) {
    badArg(`--${name} must be a whole number of at least 1, got "${value}"`)
    return null
  }
  return number
}

async function main(): Promise<number> {
  const flags = parseFlags(process.argv.slice(2))
  const command = flags._[0]
  if (!command || flags.help || flags.h) {
    process.stdout.write(HELP)
    return command ? 0 : 1
  }

  const known = knownFlags[command]
  if (!known) return badArg(`Unknown command "${command}"`, "BAD_CMD")
  for (const key of Object.keys(flags)) {
    if (key !== "_" && !known.has(key)) {
      return badArg(`unknown flag --${key} for '${command}'; see --help for supported flags`, "UNKNOWN_FLAG")
    }
  }

  const format = flags.format === undefined ? "json" : String(flags.format)
  if (command === "search") {
    if (!["json", "table", "plain"].includes(format)) return badArg(`--format must be one of json|table|plain, got "${format}"`)
    const page = flags.page === undefined ? 1 : positiveInteger("page", flags.page)
    const limit = flags.limit === undefined ? undefined : positiveInteger("limit", flags.limit)
    const jobage = flags.jobage === undefined ? undefined : positiveInteger("jobage", flags.jobage)
    if (page === null || limit === null || jobage === null) return 1
    if (jobage !== undefined && jobage > 14) return badArg("Together Abroad exposes publication buckets only through 14 days; use --jobage 14 or less", "UNSUPPORTED_JOBAGE")
    const opts: SearchOpts = {
      query: typeof flags.query === "string" ? flags.query : undefined,
      location: typeof flags.location === "string" ? flags.location : undefined,
      jobage,
      page,
      limit,
      format: format as SearchOpts["format"],
    }
    return runSearch(opts)
  }

  if (command === "detail") {
    const id = flags._[1]
    if (!id) return badArg("detail requires an <id|url>", "NO_ID")
    if (!["json", "plain"].includes(format)) return badArg(`--format must be one of json|plain, got "${format}"`)
    const opts: DetailOpts = { id, format: format as DetailOpts["format"] }
    return runDetail(opts)
  }

  return 1
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    writeError(error instanceof Error ? error.message : String(error), "INTERNAL_ERROR")
    process.exit(1)
  })
