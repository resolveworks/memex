import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const memexes = sqliteTable('memexes', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	// The single language all memories are stored in; the UI and conversation may differ.
	language: text('language').notNull(),
	createdAt: text('created_at').notNull()
});

// Append-only revisions shared by memories and questions. `kind` tells them apart;
// `entity_id` names the logical entity all revisions share, and the live row with
// the latest `created_at` is the one that speaks for it.
export const revisions = sqliteTable(
	'revisions',
	{
		// This revision row's own id.
		id: text('id').primaryKey(),
		entityId: text('entity_id').notNull(),
		memexId: text('memex_id')
			.notNull()
			.references(() => memexes.id, { onDelete: 'cascade' }),
		kind: text('kind', { enum: ['memory', 'question'] }).notNull(),
		text: text('text').notNull(),
		// Entity id of the question this memory answers; null for questions.
		answers: text('answers'),
		createdAt: text('created_at').notNull(),
		// Soft delete: null while this revision is live.
		deletedAt: text('deleted_at')
	},
	(t) => [
		index('revisions_entity').on(t.entityId, t.createdAt),
		index('revisions_memex').on(t.memexId, t.kind),
		index('revisions_answers').on(t.answers)
	]
);
