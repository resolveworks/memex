import { defineEnvVars } from '@sveltejs/kit/env';
import { building } from '$app/env';

// Runtime configuration, not build input: the container image builds without
// these, and the server rejects a missing one at startup.
function required(name: string, value: string | undefined): string | undefined {
	if (value !== undefined || building) return value;
	throw new Error(`${name} is required`);
}

export const variables = defineEnvVars({
	DEEPSEEK_API_KEY: { schema: (value) => required('DEEPSEEK_API_KEY', value) },
	MAX_USER_MESSAGES: { schema: (value) => required('MAX_USER_MESSAGES', value) },
	MAX_MESSAGE_WORDS: { schema: (value) => required('MAX_MESSAGE_WORDS', value) }
});
