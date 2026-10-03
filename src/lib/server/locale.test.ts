import { describe, expect, it, vi } from 'vitest';
import { FakeCookies } from '../../tests/cookies';
import { readLocale, setLocale } from './locale';

describe('the UI locale', () => {
	it('prefers a supported cookie over the accept-language header', () => {
		const request = new Request('http://localhost/', {
			headers: { 'accept-language': 'de,fr' }
		});
		expect(readLocale(new FakeCookies({ locale: 'pt' }), request)).toBe('pt');
	});

	it('falls back to the first supported accept-language tag when the cookie is unsupported', () => {
		const request = new Request('http://localhost/', {
			headers: { 'accept-language': 'zh-CN,pt-BR,en' }
		});
		expect(readLocale(new FakeCookies({ locale: 'klingon' }), request)).toBe('pt');
	});

	it('yields english when no cookie and no header language is supported', () => {
		const request = new Request('http://localhost/', {
			headers: { 'accept-language': 'ja,ru' }
		});
		expect(readLocale(new FakeCookies(), request)).toBe('en');
	});

	it('yields english when no accept-language header is sent', () => {
		expect(readLocale(new FakeCookies(), new Request('http://localhost/'))).toBe('en');
	});

	it('writes a year-long locale cookie at the root path and returns the value', () => {
		const cookies = new FakeCookies();
		const set = vi.spyOn(cookies, 'set');
		expect(setLocale(cookies, 'de')).toBe('de');
		expect(set).toHaveBeenCalledTimes(1);
		expect(set).toHaveBeenCalledWith('locale', 'de', { path: '/', maxAge: 60 * 60 * 24 * 365 });
	});

	it('throws on an unsupported language', () => {
		expect(() => setLocale(new FakeCookies(), 'klingon')).toThrow(
			'Unsupported language "klingon".'
		);
	});

	it('throws on a non-string value', () => {
		expect(() => setLocale(new FakeCookies(), new File(['pt'], 'locale'))).toThrow(
			'Unsupported language "[object File]".'
		);
	});
});
