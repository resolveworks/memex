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
