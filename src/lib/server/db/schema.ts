import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const memexes = sqliteTable("memexes", {
	id: text("id").primaryKey(),
	title: text("title").notNull(),
	// The single language all memories are stored in; the UI and conversation may differ.
	language: text("language").notNull(),
	createdAt: text("created_at").notNull()
});

export const memories = sqliteTable("memories", {
	id: text("id").primaryKey(),
	memexId: text("memex_id")
		.notNull()
		.references(() => memexes.id, { onDelete: "cascade" }),
	text: text("text").notNull(),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
	// Soft delete: null while the memory is live, an ISO timestamp once removed.
	deletedAt: text("deleted_at")
});

export const requests = sqliteTable("requests", {
	id: text("id").primaryKey(),
	memexId: text("memex_id")
		.notNull()
		.references(() => memexes.id, { onDelete: "cascade" }),
	text: text("text").notNull(),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
	// Soft delete: null while the request is live, an ISO timestamp once removed.
	deletedAt: text("deleted_at")
});
