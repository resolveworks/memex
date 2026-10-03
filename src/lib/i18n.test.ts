import { describe, expect, it, vi } from 'vitest';
import { page } from '../tests/app-state';
import { languageName, t, type MessageKey } from './i18n';

vi.mock('$app/state', () => ({ page }));

describe('t', () => {
	it('returns the message of the locale the page is rendered in', () => {
		page.data.locale = 'de';
		expect(t('nav.language')).toBe('Sprache');
	});

	it('follows the page locale when it changes', () => {
		page.data.locale = 'en';
		expect(t('nav.language')).toBe('Language');
	});

	it('throws on a key missing from the locale', () => {
		page.data.locale = 'de';
		expect(() => t('nav.nonexistent' as MessageKey)).toThrow(
			'Missing "nav.nonexistent" in locale "de".'
		);
	});
});

describe('languageName', () => {
	it('gives the language’s own name', () => {
		expect(languageName('de')).toBe('Deutsch');
	});
});
