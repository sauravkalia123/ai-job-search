#!/usr/bin/env bun

import { runSearch, type SearchOpts } from "./commands/search.js"
import { runDetail, type DetailOpts } from "./commands/detail.js"

interface Flags {
  _: string[]
  [key: string]: string | boolean | string[]
}

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { _: [] }
  const aliases: Record<string, string> = { q: "query", l: "location", n: "limit" }

  for (let index = 0; index < argv.length; index++) {
    const token = argv[index]
    if (!token.startsWith("-")) {
      ;(flags._ as string[]).push(token)
      continue
    }

    const equals = token.indexOf("=")
    const rawKey = token.slice(0, equals === -1 ? undefined : equals).replace(/^-+/, "")
    const key = aliases[rawKey] ?? rawKey
    if (equals !== -1) flags[key] = token.slice(equals + 1)
    else {
      const next = argv[index + 1]
      if (next === undefined || next.startsWith("-")) flags[key] = true
      else {
        flags[key] = next
        index++
      }
    }
  }
  return flags
}

const HELP = `undutchables-cli — search Undutchables vacancies in the Netherlands

USAGE
  bun run src/cli.ts search [flags]
  bun run src/cli.ts detail <id|url> [--format json|plain]

SEARCH FLAGS
  --query, -q <text>       Free-text query
  --location, -l <text>    Portal location filter
  --jobage <days>          Unsupported: Undutchables exposes no posting-age filter
  --page <n>               1-indexed page; later pages use /vacancies/p<n>
  --limit, -n <n>          Client-side result cap
  --format <fmt>           json (default) | table | plain

DETAIL FLAGS
  --format <fmt>           json (default) | plain

The default search filters are discipline=241 (IT-Engineering) and language=217 (English).
Personal use only: filtered vacancy URLs are disallowed by the portal's robots.txt.
`

const KNOWN_FLAGS: Record<string, Set<string>> = {
  search: new Set(["query", "location", "jobage", "page", "limit", "format", "help", "h"]),
  detail: new Set(["format", "help", "h"]),
}

function error(message: string, code: string): number {
  process.stderr.write(JSON.stringify({ error: message, code }) + "\n")
  return 1
}

function positiveInteger(name: string, value: string | boolean | string[]): number | null {
  const number = typeof value === "string" ? Number(value.trim()) : Number.NaN
  if (!Number.isInteger(number) || number < 1) return null
  return number
}

async function main(): Promise<number> {
  const flags = parseFlags(process.argv.slice(2))
  const command = (flags._ as string[])[0]

  if (!command || flags.help || flags.h) {
    process.stdout.write(HELP)
    return command ? 0 : 1
  }

  const known = KNOWN_FLAGS[command]
  if (!known) return error(`Unknown command "${command}"`, "BAD_CMD")
  for (const key of Object.keys(flags)) {
    if (key !== "_" && !known.has(key)) {
      return error(`unknown flag --${key} for '${command}'; see --help for supported flags`, "UNKNOWN_FLAG")
    }
  }

  const format = flags.format === undefined ? "json" : String(flags.format)
  if (command === "search") {
    if (!(["json", "table", "plain"] as string[]).includes(format)) {
      return error(`--format must be one of json|table|plain, got "${format}"`, "BAD_ARG")
    }

    let page = 1
    let limit: number | undefined
    let jobage: number | undefined
    for (const name of ["page", "limit", "jobage"] as const) {
      const raw = flags[name]
      if (raw === undefined) continue
      const parsed = positiveInteger(name, raw)
      if (parsed === null) return error(`--${name} must be a whole number of at least 1`, "BAD_ARG")
      if (name === "page") page = parsed
      else if (name === "limit") limit = parsed
      else jobage = parsed
    }

    const options: SearchOpts = {
      query: typeof flags.query === "string" ? flags.query : undefined,
      location: typeof flags.location === "string" ? flags.location : undefined,
      jobage,
      page,
      limit,
      format: format as SearchOpts["format"],
    }
    return runSearch(options)
  }

  if (format !== "json" && format !== "plain") {
    return error(`--format must be one of json|plain, got "${format}"`, "BAD_ARG")
  }
  const id = (flags._ as string[])[1]
  if (!id) return error("detail requires an <id|url>", "MISSING_REQUIRED")
  const options: DetailOpts = { id, format: format as DetailOpts["format"] }
  return runDetail(options)
}

main()
  .then((code) => process.exit(code))
  .catch((caught) => {
    process.stderr.write(JSON.stringify({
      error: caught instanceof Error ? caught.message : String(caught),
      code: "INTERNAL_ERROR",
    }) + "\n")
    process.exit(1)
  })
