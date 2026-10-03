import { describe, expect, it, vi } from 'vitest';
import { page } from '../tests/app-state';
import { languageName, t } from './i18n';

vi.mock('$app/state', () => ({ page }));

describe('t', () => {
	it('returns the message of the locale the page is rendered in', () => {
		page.data.locale = 'de';
		expect(t('nav.language')).toBe('Sprache');
	});
});

describe('languageName', () => {
	it('gives the language’s own name', () => {
		expect(languageName('de')).toBe('Deutsch');
	});
});
