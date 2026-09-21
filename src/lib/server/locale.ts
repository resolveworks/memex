import type { Cookies } from "@sveltejs/kit";
import { languages } from "$lib/languages";

const COOKIE = "locale";
const YEAR = 60 * 60 * 24 * 365;

/** The chosen UI language, else the best supported `Accept-Language` match, else English. */
export function readLocale(cookies: Cookies, request: Request): string {
	const chosen = cookies.get(COOKIE);
	if (chosen && languages.includes(chosen)) return chosen;
	for (const part of (request.headers.get("accept-language") ?? "").split(",")) {
		const code = part.split(";")[0].trim().split("-")[0];
		if (languages.includes(code)) return code;
	}
	return "en";
}

/** Persists the UI language and returns it so the caller can refresh `event.locals`. */
export function setLocale(cookies: Cookies, value: FormDataEntryValue | null): string {
	if (typeof value !== "string" || !languages.includes(value)) {
		throw new Error(`Unsupported language "${String(value)}".`);
	}
	cookies.set(COOKIE, value, { path: "/", maxAge: YEAR });
	return value;
}
