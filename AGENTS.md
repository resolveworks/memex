# Working with Memex

Memex is a deliberately minimal browser chat agent: a SvelteKit app running
`@earendil-works/pi-agent-core` in the browser with two server-backed tools.
"Dumb and simple" is a design goal — resist scope creep.

## Commands

- `pnpm install` — install deps.
- `pnpm dev` — dev server; requires `.env` with `DEEPSEEK_API_KEY`.
- `pnpm check` — svelte-check / type check.
- `pnpm build` — production build.

Never commit or log `DEEPSEEK_API_KEY`. `.env` is gitignored; keep it that way.

## Architecture

- The agent runs **in the browser** (`src/lib/agent.ts`). LLM calls go through
  `streamProxy` same-origin to `POST /api/stream`.
- `/api/stream` (`src/routes/api/stream/+server.ts`) holds the key and streams
  SSE-style `data: {...}\n\n` lines mapping pi-ai events to proxy events.
- The server is **model-authoritative**: the model is resolved in
  `src/lib/model.ts` and the client's `body.model` is ignored.
- Tools: `store` / `search` in `src/lib/tools.ts`. Each calls `/api/memories`,
  which reads and writes `data/memories.json` through `src/lib/server/storage.ts`.
- `search` is index-free: the query is split into words, each of which must
  appear in a memory's key or value.
- No auth yet. The marked comment at the top of the stream handler is the
  agreed single insertion point.

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
