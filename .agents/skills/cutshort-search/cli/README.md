# cutshort-cli

Search jobs on [cutshort.io](https://cutshort.io) (India-focused tech job
board) from the command line. No authentication, zero runtime dependencies —
runs with just [bun](https://bun.sh).

```bash
bun run src/cli.ts search -q "gstreamer" --limit 5 --format table
bun run src/cli.ts detail <slug|url> --format plain
```

See `../SKILL.md` for the full command reference and `../url-reference.md`
for the payload anchors the parsers depend on.

## Development

```bash
bun install        # dev-only: typescript + @types/bun
bun run typecheck  # tsc --noEmit
bun run test       # live smoke tests (hits cutshort.io — keep volume low)
```

Personal use only — keep request volume low.
