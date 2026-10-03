import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { languages, messages, stopwords } from './languages';

/** Each locale data file as `[tag, contents]`, the tag taken from its filename. */
const files = readdirSync(new URL('./i18n', import.meta.url))
	.filter((name) => name.endsWith('.json'))
	.map((name) => {
		const tag = name.slice(0, -'.json'.length);
		const contents = JSON.parse(readFileSync(new URL(`./i18n/${name}`, import.meta.url), 'utf8'));
		return [tag, contents] as const;
	});

describe('locale data files', () => {
	it('carry both messages and stopwords', () => {
		for (const [tag, contents] of files) {
			expect(contents, tag).toHaveProperty('messages');
			expect(contents, tag).toHaveProperty('stopwords');
		}
	});
});

describe('languages', () => {
	it('is the sorted list of the i18n filenames as language tags', () => {
		expect(languages).toEqual(files.map(([tag]) => tag).sort());
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
