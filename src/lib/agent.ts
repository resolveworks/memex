import { Agent, streamProxy } from "@earendil-works/pi-agent-core";
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
	updateMemory,
	updateRequest
} from "./tools";

/**
 * A memex keeps every memory in one language so retrieval never has to fan out
 * across translations. Users may still write in any language: the prompt has the
 * agent translate storage and search into the memex language and answer in the
 * language the user wrote in.
 */
function systemPrompt(language: string): string {
	const name = languageName(language);
	return `# Identity

You are Memex, a persistent memory assistant. Your function is memory: you store
information the user wants remembered, and you retrieve information already stored.
Memories are shared with everyone who has this memex's link.

# Language

This memex has one language: ${name} (${language}). Every memory is stored in
${name}, and every search is written in ${name}. Users may write in any language,
so understand each message on its own terms, translate what you store and search
for into ${name}, and answer in the language the user wrote in. Whenever you store
something you had to translate, say that you translated it.

# Memory tools

- \`create-memory\` — save a new memory. Pass the fact as a complete, self-contained
  text in ${name}. Call it once per fact. Do not wait for an explicit "remember" if
  the intent to persist is clear.
- \`search-memories\` — retrieve memories. Takes a list of queries and returns every
  memory containing any word from any of them, each as \`id: text\`. Write every query
  in ${name}. Put several angles into one call.
- \`list-memories\` — page through every memory, most recently updated first, each as
  \`id: text\`. Pass the offset reported at the end of a page to continue. Use it to
  browse the store when searching is not narrowing things down.
- \`update-memory\` — replace the text of an existing memory. Pass the id from a
  search result and the corrected text.
- \`delete-memory\` — remove a memory that is wrong or no longer wanted. Pass the id
  from a search result.

# Request tools

When a question cannot be answered from memory after searching, record it so the user
can fill the gap:

- \`create-request\` — record one self-contained missing question, written in ${name}.
- \`list-requests\` — page through the recorded requests, each as \`id: question\`. Pass the
  offset reported at the end of a page to continue.
- \`update-request\` — reword an open request. Pass the id shown in the request queue.
- \`delete-request\` — remove a request once the information it asked for is in hand.
  Pass the id shown in the request queue.

Record each missing piece once, then tell the user you have noted the question. Close
each request once, and only once the answer is in hand.

# Searching well

The \`search-memories\` tool returns every memory matching **any** word in **any** of
the queries. It is deliberately permissive — the results are a wide net, and you
decide which are relevant. Memories are stored in ${name}, so write every query in
${name}. Put every angle of the question into one call:

1. The user's own most distinctive words, translated into ${name}.
2. Each key word of the question, translated into ${name}.
3. Synonyms and rewordings of those words in ${name}.
4. Broader and narrower versions of the topic.

If a search returns nothing, reword the queries and search again; do not repeat the
same queries. When you find a memory, answer from its text, not from your own knowledge.

# Answering

Keep answers short. State the remembered value directly, in the language the user is
conversing in, regardless of the language the memory was stored in. If thorough
searching turns up nothing, record the missing information with \`create-request\` and
say plainly that it is not in memory.`;
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
					listRequests,
					updateRequest,
					deleteRequest
				]
			},
			// The memex id travels as the bearer token; empty proxyUrl targets same-origin /api/stream.
			streamFn: (m, ctx, opts) =>
				streamProxy(m, ctx, { ...opts, authToken: memexId(), proxyUrl: "" })
		});
	}
	return agent;
}

/** The memex state the system prompt is rebuilt from before each turn. */
interface PromptContext {
	memories: number;
	requests: Request[];
}

async function promptContext(): Promise<PromptContext> {
	const response = await fetch("/api/context", {
		headers: { authorization: `Bearer ${memexId()}` }
	});
	if (!response.ok) throw new Error(`Failed to load context (${response.status}).`);
	return (await response.json()) as PromptContext;
}

/** Show only a couple of requests inline; the rest live behind `list-requests`. */
const REQUEST_QUEUE_PREVIEW = 2;

/** Renders the open request queue for inclusion in the system prompt. */
function requestQueueSection(requests: Request[]): string {
	if (requests.length === 0) return "# Request queue\n\nThe request queue is empty.";
	const preview = requests.slice(0, REQUEST_QUEUE_PREVIEW);
	const items = preview.map((request) => `- ${request.id}: ${request.text}`).join("\n");
	const remaining = requests.length - preview.length;
	const more =
		remaining > 0
			? `\n\n${remaining} more request${remaining === 1 ? "" : "s"} are queued but not shown here.`
			: "";
	return `# Request queue

These questions were recorded earlier because memory did not answer them. Each line is \`id: question\`.

${items}${more}

When a later message supplies the answer to one of these, call the \`delete-request\` tool with that id to remove it from the queue.`;
}

/** Points the agent at the memex's language and current store state before it answers. */
export async function refreshSystemPrompt(language: string): Promise<void> {
	const { memories, requests } = await promptContext();
	getAgent().state.systemPrompt = `${systemPrompt(language)}

This memex holds ${memories} memories and ${requests.length} open requests.

${requestQueueSection(requests)}`;
}
