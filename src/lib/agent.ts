import { Agent, streamProxy, type AgentMessage } from '@earendil-works/pi-agent-core';
import type { Message } from '@earendil-works/pi-ai';
import { languageName } from './i18n';
import { memexId } from './memex';
import { model } from './model';
import type { Question } from './question';
import { answer, forget, list, remember, revise, search, wonder } from './tools';

/** The opening turn: invisible to the user, a user turn to the model. */
interface GreetingMessage {
	role: 'greeting';
	content: [{ type: 'text'; text: string }];
	timestamp: number;
}

declare module '@earendil-works/pi-agent-core' {
	interface CustomAgentMessages {
		greeting: GreetingMessage;
	}
}

/**
 * Elicits the model's opening message, grounded in the store's contents. The
 * snapshot rides in this first user turn so the system prompt stays static and
 * the whole prefix stays cached for the rest of the conversation.
 */
export async function greetingMessage(): Promise<AgentMessage> {
	const { title, memories, questions, terms } = await promptContext();
	const sections = [
		`This memex is titled "${title}". Today is ${new Date().toISOString().slice(0, 10)}. It holds ${memories} memories and ${questions.length} open questions.`,
		termsSection(terms),
		questionQueueSection(questions)
	];
	const context = sections.filter((section) => section !== '').join('\n\n');
	return {
		role: 'greeting',
		content: [
			{
				type: 'text',
				text: `${context}\n\nThe user has opened this memex and is waiting for you to greet them.`
			}
		],
		timestamp: Date.now()
	};
}

/** The model's view of the transcript: the opening trigger is an ordinary user turn. */
function convertToLlm(messages: AgentMessage[]): Message[] {
	return messages.flatMap((message) => {
		if (message.role === 'greeting') {
			return [{ role: 'user' as const, content: message.content, timestamp: message.timestamp }];
		}
		return message.role === 'user' || message.role === 'assistant' || message.role === 'toolResult'
			? [message]
			: [];
	});
}

/**
 * A memex keeps every memory in one language so retrieval never has to fan out
 * across translations. The greeting uses the app language because it is sent
 * before the user writes.
 */
function systemPrompt(memexLanguage: string, userLanguage: string): string {
	const memexLanguageName = languageName(memexLanguage);
	const userLanguageName = languageName(userLanguage);
	return `# Identity

You are Memex, a persistent memory assistant. You store what the user wants
remembered and retrieve it later.

# Greeting

In one or two short sentences in ${userLanguageName}, say what this memex
holds, drawn from the contents in the opening message. If it lists open
questions, end by asking the first one, set in bold. Call no tools.

# Language

This memex has one language: ${memexLanguageName}. Store, revise, and search
in ${memexLanguageName}; answer in the language the user wrote in.

# Behavior

You know things (memories) and want things (questions). Save with \`remember\`
whenever the intent to persist is clear — don't wait for "remember".

When searching leaves something unanswered, record it with \`wonder\`. When you
learn the answer to a recorded question, settle it with \`answer\`.

# Searching

Put every angle into one \`search\` call: distinctive words, key words,
synonyms, broader and narrower terms. No hits: reword and search again. Answer
from found memories, not your own knowledge.`;
}

let agent: Agent | undefined;

export function getAgent(): Agent {
	if (!agent) {
		agent = new Agent({
			initialState: {
				model,
				tools: [remember, wonder, answer, revise, forget, search, list]
			},
			convertToLlm,
			// The memex id travels as the bearer token; empty proxyUrl targets same-origin /api/stream.
			streamFn: (m, ctx, opts) =>
				streamProxy(m, ctx, { ...opts, authToken: memexId(), proxyUrl: '' })
		});
	}
	return agent;
}

/** The store state the greeting snapshot is drawn from. */
interface PromptContext {
	title: string;
	memories: number;
	questions: Question[];
	terms: TermCount[];
}

interface TermCount {
	term: string;
	count: number;
}

async function promptContext(): Promise<PromptContext> {
	const response = await fetch('/api/context', {
		headers: { authorization: `Bearer ${memexId()}` }
	});
	if (!response.ok) throw new Error(`Failed to load context (${response.status}).`);
	return (await response.json()) as PromptContext;
}

/** Renders the store's most common terms for the greeting snapshot. */
function termsSection(terms: TermCount[]): string {
	if (terms.length === 0) return '# Topics\n\nThe store is empty.';
	const items = terms.map(({ term, count }) => `- ${term}: ${count}`).join('\n');
	return `# Topics

Most frequent terms in the store, each with its memory count.

${items}`;
}

/** Show only a couple of questions inline; the rest live behind the `list` tool. */
const QUESTION_QUEUE_PREVIEW = 2;

/** Renders the open question queue for the greeting snapshot. */
function questionQueueSection(questions: Question[]): string {
	if (questions.length === 0) return '';
	const preview = questions.slice(0, QUESTION_QUEUE_PREVIEW);
	const items = preview.map((question) => `- ${question.id}: ${question.text}`).join('\n');
	const remaining = questions.length - preview.length;
	const more =
		remaining > 0
			? `\n\n${remaining} more question${remaining === 1 ? '' : 's'} are queued but not shown here.`
			: '';
	return `# Question queue

Unanswered questions recorded earlier, as \`id: question\`.

${items}${more}`;
}

/** Sets the unchanging system prompt; store state travels in the greeting message. */
export function useSystemPrompt(memexLanguage: string, userLanguage: string): void {
	getAgent().state.systemPrompt = systemPrompt(memexLanguage, userLanguage);
}
