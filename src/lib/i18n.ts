import { page } from "$app/state";
import { languages, messages, type MessageKey } from "./languages";

export { languages };
export type { MessageKey };

/** The message in the language the current request is rendered in. */
export function t(key: MessageKey): string {
	const locale = page.data.locale;
	const value = messages[locale][key];
	if (value === undefined) throw new Error(`Missing "${key}" in locale "${locale}".`);
	return value;
}

/** The language's own name, e.g. "Deutsch", so speakers can find it in the list. */
export function languageName(code: string): string {
	return new Intl.DisplayNames([code], { type: "language" }).of(code) ?? code;
}
