const KEY = "memex:known";

export interface KnownMemex {
	id: string;
	title: string;
}

function read(): KnownMemex[] {
	const raw = localStorage.getItem(KEY);
	if (raw === null) return [];
	return JSON.parse(raw) as KnownMemex[];
}

function write(memexes: KnownMemex[]): void {
	localStorage.setItem(KEY, JSON.stringify(memexes));
}

let list = $state<KnownMemex[]>(read());

export function getMemexes(): KnownMemex[] {
	return list;
}

/** Records a visited memex, most recent first, refreshing its title. */
export function remember(memex: KnownMemex): void {
	list = [memex, ...list.filter((known) => known.id !== memex.id)];
	write(list);
}
