import { vi } from 'vitest';
import type { AssistantMessageEvent } from '@earendil-works/pi-ai';

// The script the mocked LLM replays; vi.hoisted so the vi.mock factory can reach it.
const script = vi.hoisted(() => ({ events: [] as AssistantMessageEvent[] }));

vi.mock('$lib/server/llm', () => ({
	models: {
		streamSimple: async function* () {
			yield* script.events;
		}
	}
}));

/** Scripts the assistant-message events `models.streamSimple` streams back. */
export function fakeLlm(events: AssistantMessageEvent[]): void {
	script.events = events;
}
