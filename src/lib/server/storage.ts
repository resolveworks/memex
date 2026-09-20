import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { Memory } from "$lib/memory";

const FILE = resolve("data/memories.json");

function load(): Memory[] {
	if (!existsSync(FILE)) return [];
	return JSON.parse(readFileSync(FILE, "utf8")) as Memory[];
}

const memories = load();

function persist() {
	mkdirSync(dirname(FILE), { recursive: true });
	writeFileSync(FILE, JSON.stringify(memories, null, 2));
}

export function list(): Memory[] {
	return [...memories].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function put(key: string, value: string): Memory {
	const memory: Memory = { key, value, updatedAt: new Date().toISOString() };
	const index = memories.findIndex((existing) => existing.key === key);
	if (index === -1) memories.push(memory);
	else memories[index] = memory;
	persist();
	return memory;
}

export function remove(key: string): void {
	const index = memories.findIndex((memory) => memory.key === key);
	if (index === -1) throw new Error(`No memory with key "${key}".`);
	memories.splice(index, 1);
	persist();
}

export function search(query: string): Memory[] {
	const terms = query.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
	if (terms.length === 0) return list();
	return list().filter((memory) => {
		const haystack = `${memory.key}\n${memory.value}`.toLowerCase();
		return terms.every((term) => haystack.includes(term));
	});
}
