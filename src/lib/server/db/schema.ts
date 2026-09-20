import { primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const memexes = sqliteTable("memexes", {
	id: text("id").primaryKey(),
	title: text("title").notNull(),
	// The single language all memories are stored in; the UI and conversation may differ.
	language: text("language").notNull(),
	createdAt: text("created_at").notNull()
});

export const memories = sqliteTable(
	"memories",
	{
		memexId: text("memex_id")
			.notNull()
			.references(() => memexes.id, { onDelete: "cascade" }),
		key: text("key").notNull(),
		value: text("value").notNull(),
		updatedAt: text("updated_at").notNull()
	},
	(table) => [primaryKey({ columns: [table.memexId, table.key] })]
);

export const requests = sqliteTable("requests", {
	id: text("id").primaryKey(),
	memexId: text("memex_id")
		.notNull()
		.references(() => memexes.id, { onDelete: "cascade" }),
	question: text("question").notNull(),
	createdAt: text("created_at").notNull()
});
