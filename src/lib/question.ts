/** The resolved view of a question entity, not a revision row. */
export interface Question {
	id: string;
	text: string;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
}
