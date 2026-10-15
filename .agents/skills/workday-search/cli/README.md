# workday-cli

Search jobs on Workday tenant career sites from the command line. No auth,
zero runtime dependencies — runs with just [bun](https://bun.sh).

```bash
bun run src/cli.ts search -b cisco.wd5.myworkdayjobs.com/Cisco_Careers -q "embedded software" --format table
bun run src/cli.ts detail <full-job-url> --format plain
```

⚠️ Personal use only — keep request volume low. See `../SKILL.md` and
`../url-reference.md`.

## Development

```bash
bun install        # dev-only: typescript + @types/bun
bun run typecheck  # tsc --noEmit
bun run test       # live smoke tests (hits a Workday tenant — keep volume low)
```
