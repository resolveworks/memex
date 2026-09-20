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
	queries: Type.Array(Type.String()),
});

const requestParameters = Type.Object({
	question: Type.String(),
});

export const request: AgentTool<typeof requestParameters> = {
	name: "request",
	label: "Request",
	description:
		"Record a question you could not answer from memory so the user can supply the missing information later. Use this after thorough searching turns up nothing.",
	parameters: requestParameters,
	execute: async (_toolCallId, { question }) => {
		const response = await fetch("/api/requests", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ question }),
		});
		if (!response.ok) throw new Error(`Failed to record request (${response.status}).`);
		return {
			content: [{ type: "text", text: `Requested information: ${question}` }],
			details: undefined,
		};
	},
};

const closeRequestParameters = Type.Object({
	id: Type.String(),
});

export const closeRequest: AgentTool<typeof closeRequestParameters> = {
	name: "close-request",
	label: "Close request",
	description:
		"Remove a recorded request once the information it asked for has been supplied. Pass the id shown for that request in the request queue.",
	parameters: closeRequestParameters,
	execute: async (_toolCallId, { id }) => {
		const response = await fetch(`/api/requests?id=${encodeURIComponent(id)}`, { method: "DELETE" });
		if (!response.ok) throw new Error(`Failed to close request (${response.status}).`);
		return {
			content: [{ type: "text", text: `Closed request ${id}.` }],
			details: undefined,
		};
	},
};

export const search: AgentTool<typeof searchParameters> = {
	name: "search",
	label: "Search",
	description:
		"Search everything stored on the server. Takes a list of queries and returns every memory matching any word in any of them, so put several angles into one call. Use this to recall information the user asked you to remember.",
	parameters: searchParameters,
	execute: async (_toolCallId, { queries }) => {
		const params = new URLSearchParams();
		for (const query of queries) params.append("q", query);
		const response = await fetch(`/api/memories?${params}`);
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
