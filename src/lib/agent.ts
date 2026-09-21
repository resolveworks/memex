import { Agent, streamProxy, type AgentMessage } from "@earendil-works/pi-agent-core";
import type { Message } from "@earendil-works/pi-ai";
import { languageName } from "./i18n.svelte";
import { memexId } from "./memex";
import { model } from "./model";
import type { Request } from "./request";
import {
	createMemory,
	createRequest,
	deleteMemory,
	deleteRequest,
	listMemories,
	listRequests,
	searchMemories,
	searchRequests,
	updateMemory,
	updateRequest
} from "./tools";

/** The opening turn: invisible to the user, a user turn to the model. */
interface GreetingMessage {
	role: "greeting";
	content: [{ type: "text"; text: string }];
	timestamp: number;
}

declare module "@earendil-works/pi-agent-core" {
	interface CustomAgentMessages {
		greeting: GreetingMessage;
	}
}

/** Elicits the model's opening message, paired with the Greeting prompt section. */
export function greetingMessage(): AgentMessage {
	return {
		role: "greeting",
		content: [
			{
				type: "text",
				text: "The user has opened this memex and is waiting for you to greet them."
			}
		],
		timestamp: Date.now()
	};
}

/** The model's view of the transcript: the opening trigger is an ordinary user turn. */
function convertToLlm(messages: AgentMessage[]): Message[] {
	return messages.flatMap((message) => {
		if (message.role === "greeting") {
			return [{ role: "user" as const, content: message.content, timestamp: message.timestamp }];
		}
		return message.role === "user" || message.role === "assistant" || message.role === "toolResult"
			? [message]
			: [];
	});
}

/**
 * A memex keeps every memory in one language so retrieval never has to fan out
 * across translations. The greeting uses the app language because it is sent
 * before the user writes.
 */
function systemPrompt(memexLanguage: string, userLanguage: string, hasRequests: boolean): string {
	const memexLanguageName = languageName(memexLanguage);
	const userLanguageName = languageName(userLanguage);
	const greetingQueue = hasRequests
		? " End by asking the first question in the request queue below."
		: "";
	return `# Identity

You are Memex, a persistent memory assistant. You store what the user wants
remembered and retrieve it later. Memories are shared with everyone who has
this memex's link.

# Greeting

You speak first: the opening trigger asks for your greeting. In one or two
short sentences in ${userLanguageName}, say what this memex is and, from the
topics below, what it holds.${greetingQueue} Call no tools.

# Language

This memex has one language: ${memexLanguageName}. Store, update, and search
in ${memexLanguageName}; answer in the language the user wrote in.

# Behavior

- Save with \`create-memory\` whenever the intent to persist is clear — don't
  wait for "remember". One self-contained fact per call.
- If thorough searching answers nothing, check \`search-requests\` for a
  duplicate, then record the question with \`create-request\` and say plainly
  it isn't in memory.
- Delete a request once the information it asked for is in hand.
- When you ask the user about a recorded request, set its question in bold.

# Searching

Searches match any word in any query — a wide net; you judge relevance. Put
every angle into one call: distinctive words, key words, synonyms, broader and
narrower terms. No hits: reword and search again. Answer from found memories,
not your own knowledge.`;
}

let agent: Agent | undefined;

export function getAgent(): Agent {
	if (!agent) {
		agent = new Agent({
			initialState: {
				model,
				tools: [
					createMemory,
					searchMemories,
					listMemories,
					updateMemory,
					deleteMemory,
					createRequest,
					searchRequests,
					listRequests,
					updateRequest,
					deleteRequest
				]
			},
			convertToLlm,
			// The memex id travels as the bearer token; empty proxyUrl targets same-origin /api/stream.
			streamFn: (m, ctx, opts) =>
				streamProxy(m, ctx, { ...opts, authToken: memexId(), proxyUrl: "" })
		});
	}
	return agent;
}

/** The memex state the system prompt is rebuilt from before each turn. */
interface PromptContext {
	title: string;
	memories: number;
	requests: Request[];
	terms: TermCount[];
}

interface TermCount {
	term: string;
	count: number;
}

async function promptContext(): Promise<PromptContext> {
	const response = await fetch("/api/context", {
		headers: { authorization: `Bearer ${memexId()}` }
	});
	if (!response.ok) throw new Error(`Failed to load context (${response.status}).`);
	return (await response.json()) as PromptContext;
}

/** Renders the store's most common terms for inclusion in the system prompt. */
function termsSection(terms: TermCount[]): string {
	if (terms.length === 0) return "# Topics\n\nThe store is empty.";
	const items = terms.map(({ term, count }) => `- ${term}: ${count}`).join("\n");
	return `# Topics

Most frequent terms in the store, each with its memory count.

${items}`;
}

/** Show only a couple of requests inline; the rest live behind `list-requests`. */
const REQUEST_QUEUE_PREVIEW = 2;

/** Renders the open request queue for inclusion in the system prompt. */
function requestQueueSection(requests: Request[]): string {
	if (requests.length === 0) return "";
	const preview = requests.slice(0, REQUEST_QUEUE_PREVIEW);
	const items = preview.map((request) => `- ${request.id}: ${request.text}`).join("\n");
	const remaining = requests.length - preview.length;
	const more =
		remaining > 0
			? `\n\n${remaining} more request${remaining === 1 ? "" : "s"} are queued but not shown here.`
			: "";
	return `# Request queue

Unanswered questions recorded earlier, as \`id: question\`.

${items}${more}`;
}

/** Points the agent at the memex's language and current store state before it answers. */
export async function refreshSystemPrompt(
	memexLanguage: string,
	userLanguage: string
): Promise<void> {
	const { title, memories, requests, terms } = await promptContext();
	const sections = [
		systemPrompt(memexLanguage, userLanguage, requests.length > 0),
		`This memex is titled "${title}". It holds ${memories} memories and ${requests.length} open requests.`,
		termsSection(terms),
		requestQueueSection(requests)
	];
	getAgent().state.systemPrompt = sections.filter((section) => section !== "").join("\n\n");
}
