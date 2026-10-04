import type { AgentTool } from '@earendil-works/pi-agent-core';
import { Type } from 'typebox';
import type { Memory } from './memory';
import { api } from './memex';
import type { Page } from './page';
import type { Question } from './question';
import type { Kind, ListItem } from './server/storage';

const jsonHeaders: HeadersInit = { 'content-type': 'application/json' };

function line(kind: Kind, item: { id: string; updatedAt: string; text: string }): string {
	return `- ${item.updatedAt.slice(0, 10)} [${kind}] ${item.id}: ${item.text}`;
}

const rememberParameters = Type.Object({
	text: Type.String({
		description: 'One self-contained fact in plain prose, e.g. "Prefers loose-leaf tea."'
	})
});

export const remember: AgentTool<typeof rememberParameters> = {
	name: 'remember',
	label: 'Remember',
	description:
		'Store a fact as a new memory. Call it whenever the intent to persist is clear — don\'t wait for the word "remember".',
	parameters: rememberParameters,
	execute: async (_toolCallId, { text }) => {
		const response = await fetch(api('remember'), {
			method: 'POST',
			headers: jsonHeaders,
			body: JSON.stringify({ text })
		});
		if (!response.ok) throw new Error(`Failed to remember (${response.status}).`);
		const memory = (await response.json()) as Memory;
		return {
			content: [{ type: 'text', text: `Remembered ${memory.id}.` }],
			details: undefined
		};
	}
};

const wonderParameters = Type.Object({
	text: Type.String({ description: 'The open question, self-contained.' })
});

export const wonder: AgentTool<typeof wonderParameters> = {
	name: 'wonder',
	label: 'Wonder',
	description: 'Record an open question: something you want to know but do not.',
	parameters: wonderParameters,
	execute: async (_toolCallId, { text }) => {
		const response = await fetch(api('wonder'), {
			method: 'POST',
			headers: jsonHeaders,
			body: JSON.stringify({ text })
		});
		if (!response.ok) throw new Error(`Failed to record question (${response.status}).`);
		const question = (await response.json()) as Question;
		return {
			content: [{ type: 'text', text: `Recorded question ${question.id}.` }],
			details: undefined
		};
	}
};

const answerParameters = Type.Object({
	question: Type.String({
		description: 'Id of the question this answers, from search or list results.'
	}),
	text: Type.String({ description: 'One self-contained fact in plain prose.' })
});

export const answer: AgentTool<typeof answerParameters> = {
	name: 'answer',
	label: 'Answer',
	description: 'Store a fact that settles a recorded open question, linking the memory to it.',
	parameters: answerParameters,
	execute: async (_toolCallId, { question, text }) => {
		const response = await fetch(api('answer'), {
			method: 'POST',
			headers: jsonHeaders,
			body: JSON.stringify({ question, text })
		});
		if (!response.ok)
			throw new Error(`Failed to answer question ${question} (${response.status}).`);
		const memory = (await response.json()) as Memory;
		return {
			content: [{ type: 'text', text: `Answered question ${question}: remembered ${memory.id}.` }],
			details: undefined
		};
	}
};

const reviseParameters = Type.Object({
	id: Type.String({
		description: 'Id of the memory or question to revise, from search or list results.'
	}),
	text: Type.String({
		description: 'The new text in full — the current fact or question.'
	})
});

export const revise: AgentTool<typeof reviseParameters> = {
	name: 'revise',
	label: 'Revise',
	description:
		"Replace a memory's text, or reword a question, keeping its id and any question it answers. To update a fact, prefer this over remembering a near-copy.",
	parameters: reviseParameters,
	execute: async (_toolCallId, { id, text }) => {
		const response = await fetch(api('revise'), {
			method: 'POST',
			headers: jsonHeaders,
			body: JSON.stringify({ id, text })
		});
		if (!response.ok) throw new Error(`Failed to revise ${id} (${response.status}).`);
		return {
			content: [{ type: 'text', text: `Revised ${id}.` }],
			details: undefined
		};
	}
};

const forgetParameters = Type.Object({
	id: Type.String({
		description: 'Id of the memory or question to remove, from search or list results.'
	})
});

export const forget: AgentTool<typeof forgetParameters> = {
	name: 'forget',
	label: 'Forget',
	description:
		'Remove a memory, or dismiss a question, by id. Forgetting an answer reopens its question.',
	parameters: forgetParameters,
	execute: async (_toolCallId, { id }) => {
		const response = await fetch(api('forget'), {
			method: 'POST',
			headers: jsonHeaders,
			body: JSON.stringify({ id })
		});
		if (!response.ok) throw new Error(`Failed to forget ${id} (${response.status}).`);
		return {
			content: [{ type: 'text', text: `Forgot ${id}.` }],
			details: undefined
		};
	}
};

const searchParameters = Type.Object({
	queries: Type.Array(Type.String(), {
		description: 'Each is split into words; an entry containing any word of any query matches.'
	})
});

export const search: AgentTool<typeof searchParameters> = {
	name: 'search',
	label: 'Search',
	description:
		'Return every memory and open question containing any word in any of the queries. Put every angle into one call: distinctive words, key words, synonyms, broader and narrower terms. No hits: reword and search again.',
	parameters: searchParameters,
	execute: async (_toolCallId, { queries }) => {
		const params = new URLSearchParams();
		for (const query of queries) params.append('q', query);
		const response = await fetch(api(`search?${params}`));
		if (!response.ok) throw new Error(`Search failed (${response.status}).`);
		const found = (await response.json()) as { memories: Memory[]; questions: Question[] };
		const lines = [
			...found.memories.map((memory) => line('memory', memory)),
			...found.questions.map((question) => line('question', question))
		];
		return {
			content: [
				{
					type: 'text',
					text: lines.length === 0 ? 'Nothing matches that search.' : lines.join('\n')
				}
			],
			details: undefined
		};
	}
};

const listParameters = Type.Object({
	kind: Type.Optional(
		Type.Union([Type.Literal('memory'), Type.Literal('question')], {
			description: 'Restrict to memories or questions; omit for both.'
		})
	),
	offset: Type.Optional(
		Type.Number({
			description: 'Entries to skip; omit for the first page.'
		})
	)
});

export const list: AgentTool<typeof listParameters> = {
	name: 'list',
	label: 'List',
	description: 'List memories and open questions interleaved, newest first.',
	parameters: listParameters,
	execute: async (_toolCallId, { kind, offset }) => {
		const from = offset ?? 0;
		const params = new URLSearchParams({ offset: String(from) });
		if (kind) params.set('kind', kind);
		const response = await fetch(api(`list?${params}`));
		if (!response.ok) throw new Error(`Failed to list (${response.status}).`);
		const page = (await response.json()) as Page<ListItem>;
		if (page.items.length === 0) {
			return {
				content: [{ type: 'text', text: 'Nothing recorded.' }],
				details: undefined
			};
		}
		const lines = page.items.map((item) => line(item.kind, item)).join('\n');
		const more = page.hasMore
			? `\n\nMore remain. Call list again with offset=${from + page.items.length}${kind ? ` and kind="${kind}"` : ''}.`
			: '';
		return {
			content: [{ type: 'text', text: `${lines}${more}` }],
			details: undefined
		};
	}
};
