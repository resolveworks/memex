import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { drizzle } from "drizzle-orm/node-sqlite";
import { migrate } from "drizzle-orm/node-sqlite/migrator";

const file = resolve("data/memex.db");
mkdirSync(dirname(file), { recursive: true });

const client = new DatabaseSync(file);
client.exec("PRAGMA journal_mode = WAL");

export const db = drizzle({ client });

migrate(db, { migrationsFolder: resolve("drizzle") });
