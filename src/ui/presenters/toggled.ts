/** A copy of `set` with `key` added, or removed when it was there: the open or expanded items of a view. */
export function toggled(set: ReadonlySet<string>, key: string): ReadonlySet<string> {
	const next = new Set(set);
	if (!next.delete(key)) next.add(key);
	return next;
}
