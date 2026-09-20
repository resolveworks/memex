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

/** Renders the open request queue for inclusion in the system prompt. */
export function promptSection(): string {
	const open = list();
	if (open.length === 0) return "# Request queue\n\nThe request queue is empty.";
	const items = open.map((request) => `- ${request.id}: ${request.question}`).join("\n");
	return `# Request queue

These questions were recorded earlier because memory did not answer them. Each line is \`id: question\`.

${items}

When a later message supplies the answer to one of these, call the \`close-request\` tool with that id to remove it from the queue.`;
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
