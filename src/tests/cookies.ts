import type { Cookies } from '@sveltejs/kit';

/** Map-backed `Cookies` double. */
export class FakeCookies implements Cookies {
	readonly #jar = new Map<string, string>();

	constructor(initial: Record<string, string> = {}) {
		for (const [name, value] of Object.entries(initial)) this.#jar.set(name, value);
	}

	get(name: string): string | undefined {
		return this.#jar.get(name);
	}

	getAll(): Array<{ name: string; value: string }> {
		return [...this.#jar].map(([name, value]) => ({ name, value }));
	}

	set(name: string, value: string): void {
		this.#jar.set(name, value);
	}

	delete(name: string): void {
		this.#jar.delete(name);
	}

	serialize(): string {
		throw new Error('FakeCookies.serialize is not implemented');
	}
}
