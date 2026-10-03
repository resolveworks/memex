import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { languages, messages, stopwords } from './languages';

/** The i18n filenames as language tags. */
const tags = readdirSync(new URL('./i18n', import.meta.url))
	.filter((name) => name.endsWith('.json'))
	.map((name) => name.slice(0, -'.json'.length));

describe('languages', () => {
	it('is the sorted list of the i18n filenames as language tags', () => {
		expect(languages).toEqual(tags.sort());
	});
});

describe('messages', () => {
	it('gives every locale exactly en’s message keys', () => {
		const enKeys = Object.keys(messages.en).sort();
		for (const tag of languages) {
			expect(Object.keys(messages[tag]).sort(), tag).toEqual(enKeys);
		}
	});
});

describe('stopwords', () => {
	it('is a non-empty set per locale', () => {
		for (const tag of languages) {
			expect(stopwords[tag].size, tag).toBeGreaterThan(0);
		}
	});
});
