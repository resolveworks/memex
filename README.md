# Memex

Memex is a deliberately minimal browser chat agent. The agent itself runs in
the browser (SvelteKit + `@earendil-works/pi-agent-core`) with two server-backed
tools, `store` and `search`, so it can remember things you tell it. "Dumb and
simple" is the design goal.

## Quickstart

```sh
pnpm install
cp .env.example .env   # then set DEEPSEEK_API_KEY
pnpm dev
```

## How it works

```
browser                                       server (SvelteKit)
┌─────────────────────────────┐             ┌──────────────────────────────┐
│ Agent (src/lib/agent.ts)    │  /api/stream│ /api/stream/+server.ts       │
│  ├─ streamProxy ────────────┼────────────►│  ├─ holds DEEPSEEK key       │
│  └─ tools: store / search   │  /api/      │  └─ maps pi-ai events →      │
│       └─ fetch ─────────────┼─ memories ─►│     SSE data: lines          │
└─────────────────────────────┘             ├──────────────────────────────┤
                                            │ /api/memories/+server.ts     │
                                            │  └─ server/storage.ts        │
                                            │       └─ data/memories.json  │
                                            └───────────────┬──────────────┘
                                                            ▼
                                                      DeepSeek API
```

The agent runs in the browser; LLM calls go same-origin through `streamProxy`
to `/api/stream`, which holds the DeepSeek key and streams SSE-style
`data: {...}\n\n` lines back. The server is model-authoritative: the client's
`body.model` is ignored.

Memories live on the server in `data/memories.json` (a flat JSON array).
`search` does a naive, index-free full-text match: the queries are split into
words, and a memory matches if any of those words appears in its key or value.

### Source map

- `src/lib/agent.ts` — browser `Agent` instance (system prompt, model, tools, `streamFn`).
- `src/lib/tools.ts` — `store` / `search` tools; each calls `/api/memories`.
- `src/lib/memory.ts` — the shared `Memory` record type.
- `src/lib/server/storage.ts` — server-only JSON-file storage: `list` / `put` / `search`.
- `src/routes/api/memories/+server.ts` — `GET` list or repeated `?q=` search, `POST` upsert.
- `src/lib/model.ts` — the single resolved model (`deepseek/deepseek-v4-flash`).
- `src/lib/server/llm.ts` — server-side model registry with `DEEPSEEK_API_KEY` via `$env/dynamic/private`.
- `src/routes/api/stream/+server.ts` — streaming proxy endpoint; pi-ai event → proxy event mapping. Auth insertion point marked at the top.
- `src/routes/+page.svelte` — chat UI (Svelte 5 runes).
- `src/routes/+layout.svelte` — root layout.

## Notes

- Swap the model in `src/lib/model.ts`.
- Auth slots into the marked comment at the top of the stream handler.
- Memories live on the server in `data/memories.json` — shared across sessions and browsers. `/data` is gitignored.
- The search is index-free and scans every memory on each call. Fine for MVP-sized stores.
