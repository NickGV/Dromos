/** A tag as Habitica names it. */
export interface NamedTag {
	readonly id: string;
	/** As written, untrimmed. */
	readonly name: string;
}

/** Where the tags live (Habitica in M3): the skill tags, and the `kairos` tag the Shop hides (M10 S1). */
export interface TagCatalog {
	/** Every tag of the account. Rejects only with a `TaskSourceError`. */
	listTags(): Promise<NamedTag[]>;

	/**
	 * Resolves the tag id of each `skill/<id>` tag, in the order of `skillIds`, and creates
	 * the ones that do not exist yet (S14). Rejects only with a `TaskSourceError`.
	 */
	ensureSkillTags(skillIds: readonly string[]): Promise<string[]>;
}
