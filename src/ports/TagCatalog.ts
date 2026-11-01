/** Where the skill tags live (Habitica in M3). */
export interface TagCatalog {
	/**
	 * Resolves the tag id of each `skill/<id>` tag, in the order of `skillIds`, and creates
	 * the ones that do not exist yet (S14). Rejects only with a `TaskSourceError`.
	 */
	ensureSkillTags(skillIds: readonly string[]): Promise<string[]>;
}
