import type { AgentMessage } from "@earendil-works/pi-agent-core";

const KEY = "memex:sessions";

export interface Session {
	id: string;
	title: string;
	updatedAt: number;
	messages: AgentMessage[];
}

function read(): Session[] {
	const raw = localStorage.getItem(KEY);
	if (raw === null) return [];
	return JSON.parse(raw) as Session[];
}

function write(sessions: Session[]): void {
	localStorage.setItem(KEY, JSON.stringify(sessions));
}

// Raw state: transcripts are large and always replaced wholesale.
let list = $state.raw<Session[]>(read());

export function getSessions(): Session[] {
	return list;
}

export function createSession(title: string): Session {
	const session: Session = {
		id: crypto.randomUUID(),
		title,
		updatedAt: Date.now(),
		messages: [],
	};
	list = [session, ...list];
	write(list);
	return session;
}

export function getSession(id: string): Session {
	const session = list.find((candidate) => candidate.id === id);
	if (!session) throw new Error(`No session "${id}".`);
	return session;
}

export function saveSession(id: string, messages: AgentMessage[]): void {
	const session = getSession(id);
	const next: Session = { ...session, messages: messages.slice(), updatedAt: Date.now() };
	list = list.map((candidate) => (candidate.id === id ? next : candidate));
	write(list);
}

export function deleteSession(id: string): void {
	list = list.filter((candidate) => candidate.id !== id);
	write(list);
}
