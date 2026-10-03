import type { AgentTool } from "@earendil-works/pi-agent-core";
import { Type } from "typebox";
import type { Memory } from "./memory";
import { memexId } from "./memex";
import type { Page } from "./page";
import type { Question } from "./question";

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
	description: "Save a new memory with the given text.",
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
		"Return every memory containing any word in any of the queries.",
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

const listMemoriesParameters = Type.Object({
	offset: Type.Optional(
		Type.Number({
			description: "Memories to skip; omit for the first page."
		})
	)
});

export const listMemories: AgentTool<typeof listMemoriesParameters> = {
	name: "list-memories",
	label: "List memories",
	description:
		"List memories, most recently updated first, one page at a time.",
	parameters: listMemoriesParameters,
	execute: async (_toolCallId, { offset }) => {
		const from = offset ?? 0;
		const response = await fetch(`/api/memories?offset=${from}`, { headers: headers() });
		if (!response.ok) throw new Error(`Failed to list memories (${response.status}).`);
		const { items, hasMore } = (await response.json()) as Page<Memory>;
		if (items.length === 0) {
			return {
				content: [{ type: "text", text: "No memories." }],
				details: undefined
			};
		}
		const lines = items.map((memory) => `- ${memory.id}: ${memory.text}`).join("\n");
		const more = hasMore
			? `\n\nMore memories remain. Call list-memories again with offset=${from + items.length}.`
			: "";
		return {
			content: [{ type: "text", text: `${lines}${more}` }],
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
	description: "Replace a memory's text by id.",
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
	description: "Delete a memory by id.",
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

const createQuestionParameters = Type.Object({
	text: Type.String()
});

export const createQuestion: AgentTool<typeof createQuestionParameters> = {
	name: "create-question",
	label: "Create question",
	description:
		"Record a question memory cannot answer, for the user to fill in later.",
	parameters: createQuestionParameters,
	execute: async (_toolCallId, { text }) => {
		const response = await fetch("/api/questions", {
			method: "POST",
			headers: headers(true),
			body: JSON.stringify({ text })
		});
		if (!response.ok) throw new Error(`Failed to create question (${response.status}).`);
		const question = (await response.json()) as { id: string };
		return {
			content: [{ type: "text", text: `Created question ${question.id}.` }],
			details: undefined
		};
	}
};

const searchQuestionsParameters = Type.Object({
	queries: Type.Array(Type.String())
});

export const searchQuestions: AgentTool<typeof searchQuestionsParameters> = {
	name: "search-questions",
	label: "Search questions",
	description:
		"Return every recorded question containing any word in any of the queries.",
	parameters: searchQuestionsParameters,
	execute: async (_toolCallId, { queries }) => {
		const params = new URLSearchParams();
		for (const query of queries) params.append("q", query);
		const response = await fetch(`/api/questions?${params}`, { headers: headers() });
		if (!response.ok) throw new Error(`Search failed (${response.status}).`);
		const matches = (await response.json()) as Question[];
		const text =
			matches.length === 0
				? "No questions match that search."
				: matches.map((question) => `- ${question.id}: ${question.text}`).join("\n");
		return {
			content: [{ type: "text", text }],
			details: undefined
		};
	}
};

const listQuestionsParameters = Type.Object({
	offset: Type.Optional(
		Type.Number({
			description: "Questions to skip; omit for the first page."
		})
	)
});

export const listQuestions: AgentTool<typeof listQuestionsParameters> = {
	name: "list-questions",
	label: "List questions",
	description: "List recorded questions, one page at a time.",
	parameters: listQuestionsParameters,
	execute: async (_toolCallId, { offset }) => {
		const from = offset ?? 0;
		const response = await fetch(`/api/questions?offset=${from}`, { headers: headers() });
		if (!response.ok) throw new Error(`Failed to list questions (${response.status}).`);
		const { items, hasMore } = (await response.json()) as Page<{ id: string; text: string }>;
		if (items.length === 0) {
			return {
				content: [{ type: "text", text: "No questions." }],
				details: undefined
			};
		}
		const lines = items.map((question) => `- ${question.id}: ${question.text}`).join("\n");
		const more = hasMore
			? `\n\nMore questions remain. Call list-questions again with offset=${from + items.length}.`
			: "";
		return {
			content: [{ type: "text", text: `${lines}${more}` }],
			details: undefined
		};
	}
};

const updateQuestionParameters = Type.Object({
	id: Type.String(),
	text: Type.String()
});

export const updateQuestion: AgentTool<typeof updateQuestionParameters> = {
	name: "update-question",
	label: "Update question",
	description: "Reword an open question by id.",
	parameters: updateQuestionParameters,
	execute: async (_toolCallId, { id, text }) => {
		const response = await fetch("/api/questions", {
			method: "PATCH",
			headers: headers(true),
			body: JSON.stringify({ id, text })
		});
		if (!response.ok) throw new Error(`Failed to update question ${id} (${response.status}).`);
		return {
			content: [{ type: "text", text: `Updated question ${id}.` }],
			details: undefined
		};
	}
};

const deleteQuestionParameters = Type.Object({
	id: Type.String()
});

export const deleteQuestion: AgentTool<typeof deleteQuestionParameters> = {
	name: "delete-question",
	label: "Delete question",
	description: "Remove a question by id.",
	parameters: deleteQuestionParameters,
	execute: async (_toolCallId, { id }) => {
		const response = await fetch(`/api/questions?id=${encodeURIComponent(id)}`, {
			method: "DELETE",
			headers: headers()
		});
		if (!response.ok) throw new Error(`Failed to delete question ${id} (${response.status}).`);
		return {
			content: [{ type: "text", text: `Deleted question ${id}.` }],
			details: undefined
		};
	}
};
