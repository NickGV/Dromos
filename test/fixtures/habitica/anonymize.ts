/**
 * Turns recorded Habitica API v3 responses into test fixtures (issue #8). The structure and the values
 * Dromos reads stay; every id and every text a person wrote becomes a deterministic fake.
 *
 * Kept as they are: numbers, booleans, `null`, empty strings, `type`, `frequency` and `attribute` from
 * their closed sets, and ISO dates in date fields. Ids, and object keys shaped like ids, become
 * `00000000-0000-4000-8000-NNNNNNNNNNNN`, the same fake for the same id across every response of one
 * recording; any other string becomes `<field> N`. The envelope keeps only `success` and `data`, so
 * notifications, which can carry party messages and names, are dropped.
 *
 * `scripts/record-habitica-fixtures.mjs` runs this file directly with Node, so it imports nothing and
 * uses only syntax Node can strip.
 */

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FAKE_ID = /^00000000-0000-4000-8000-\d{12}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;
const DIGITS = /^\d+$/;

/** Fields whose values come from a closed set that says nothing about the user. */
const KEPT_VALUES = new Map<string, readonly string[]>([
	['type', ['habit', 'daily', 'todo', 'reward']],
	['frequency', ['daily', 'weekly', 'monthly', 'yearly']],
	['attribute', ['str', 'int', 'per', 'con']],
]);

/** Fields whose ISO dates are kept: due dates, completion, creation and reminder times. */
const DATE_FIELDS = new Set(['date', 'dateCompleted', 'createdAt', 'updatedAt', 'startDate', 'nextDue', 'time']);

/** A recorded response reduced to what a fixture keeps. */
export interface HabiticaFixture {
	readonly success: unknown;
	readonly data: unknown;
}

export interface Anonymizer {
	/** The response as a fixture: only `success` and `data`, every id and text replaced. Throws on a body that is not a Habitica response. */
	readonly response: (body: unknown) => HabiticaFixture;
}

/** One anonymizer per recording, so an id gets the same fake in every response. */
export function createAnonymizer(): Anonymizer {
	const ids = new Map<string, string>();
	const texts = new Map<string, string>();
	const counts = new Map<string, number>();

	const fakeId = (id: string): string => {
		const key = id.toLowerCase();
		const known = ids.get(key);
		if (known !== undefined) return known;
		const fake = `00000000-0000-4000-8000-${String(ids.size + 1).padStart(12, '0')}`;
		ids.set(key, fake);
		return fake;
	};

	const fakeText = (field: string, text: string): string => {
		const key = `${field}\n${text}`;
		const known = texts.get(key);
		if (known !== undefined) return known;
		const count = (counts.get(field) ?? 0) + 1;
		counts.set(field, count);
		const fake = `${field} ${count}`;
		texts.set(key, fake);
		return fake;
	};

	const anonymize = (value: unknown, field: string): unknown => {
		if (typeof value === 'string') {
			if (ID.test(value)) return fakeId(value);
			return isKept(field, value) ? value : fakeText(field, value);
		}
		if (Array.isArray(value)) return (value as unknown[]).map((item) => anonymize(item, field));
		if (isObject(value)) {
			return Object.fromEntries(Object.entries(value).map(([key, item]) => [ID.test(key) ? fakeId(key) : key, anonymize(item, childField(field, key))]));
		}
		return value;
	};

	return {
		response: (body) => {
			if (!isObject(body) || !('success' in body) || !('data' in body)) throw new Error('Not a Habitica API response');
			return { success: body.success, data: anonymize(body.data, 'data') };
		},
	};
}

/**
 * How many strings of the recorded responses, other than the ones a fixture keeps, still appear in the
 * fixtures: 0 when the anonymizer did its job. Only a count, so a caller cannot print a private string.
 */
export function countLeaks(recorded: readonly unknown[], fixtures: readonly unknown[]): number {
	const privateStrings = new Set<string>();
	for (const body of recorded) {
		visit(body, '', (field, text, isKey) => {
			if (isKey ? ID.test(text) : !isKept(field, text)) privateStrings.add(text.toLowerCase());
		});
	}
	const written: string[] = [];
	for (const fixture of fixtures) {
		visit(fixture, '', (field, text, isKey) => {
			if (isKey ? ID.test(text) : !isKept(field, text)) written.push(text.toLowerCase());
		});
	}
	let leaks = 0;
	for (const text of privateStrings) {
		if (written.some((value) => value === text || (text.length >= 8 && value.includes(text)))) leaks += 1;
	}
	return leaks;
}

/** How many strings of a fixture are neither kept by the rules above nor a fake: 0 for a clean fixture. */
export function foreignStrings(fixture: unknown): number {
	let foreign = 0;
	visit(fixture, '', (field, text, isKey) => {
		if (isKey) {
			if (ID.test(text) && !FAKE_ID.test(text)) foreign += 1;
		} else if (!FAKE_ID.test(text) && !isKept(field, text) && !isFakeText(field, text)) {
			foreign += 1;
		}
	});
	return foreign;
}

function isKept(field: string, text: string): boolean {
	if (text === '') return true;
	if (KEPT_VALUES.get(field)?.includes(text)) return true;
	return DATE_FIELDS.has(field) && ISO_DATE.test(text);
}

function isFakeText(field: string, text: string): boolean {
	return text.startsWith(`${field} `) && DIGITS.test(text.slice(field.length + 1));
}

// A value under an id-shaped key (a map by user id) takes its map's field, so no id ends up in a fake text.
function childField(field: string, key: string): string {
	return ID.test(key) ? field : key;
}

type StringVisitor = (field: string, text: string, isKey: boolean) => void;

function visit(value: unknown, field: string, onString: StringVisitor): void {
	if (typeof value === 'string') {
		onString(field, value, false);
	} else if (Array.isArray(value)) {
		for (const item of value as unknown[]) visit(item, field, onString);
	} else if (isObject(value)) {
		for (const [key, item] of Object.entries(value)) {
			onString(field, key, true);
			visit(item, childField(field, key), onString);
		}
	}
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
