import type { AgentTool } from "@earendil-works/pi-agent-core";
import { Type } from "typebox";
import type { Memory } from "./memory";

const storeParameters = Type.Object({
	key: Type.String(),
	value: Type.String(),
});

export const store: AgentTool<typeof storeParameters> = {
	name: "store",
	label: "Store",
	description:
		"Save a piece of information under a key on the server. Use this whenever the user asks you to remember something.",
	parameters: storeParameters,
	execute: async (_toolCallId, { key, value }) => {
		const response = await fetch("/api/memories", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ key, value }),
		});
		if (!response.ok) throw new Error(`Failed to store "${key}" (${response.status}).`);
		return {
			content: [{ type: "text", text: `Stored "${key}".` }],
			details: undefined,
		};
	},
};

const searchParameters = Type.Object({
	query: Type.String(),
});

export const search: AgentTool<typeof searchParameters> = {
	name: "search",
	label: "Search",
	description:
		"Search everything stored on the server. Matches every word in the query against memory keys and values. Use this to recall information the user asked you to remember.",
	parameters: searchParameters,
	execute: async (_toolCallId, { query }) => {
		const response = await fetch(`/api/memories?q=${encodeURIComponent(query)}`);
		if (!response.ok) throw new Error(`Search failed (${response.status}).`);
		const matches = (await response.json()) as Memory[];
		const text =
			matches.length === 0
				? "No memories match that search."
				: matches.map((memory) => `${memory.key}: ${memory.value}`).join("\n");
		return {
			content: [{ type: "text", text }],
			details: undefined,
		};
	},
};
