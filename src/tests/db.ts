import { DatabaseSync } from 'node:sqlite';
import { drizzle } from 'drizzle-orm/node-sqlite';
import { migrate } from 'drizzle-orm/node-sqlite/migrator';

export const sqlite = new DatabaseSync(':memory:');
export const db = drizzle({ client: sqlite });

migrate(db, { migrationsFolder: 'drizzle' });
