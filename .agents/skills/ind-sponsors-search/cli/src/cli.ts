#!/usr/bin/env bun

import { runDetail, type DetailOpts } from "./commands/detail.js"
import { runSearch, type SearchOpts } from "./commands/search.js"
import { writeError } from "./helpers.js"

interface Flags {
  _: string[]
  [key: string]: string | boolean | string[]
}

const ALIASES: Record<string, string> = { q: "query" }
const KNOWN: Record<string, Set<string>> = {
  search: new Set(["query", "jobage", "page", "limit", "format", "help", "h"]),
  detail: new Set(["format", "help", "h"]),
}

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]
    if (!token.startsWith("-")) {
      flags._.push(token)
      continue
    }
    const withoutDashes = token.replace(/^-+/, "")
    const equals = withoutDashes.indexOf("=")
    const rawKey = equals === -1 ? withoutDashes : withoutDashes.slice(0, equals)
    const key = ALIASES[rawKey] ?? rawKey
    if (equals !== -1) flags[key] = withoutDashes.slice(equals + 1)
    else {
      const next = argv[i + 1]
      if (next && !next.startsWith("-")) {
        flags[key] = next
        i++
      } else flags[key] = true
    }
  }
  return flags
}

const HELP = `ind-sponsors-cli — search public IND Sponsors jobs in the Netherlands

USAGE
  bun run src/cli.ts search [flags]
  bun run src/cli.ts detail <external-url> [--format json|plain]

SEARCH FLAGS
  --query, -q <text>  Query, default software; matched client-side
  --jobage <days>     Client-side age window using the card date
  --page <n>          1-indexed client-side page
  --limit <n>         Client-side result cap
  --format <format>   json (default), table, or plain

DETAIL FLAGS
  --format <format>   json (default) or plain
`

function numericFlag(flags: Flags, name: string): number | undefined | null {
  if (flags[name] === undefined) return undefined
  const raw = flags[name]
  const value = typeof raw === "string" ? Number(raw.trim()) : NaN
  if (!Number.isInteger(value) || value < 1) {
    writeError(`--${name} must be a whole number of at least 1`, "BAD_ARG")
    return null
  }
  return value
}

function formatFlag(flags: Flags, allowed: string[]): string | null {
  const value = flags.format === undefined ? "json" : String(flags.format)
  if (!allowed.includes(value)) {
    writeError(`--format must be one of ${allowed.join("|")}`, "BAD_ARG")
    return null
  }
  return value
}

async function main(): Promise<number> {
  const flags = parseFlags(process.argv.slice(2))
  const command = flags._[0]
  if (!command || flags.help || flags.h) {
    process.stdout.write(HELP)
    return command ? 0 : 1
  }

  const known = KNOWN[command]
  if (!known) {
    writeError(`Unknown command "${command}"`, "BAD_COMMAND")
    return 1
  }
  for (const key of Object.keys(flags)) {
    if (key !== "_" && !known.has(key)) {
      writeError(`unknown flag --${key} for '${command}'`, "UNKNOWN_FLAG")
      return 1
    }
  }

  if (command === "search") {
    const format = formatFlag(flags, ["json", "table", "plain"])
    if (!format) return 1
    const jobage = numericFlag(flags, "jobage")
    const page = numericFlag(flags, "page")
    const limit = numericFlag(flags, "limit")
    if (jobage === null || page === null || limit === null) return 1
    const opts: SearchOpts = {
      query: typeof flags.query === "string" ? flags.query : "software",
      jobage: jobage ?? undefined,
      page: page ?? 1,
      limit: limit ?? undefined,
      format: format as SearchOpts["format"],
    }
    return runSearch(opts)
  }

  const id = flags._[1]
  if (!id) {
    writeError("detail requires an <id|url>", "MISSING_REQUIRED")
    return 1
  }
  const format = formatFlag(flags, ["json", "plain"])
  if (!format) return 1
  const opts: DetailOpts = { id, format: format as DetailOpts["format"] }
  return runDetail(opts)
}

main().then((code) => process.exit(code)).catch((error: unknown) => {
  writeError(error instanceof Error ? error.message : String(error), "INTERNAL_ERROR")
  process.exit(1)
})
