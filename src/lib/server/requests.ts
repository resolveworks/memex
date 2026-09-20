import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { Request } from "$lib/request";

const FILE = resolve("data/requests.json");

function load(): Request[] {
	if (!existsSync(FILE)) return [];
	return JSON.parse(readFileSync(FILE, "utf8")) as Request[];
}

const requests = load();

function persist() {
	mkdirSync(dirname(FILE), { recursive: true });
	writeFileSync(FILE, JSON.stringify(requests, null, 2));
}

export function list(): Request[] {
	return [...requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function add(question: string): Request {
	const request: Request = { id: randomUUID(), question, createdAt: new Date().toISOString() };
	requests.push(request);
	persist();
	return request;
}

export function remove(id: string): void {
	const index = requests.findIndex((request) => request.id === id);
	if (index === -1) throw new Error(`No request with id "${id}".`);
	requests.splice(index, 1);
	persist();
}
