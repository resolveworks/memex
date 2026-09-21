import type { Cookies } from "@sveltejs/kit";

const COOKIE = "memexes";
const YEAR = 60 * 60 * 24 * 365;
const LIMIT = 20;

/** The ids of memexes this browser has opened, most recent first. */
export function read(cookies: Cookies): string[] {
	const raw = cookies.get(COOKIE);
	return raw ? raw.split(",").filter(Boolean) : [];
}

/** Moves a memex to the front of the list, dropping the oldest past the limit. */
export function remember(cookies: Cookies, id: string): void {
	const current = read(cookies);
	if (current[0] === id) return;
	const next = [id, ...current.filter((known) => known !== id)].slice(0, LIMIT);
	cookies.set(COOKIE, next.join(","), { path: "/", maxAge: YEAR });
}

/** Drops a memex that turned out not to exist. */
export function forget(cookies: Cookies, id: string): void {
	const current = read(cookies);
	const next = current.filter((known) => known !== id);
	if (next.length === current.length) return;
	cookies.set(COOKIE, next.join(","), { path: "/", maxAge: YEAR });
}
