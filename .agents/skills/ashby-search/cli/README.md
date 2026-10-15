# ashby-cli

Search jobs on Ashby-hosted career boards (`jobs.ashbyhq.com/<org>`) from the
command line. No authentication, zero runtime dependencies — runs with just
[bun](https://bun.sh).

```bash
bun run src/cli.ts search -b airbound --format table
bun run src/cli.ts detail airbound/<postingId> --format plain
```

⚠️ **Personal use only.** Board search uses Ashby's open GraphQL endpoint
under `/api/`, which robots.txt disallows — this usage was explicitly accepted
by the user for personal, low-volume job search. Keep volume low.

See `../SKILL.md` for the command reference and `../url-reference.md` for the
endpoint anchors.

## Development

```bash
bun install        # dev-only: typescript + @types/bun
bun run typecheck  # tsc --noEmit
bun run test       # live smoke tests (hits jobs.ashbyhq.com — keep volume low)
```
