import obsidianmd from 'eslint-plugin-obsidianmd';
import globals from 'globals';
import { globalIgnores, defineConfig } from 'eslint/config';

export default defineConfig(
	globalIgnores([
		'node_modules',
		'dist',
		'esbuild.config.mjs',
		'version-bump.mjs',
		'versions.json',
		'main.js',
		'vitest.config.ts',
		'scripts',
		'docs',
		'package.json',
		'package-lock.json',
		'tsconfig.json',
	]),
	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
			parserOptions: {
				projectService: {
					allowDefaultProject: ['eslint.config.mts', 'manifest.json'],
				},
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: ['.json'],
			},
		},
	},
	...obsidianmd.configs.recommended,
	{
		rules: {
			// The plugin's own regex-lookbehind rule misses a negative lookbehind like (?<!x), and iOS below 16.4 cannot parse one.
			'no-restricted-syntax': ['error', { selector: 'Literal[regex.pattern=/\\(\\?<[=!]/]', message: 'Lookbehinds are not supported on iOS versions before 16.4.' }],
			// Habitica and Dromos are proper nouns; Character.md is a file name.
			'obsidianmd/ui/sentence-case': ['warn', { brands: ['Habitica', 'Dromos'], ignoreRegex: ['Character\\.md'] }],
		},
	},
);
