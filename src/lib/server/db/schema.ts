import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const memexes = sqliteTable("memexes", {
	id: text("id").primaryKey(),
	title: text("title").notNull(),
	// The single language all memories are stored in; the UI and conversation may differ.
	language: text("language").notNull(),
	createdAt: text("created_at").notNull()
});

// Append-only revisions. `entity_id` names the logical memory all revisions share;
// the live row with the latest `created_at` is the one that speaks for it.
export const memories = sqliteTable(
	"memories",
	{
		// This revision row's own id.
		id: text("id").primaryKey(),
		entityId: text("entity_id").notNull(),
		memexId: text("memex_id")
			.notNull()
			.references(() => memexes.id, { onDelete: "cascade" }),
		text: text("text").notNull(),
		// Entity id of the question this memory answers.
		answers: text("answers"),
		createdAt: text("created_at").notNull(),
		// Soft delete: null while this revision is live.
		deletedAt: text("deleted_at")
	},
	(t) => [
		index("memories_entity").on(t.entityId, t.createdAt),
		index("memories_memex").on(t.memexId),
		index("memories_answers").on(t.answers)
	]
);

// Same shape as memories, minus `answers`: a question is settled by a memory, not the reverse.
export const questions = sqliteTable(
	"questions",
	{
		id: text("id").primaryKey(),
		entityId: text("entity_id").notNull(),
		memexId: text("memex_id")
			.notNull()
			.references(() => memexes.id, { onDelete: "cascade" }),
		text: text("text").notNull(),
		createdAt: text("created_at").notNull(),
		deletedAt: text("deleted_at")
	},
	(t) => [
		index("questions_entity").on(t.entityId, t.createdAt),
		index("questions_memex").on(t.memexId)
	]
);
