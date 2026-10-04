import { afterEach, beforeEach, vi } from 'vitest';
import { sqlite } from './db';

// Server tests run against an in-memory database; each test is rolled back so
// tests never observe each other's writes.
vi.mock('#lib/server/db/index.js', async () => {
	const { db } = await import('./db');
	return { db };
});

beforeEach(() => sqlite.exec('BEGIN'));
afterEach(() => sqlite.exec('ROLLBACK'));
