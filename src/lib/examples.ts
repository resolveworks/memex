import type { MessageKey } from './languages';

/** One turn of a canned conversation; a tool's args are one display string. */
export type Turn =
	| { kind: 'user'; text: MessageKey }
	| { kind: 'tool'; name: string; args: MessageKey }
	| { kind: 'assistant'; text: MessageKey };

/** An example use on the landing page: its title and the chat it plays out. */
export interface Example {
	key: 'world' | 'place' | 'project';
	title: MessageKey;
	script: Turn[];
}

export const examples: Example[] = [
	{
		key: 'world',
		title: 'landing.example.world.title',
		script: [
			{ kind: 'user', text: 'landing.example.world.user1' },
			{ kind: 'tool', name: 'search', args: 'landing.example.world.search1' },
			{ kind: 'assistant', text: 'landing.example.world.answer1' },
			{ kind: 'user', text: 'landing.example.world.user2' },
			{ kind: 'tool', name: 'search', args: 'landing.example.world.search2' },
			{ kind: 'assistant', text: 'landing.example.world.answer2' }
		]
	},
	{
		key: 'place',
		title: 'landing.example.place.title',
		script: [
			{ kind: 'user', text: 'landing.example.place.user1' },
			{ kind: 'tool', name: 'remember', args: 'landing.example.place.remember1' },
			{ kind: 'assistant', text: 'landing.example.place.answer1' },
			{ kind: 'user', text: 'landing.example.place.user2' },
			{ kind: 'tool', name: 'search', args: 'landing.example.place.search1' },
			{ kind: 'assistant', text: 'landing.example.place.answer2' }
		]
	},
	{
		key: 'project',
		title: 'landing.example.project.title',
		script: [
			{ kind: 'user', text: 'landing.example.project.user1' },
			{ kind: 'tool', name: 'search', args: 'landing.example.project.search1' },
			{ kind: 'assistant', text: 'landing.example.project.answer1' },
			{ kind: 'user', text: 'landing.example.project.user2' },
			{ kind: 'tool', name: 'search', args: 'landing.example.project.search2' },
			{ kind: 'assistant', text: 'landing.example.project.answer2' }
		]
	}
];

export type ExampleKey = Example['key'];
