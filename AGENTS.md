# Working with Memex

Memex is a deliberately minimal browser chat agent. "Dumb and simple" is a
design goal — resist scope creep.

## Commands

- `pnpm install` — install deps.
- `pnpm dev` — dev server; requires `.env` with `DEEPSEEK_API_KEY`.
- `pnpm check` — svelte-check / type check.
- `pnpm build` — production build.

Never commit or log `DEEPSEEK_API_KEY`. `.env` is gitignored; keep it that way.

## Code rules

- Svelte 5 runes only: `$state` / `$props` / `$effect`, no legacy stores, no
  `on:` directives.
- No fallbacks, no defensive guards. Invalid state throws with a clear error.
- Comments carry intent only — nothing the code already shows.
- Define tool parameters with typebox `Type.Object`.

## Reference

- Installed `node_modules/@earendil-works/*` `.d.ts` files are the API source
  of truth (installed 0.85.1).
- `~/Projects/pi` is the dev repo at a newer version — consult it for concepts,
  but installed code wins on any discrepancy.
- Svelte: `~/Projects/svelte`. SvelteKit: `~/Projects/kit`.
