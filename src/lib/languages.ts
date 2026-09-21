import en from "./i18n/en.json";

export type MessageKey = keyof typeof en.messages;

/** One language file: the UI messages plus the stopwords filtered from term statistics. */
interface Language {
	messages: Record<string, string>;
	stopwords: string[];
}

// Every JSON file in i18n/ is a language; the filename is its BCP-47 tag.
const files = import.meta.glob<{ default: Language }>("./i18n/*.json", {
	eager: true
});

function tag(path: string): string {
	return path.slice(path.lastIndexOf("/") + 1, -".json".length);
}

const entries = Object.entries(files).map(([path, module]) => {
	const code = tag(path);
	const { messages, stopwords } = module.default;
	if (!messages || !stopwords) {
		throw new Error(`Language file "${code}.json" needs both messages and stopwords.`);
	}
	return [code, { messages, stopwords }] as const;
});

export const messages: Record<string, Record<string, string>> = Object.fromEntries(
	entries.map(([code, language]) => [code, language.messages])
);

export const stopwords: Record<string, ReadonlySet<string>> = Object.fromEntries(
	entries.map(([code, language]) => [code, new Set(language.stopwords)])
);

export const languages = Object.keys(messages).sort();
