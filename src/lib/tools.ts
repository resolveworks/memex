import type { AgentTool } from "@earendil-works/pi-agent-core";
import { Type } from "typebox";
import type { Memory } from "./memory";
import { memexId } from "./memex";

function headers(json = false): HeadersInit {
	return {
		authorization: `Bearer ${memexId()}`,
		...(json ? { "content-type": "application/json" } : {})
	};
}

const createMemoryParameters = Type.Object({
	text: Type.String()
});

export const createMemory: AgentTool<typeof createMemoryParameters> = {
	name: "create-memory",
	label: "Create memory",
	description:
		"Save a new piece of information as a memory. Use this whenever the user asks you to remember something.",
	parameters: createMemoryParameters,
	execute: async (_toolCallId, { text }) => {
		const response = await fetch("/api/memories", {
			method: "POST",
			headers: headers(true),
			body: JSON.stringify({ text })
		});
		if (!response.ok) throw new Error(`Failed to create memory (${response.status}).`);
		const memory = (await response.json()) as Memory;
		return {
			content: [{ type: "text", text: `Created memory ${memory.id}.` }],
			details: undefined
		};
	}
};

const searchMemoriesParameters = Type.Object({
	queries: Type.Array(Type.String())
});

export const searchMemories: AgentTool<typeof searchMemoriesParameters> = {
	name: "search-memories",
	label: "Search memories",
	description:
		"Search the stored memories. Takes a list of queries and returns every memory matching any word in any of them, each prefixed with its id. Use this to recall information the user asked you to remember.",
	parameters: searchMemoriesParameters,
	execute: async (_toolCallId, { queries }) => {
		const params = new URLSearchParams();
		for (const query of queries) params.append("q", query);
		const response = await fetch(`/api/memories?${params}`, { headers: headers() });
		if (!response.ok) throw new Error(`Search failed (${response.status}).`);
		const matches = (await response.json()) as Memory[];
		const text =
			matches.length === 0
				? "No memories match that search."
				: matches.map((memory) => `- ${memory.id}: ${memory.text}`).join("\n");
		return {
			content: [{ type: "text", text }],
			details: undefined
		};
	}
};

const updateMemoryParameters = Type.Object({
	id: Type.String(),
	text: Type.String()
});

export const updateMemory: AgentTool<typeof updateMemoryParameters> = {
	name: "update-memory",
	label: "Update memory",
	description:
		"Replace the text of an existing memory. Pass the id returned by a search and the corrected text.",
	parameters: updateMemoryParameters,
	execute: async (_toolCallId, { id, text }) => {
		const response = await fetch("/api/memories", {
			method: "PATCH",
			headers: headers(true),
			body: JSON.stringify({ id, text })
		});
		if (!response.ok) throw new Error(`Failed to update memory ${id} (${response.status}).`);
		return {
			content: [{ type: "text", text: `Updated memory ${id}.` }],
			details: undefined
		};
	}
};

const deleteMemoryParameters = Type.Object({
	id: Type.String()
});

export const deleteMemory: AgentTool<typeof deleteMemoryParameters> = {
	name: "delete-memory",
	label: "Delete memory",
	description:
		"Remove a memory that is wrong or no longer wanted. Pass the id returned by a search.",
	parameters: deleteMemoryParameters,
	execute: async (_toolCallId, { id }) => {
		const response = await fetch(`/api/memories?id=${encodeURIComponent(id)}`, {
			method: "DELETE",
			headers: headers()
		});
		if (!response.ok) throw new Error(`Failed to delete memory ${id} (${response.status}).`);
		return {
			content: [{ type: "text", text: `Deleted memory ${id}.` }],
			details: undefined
		};
	}
};

const createRequestParameters = Type.Object({
	text: Type.String()
});

export const createRequest: AgentTool<typeof createRequestParameters> = {
	name: "create-request",
	label: "Create request",
	description:
		"Record a question you could not answer from memory so the user can supply the missing information later. Use this after thorough searching turns up nothing.",
	parameters: createRequestParameters,
	execute: async (_toolCallId, { text }) => {
		const response = await fetch("/api/requests", {
			method: "POST",
			headers: headers(true),
			body: JSON.stringify({ text })
		});
		if (!response.ok) throw new Error(`Failed to create request (${response.status}).`);
		const request = (await response.json()) as { id: string };
		return {
			content: [{ type: "text", text: `Created request ${request.id}.` }],
			details: undefined
		};
	}
};

const updateRequestParameters = Type.Object({
	id: Type.String(),
	text: Type.String()
});

export const updateRequest: AgentTool<typeof updateRequestParameters> = {
	name: "update-request",
	label: "Update request",
	description:
		"Replace the wording of an open request. Pass the id shown for that request in the request queue.",
	parameters: updateRequestParameters,
	execute: async (_toolCallId, { id, text }) => {
		const response = await fetch("/api/requests", {
			method: "PATCH",
			headers: headers(true),
			body: JSON.stringify({ id, text })
		});
		if (!response.ok) throw new Error(`Failed to update request ${id} (${response.status}).`);
		return {
			content: [{ type: "text", text: `Updated request ${id}.` }],
			details: undefined
		};
	}
};

const deleteRequestParameters = Type.Object({
	id: Type.String()
});

export const deleteRequest: AgentTool<typeof deleteRequestParameters> = {
	name: "delete-request",
	label: "Delete request",
	description:
		"Remove a recorded request once the information it asked for has been supplied. Pass the id shown for that request in the request queue.",
	parameters: deleteRequestParameters,
	execute: async (_toolCallId, { id }) => {
		const response = await fetch(`/api/requests?id=${encodeURIComponent(id)}`, {
			method: "DELETE",
			headers: headers()
		});
		if (!response.ok) throw new Error(`Failed to delete request ${id} (${response.status}).`);
		return {
			content: [{ type: "text", text: `Deleted request ${id}.` }],
			details: undefined
		};
	}
};
