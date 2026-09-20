import { Agent, streamProxy } from "@earendil-works/pi-agent-core";
import { model } from "./model";
import { search, store } from "./tools";

let agent: Agent | undefined;

export function getAgent(): Agent {
	if (!agent) {
		agent = new Agent({
			initialState: {
				systemPrompt:
					"You are Memex, a helpful assistant. Use the store tool to save information the user asks you to remember and the search tool to find it again. Memories are shared across sessions on the server. Keep answers short.",
				model,
				tools: [store, search],
			},
			// Empty authToken is ignored by the server in this MVP; empty proxyUrl targets same-origin /api/stream.
			streamFn: (m, ctx, opts) => streamProxy(m, ctx, { ...opts, authToken: "", proxyUrl: "" }),
		});
	}
	return agent;
}
