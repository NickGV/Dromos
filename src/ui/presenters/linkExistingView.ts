import type { LinkExistingOutcome, OpenTodo } from '../../application';
import type { Translator } from '../../i18n';
import type { LinkOutcomeView } from './linkOutcomeView';

/**
 * The message shown after picking a to-do with "Vincular existente" (link-existing-todo S6). Nothing is
 * sent to Habitica, so no message says that anything was sent or created there.
 */
export function linkExistingOutcomeView(outcome: LinkExistingOutcome, todoTitle: string, t: Translator): LinkOutcomeView {
	switch (outcome.kind) {
		case 'linked':
			return { tone: 'success', message: t('link.existing.linked', { title: todoTitle }) };
		case 'already-linked':
			return { tone: 'neutral', message: t('link.existing.alreadyLinked') };
		case 'taken':
			return { tone: 'warning', message: t('link.existing.taken') };
		case 'not-found':
			return { tone: 'warning', message: t('link.notFound') };
		case 'not-a-project':
			return { tone: 'warning', message: t('link.existing.notAProject') };
		case 'write-failed':
			return { tone: 'error', message: t('link.existing.writeFailed') };
	}
}

/** Why the picker did not open: the sync has listed no to-dos yet (`null`), or every open one is linked already. */
export function noChoicesView(choices: readonly OpenTodo[] | null, t: Translator): LinkOutcomeView {
	return { tone: 'neutral', message: t(choices === null ? 'link.existing.noList' : 'link.existing.none') };
}
