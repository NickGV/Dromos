#!/usr/bin/env node
// Records the Habitica task lists Dromos reads and writes them, anonymized, as test fixtures (issue #8).
// Run by hand, never in CI: `npm run fixtures:habitica` with HABITICA_USER_ID and HABITICA_API_TOKEN set.
// It prints counts only, never a credential, an id or a task text, and the raw responses stay in memory.
// Needs Node 22.18 or newer, which runs the TypeScript anonymizer directly.

import { mkdir, writeFile } from 'node:fs/promises';
import { countLeaks, createAnonymizer, foreignStrings } from '../test/fixtures/habitica/anonymize.ts';

const BASE_URL = 'https://habitica.com/api/v3';
// Same value as HABITICA_X_CLIENT in src/adapters/habitica/HabiticaClient.ts; a test keeps them equal.
const X_CLIENT = '283a330c-db80-446e-abea-d8260ca7978b-dromos';
const LISTS = ['dailys', 'todos', 'completedTodos'];
const OUTPUT = new URL('../test/fixtures/habitica/recorded/', import.meta.url);

function fail(message) {
	console.error(message);
	process.exit(1);
}

if (process.env.CI) fail('This script records from a real Habitica account, so it never runs in CI.');

const userId = process.env.HABITICA_USER_ID?.trim() ?? '';
const apiToken = process.env.HABITICA_API_TOKEN?.trim() ?? '';
if (!userId || !apiToken) fail('Set HABITICA_USER_ID and HABITICA_API_TOKEN first.');
// Same rule as HabiticaClient: a value a header cannot carry is refused before anything is sent.
if (/[^\x21-\x7e]/.test(userId + apiToken)) fail('The user ID or the token has a character no ID or token has.');

const recorded = [];
for (const list of LISTS) {
	let response;
	try {
		response = await fetch(`${BASE_URL}/tasks/user?type=${list}`, {
			headers: { 'x-api-user': userId, 'x-api-key': apiToken, 'x-client': X_CLIENT },
		});
	} catch {
		// The error is dropped on purpose: it may echo request details.
		fail('Habitica could not be reached.');
	}
	if (response.status === 401) fail('Habitica rejected the credentials (401).');
	if (!response.ok) fail(`Habitica answered ${response.status} for ${list}.`);
	try {
		recorded.push(await response.json());
	} catch {
		// A parse error quotes the start of the body.
		fail(`Habitica sent something that is not JSON for ${list}.`);
	}
}

const anonymizer = createAnonymizer();
let fixtures;
try {
	fixtures = recorded.map((body) => anonymizer.response(body));
} catch {
	fail('Habitica sent a response that is not a task list; nothing was written.');
}
const leaks = countLeaks(recorded, fixtures) + fixtures.reduce((sum, fixture) => sum + foreignStrings(fixture), 0);
if (leaks > 0) fail(`Nothing was written: ${leaks} private strings would have reached the fixtures.`);

await mkdir(OUTPUT, { recursive: true });
for (const [index, list] of LISTS.entries()) {
	await writeFile(new URL(`${list}.json`, OUTPUT), `${JSON.stringify(fixtures[index], null, '\t')}\n`);
}
const counts = fixtures.map((fixture, index) => `${Array.isArray(fixture.data) ? fixture.data.length : 0} ${LISTS[index]}`);
console.log(`Wrote ${counts.join(', ')} to test/fixtures/habitica/recorded/.`);
