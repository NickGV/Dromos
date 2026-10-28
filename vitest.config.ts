import { defineConfig } from 'vitest/config';

// Domain and application tests only. Nothing under test/ may import 'obsidian':
// the package ships type definitions without a runtime, so such an import is a
// sign that logic leaked out of the domain.
export default defineConfig({
	test: {
		include: ['test/**/*.test.ts'],
		environment: 'node',
	},
});
