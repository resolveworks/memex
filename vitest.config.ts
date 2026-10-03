import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					setupFiles: ['./src/tests/server.ts']
				}
			},
			{
				extends: './vite.config.ts',
				// Components must resolve Svelte's browser build even though Vitest runs in Node.
				resolve: { conditions: ['browser'] },
				test: {
					name: 'client',
					environment: 'jsdom',
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./src/tests/client.ts']
				}
			}
		]
	}
});
