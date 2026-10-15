# teamtailor-cli

Search jobs on Teamtailor-hosted career sites via their public jobs.json
JSON-Feed. No auth, zero runtime dependencies — runs with just
[bun](https://bun.sh).

```bash
bun run src/cli.ts search -o combine --format table
bun run src/cli.ts detail combine/<uuid> --format plain
```

⚠️ Personal use only — keep request volume low. See `../SKILL.md` and
`../url-reference.md`.

## Development

```bash
bun install        # dev-only: typescript + @types/bun
bun run typecheck  # tsc --noEmit
bun run test       # live smoke tests (hits a Teamtailor board — keep volume low)
```
