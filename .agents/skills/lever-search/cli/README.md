# lever-cli

Search jobs on Lever-hosted career boards via the public
api.lever.co/v0/postings API. No auth, zero runtime dependencies — runs with
just [bun](https://bun.sh).

```bash
bun run src/cli.ts search -o tala --format table
bun run src/cli.ts detail <org>/<id> --format plain
```

⚠️ Personal use only — robots Crawl-delay 1; keep request volume low.
See `../SKILL.md` and `../url-reference.md`.

## Development

```bash
bun install        # dev-only: typescript + @types/bun
bun run typecheck  # tsc --noEmit
bun run test       # live smoke tests (hits api.lever.co — keep volume low)
```
