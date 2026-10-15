# smartrecruiters-cli

Search jobs on SmartRecruiters-hosted boards via the public
api.smartrecruiters.com REST API. No auth, zero runtime dependencies — runs
with just [bun](https://bun.sh).

```bash
bun run src/cli.ts search -o TAPI -q "engineer" --format table
bun run src/cli.ts detail TAPI/<id> --format plain
```

⚠️ Personal use only — keep request volume low. See `../SKILL.md` and
`../url-reference.md`.

## Development

```bash
bun install        # dev-only: typescript + @types/bun
bun run typecheck  # tsc --noEmit
bun run test       # live smoke tests (hits api.smartrecruiters.com — keep volume low)
```
