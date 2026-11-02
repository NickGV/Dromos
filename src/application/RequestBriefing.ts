import { BRIEFING_COMMAND } from '../domain';
import type { Clipboard } from '../ports';

export type BriefingRequest = 'copied' | 'failed';

/** Copies the command that makes Esdras write the briefing; running it is up to the user (S6). Never rejects. */
export class RequestBriefing {
	constructor(private readonly clipboard: Clipboard) {}

	async execute(): Promise<BriefingRequest> {
		try {
			await this.clipboard.copy(BRIEFING_COMMAND);
			return 'copied';
		} catch {
			return 'failed';
		}
	}
}
