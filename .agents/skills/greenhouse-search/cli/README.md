# greenhouse-cli

Search jobs on Greenhouse-hosted career boards via the public
boards-api.greenhouse.io JSON API. No auth, zero runtime dependencies —
runs with just [bun](https://bun.sh).

```bash
bun run src/cli.ts search -o hudl -q "engineer" --format table
bun run src/cli.ts detail hudl/8242555 --format plain
```

⚠️ Personal use only — keep request volume low. See `../SKILL.md` and
`../url-reference.md`.

## Development

```bash
bun install        # dev-only: typescript + @types/bun
bun run typecheck  # tsc --noEmit
bun run test       # live smoke tests (hits boards-api.greenhouse.io — keep volume low)
```
