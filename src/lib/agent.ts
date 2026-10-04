import { Agent, streamProxy, type AgentMessage } from '@earendil-works/pi-agent-core';
import type { Message } from '@earendil-works/pi-ai';
import { languageName } from './i18n';
import { api } from './memex';
import { model } from './model';
import type { Question } from './question';
import { answer, forget, remember, revise, search, wonder } from './tools';

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
 * Elicits the model's opening message, grounded in the store's contents.
 * Everything turn-specific rides in this first user turn so the system prompt
 * stays static and the whole prefix stays cached. The greeting uses the app
 * language because it is sent before the user writes.
 */
export async function greetingMessage(
	userLanguage: string,
	questionId?: string
): Promise<AgentMessage> {
	const { title, memories, openQuestions, question, terms } = await promptContext(questionId);
	const describe = question
		? `, what it appears to hold from the topic terms above, and what it has left unanswered. End by asking the open question ${question.id}: "${question.text}", set in bold.`
		: ' and, from the topic terms above, what it appears to hold.';
	const sections = [
		`This memex is titled "${title}". Today is ${new Date().toISOString().slice(0, 10)}. It holds ${memories} memories and ${openQuestions} open questions.`,
		termsSection(terms)
	];
	const context = sections.filter((section) => section !== '').join('\n\n');
	return {
		role: 'greeting',
		content: [
			{
				type: 'text',
				text: `${context}\n\nThe user has opened this memex and is waiting for you to greet them. In one or two short sentences in ${languageName(userLanguage)}, say what this memex is${describe} Call no tools.`
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
 * across translations.
 */
function systemPrompt(memexLanguage: string): string {
	const memexLanguageName = languageName(memexLanguage);
	return `# Identity

You are Memex, a persistent memory assistant. You store what the user wants
remembered and retrieve it later.

# Behavior

Across conversations you know some things (memories) and not others (questions).
When the user asks about something the memories do not cover, record that gap
with \`wonder\` before you reply. When the user answers an open question, settle
it with \`answer\`.

The system timestamps and versions everything you store, and links answers to
questions. State each fact as it stands — no dates or edit history unless the
date is the fact, no restated question — and revise when it changes.

# Language

This memex has one language: ${memexLanguageName}. Store, revise, and search
in ${memexLanguageName}; answer in the language of the user's message.

# Answering

Answer from found memories, not your own knowledge.`;
}

let agent: Agent | undefined;

export function getAgent(): Agent {
	if (!agent) {
		agent = new Agent({
			initialState: {
				model,
				tools: [remember, wonder, answer, revise, forget, search]
			},
			convertToLlm,
			// Empty proxyUrl targets same-origin /api/stream, which is memex-agnostic; the
			// client library still requires an authToken.
			streamFn: (m, ctx, opts) => streamProxy(m, ctx, { ...opts, authToken: '', proxyUrl: '' })
		});
	}
	return agent;
}

/** The store state the greeting snapshot is drawn from. */
interface PromptContext {
	title: string;
	memories: number;
	openQuestions: number;
	question: Question | undefined;
	terms: TermCount[];
}

interface TermCount {
	term: string;
	count: number;
}

async function promptContext(questionId: string | undefined): Promise<PromptContext> {
	const query = questionId === undefined ? '' : `?question=${encodeURIComponent(questionId)}`;
	const response = await fetch(api(`context${query}`));
	if (!response.ok) throw new Error(`Failed to load context (${response.status}).`);
	return (await response.json()) as PromptContext;
}

/** Renders the store's most common terms for the greeting snapshot, grouped by count. */
function termsSection(terms: TermCount[]): string {
	if (terms.length === 0) return '# Topics\n\nThe store is empty.';
	const groups = new Map<number, string[]>();
	for (const { term, count } of terms) {
		const group = groups.get(count) ?? [];
		group.push(term);
		groups.set(count, group);
	}
	const items = [...groups].map(([count, group]) => `${count}: ${group.join(' ')}`).join(' ');
	return `# Topics

The most common terms in the store, each count followed by the terms found in that many entries. Use them to judge what it covers.

${items}`;
}

/** Sets the unchanging system prompt; store state travels in the greeting message. */
export function useSystemPrompt(memexLanguage: string): void {
	getAgent().state.systemPrompt = systemPrompt(memexLanguage);
}
