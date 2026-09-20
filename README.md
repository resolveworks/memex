# Memex

Memex is a deliberately minimal browser chat agent. The agent itself runs in
the browser (SvelteKit + `@earendil-works/pi-agent-core`) with two
localStorage-backed tools, `store` and `retrieve`, so it can remember things
you tell it. "Dumb and simple" is the design goal.

## Quickstart

```sh
pnpm install
cp .env.example .env   # then set DEEPSEEK_API_KEY
pnpm dev
```

## How it works

```
browser                                     server (SvelteKit)
┌───────────────────────────────┐
│ Agent (src/lib/agent.ts)      │           ┌──────────────────────────┐
│  ├─ tools: store / retrieve   │  POST     │ /api/stream/+server.ts   │
│  │    └─ localStorage         │ ────────► │  ├─ holds DEEPSEEK key   │
│  └─ streamProxy ──────────────┼─ /api/    │  └─ maps pi-ai events →  │
│                               │  stream   │     SSE data: lines      │
└───────────────────────────────┘           └────────────┬─────────────┘
                                                         │
                                                         ▼
                                                   DeepSeek API
```

The agent runs in the browser; LLM calls go same-origin through `streamProxy`
to `/api/stream`, which holds the DeepSeek key and streams SSE-style
`data: {...}\n\n` lines back. The server is model-authoritative: the client's
`body.model` is ignored.

### Source map

- `src/lib/agent.ts` — browser `Agent` instance (system prompt, model, tools, `streamFn`).
- `src/lib/tools.ts` — `store` / `retrieve` tools over localStorage (`memex:` prefix).
- `src/lib/model.ts` — the single resolved model (`deepseek/deepseek-v4-flash`).
- `src/lib/server/llm.ts` — server-side model registry with `DEEPSEEK_API_KEY` via `$env/dynamic/private`.
- `src/routes/api/stream/+server.ts` — streaming proxy endpoint; pi-ai event → proxy event mapping. Auth insertion point marked at the top.
- `src/routes/+page.svelte` — chat UI (Svelte 5 runes).
- `src/routes/+layout.svelte` — root layout.

## Notes

- Swap the model in `src/lib/model.ts`.
- Auth slots into the marked comment at the top of the stream handler.
- Memories live in the browser's localStorage — they are per-browser, not synced.
