/** The resolved view of a memory entity, not a revision row. */
export interface Memory {
	id: string;
	text: string;
	createdAt: string;
	updatedAt: string;
	answers: string | null;
	deletedAt: string | null;
}
