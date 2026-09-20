import en from "./i18n/en.json";

export type MessageKey = keyof typeof en;

// Every JSON file in i18n/ is a language; the filename is its BCP-47 tag.
const files = import.meta.glob<{ default: Record<string, string> }>("./i18n/*.json", {
	eager: true
});

export const messages: Record<string, Record<string, string>> = Object.fromEntries(
	Object.entries(files).map(([path, module]) => [
		path.slice(path.lastIndexOf("/") + 1, -".json".length),
		module.default
	])
);

export const languages = Object.keys(messages).sort();

const STORAGE_KEY = "memex:locale";

function initialLocale(): string {
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored !== null && languages.includes(stored)) return stored;
	const preferred = navigator.language.split("-")[0];
	if (languages.includes(preferred)) return preferred;
	return "en";
}

export const i18n = $state({ locale: initialLocale() });

export function setLocale(code: string): void {
	i18n.locale = code;
	localStorage.setItem(STORAGE_KEY, code);
}

export function t(key: MessageKey): string {
	const value = messages[i18n.locale][key];
	if (value === undefined) throw new Error(`Missing "${key}" in locale "${i18n.locale}".`);
	return value;
}

/** The language's own name, e.g. "Deutsch", so speakers can find it in the list. */
export function languageName(code: string): string {
	return new Intl.DisplayNames([code], { type: "language" }).of(code) ?? code;
}
