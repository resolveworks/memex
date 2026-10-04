/** A revision row as the contents view displays it; the first is the one that speaks. */
export interface Revision {
	seq: number;
	text: string;
	createdAt: string;
	deletedAt: string | null;
}

/** One resolved memory or question with everything the contents view needs. */
export interface ContentsItem {
	id: string;
	kind: 'memory' | 'question';
	text: string;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
	/** Newest first, the speaking revision first. */
	revisions: Revision[];
}
