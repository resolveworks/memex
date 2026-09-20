import { env } from "$env/dynamic/private";

function positiveInteger(name: string): number {
	const raw = env[name];
	if (raw === undefined) throw new Error(`${name} is not set.`);
	const value = Number(raw);
	if (!Number.isInteger(value) || value <= 0) {
		throw new Error(`${name} must be a positive integer, got "${raw}".`);
	}
	return value;
}

// Abuse limits, enforced where the LLM call happens. The client cannot raise them.
export const maxUserMessages = positiveInteger("MAX_USER_MESSAGES");
export const maxMessageWords = positiveInteger("MAX_MESSAGE_WORDS");
