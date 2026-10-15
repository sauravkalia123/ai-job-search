# personio-cli

Search jobs on Personio-hosted career sites via their public XML feed. No
auth, zero runtime dependencies — runs with just [bun](https://bun.sh).

```bash
bun run src/cli.ts search -o mm-software-gmbh --format table
bun run src/cli.ts detail mm-software-gmbh/2842113 --format plain
```

⚠️ Personal use only — keep request volume low. See `../SKILL.md` and
`../url-reference.md`.

## Development

```bash
bun install        # dev-only: typescript + @types/bun
bun run typecheck  # tsc --noEmit
bun run test       # live smoke tests (hits a Personio board — keep volume low)
```
