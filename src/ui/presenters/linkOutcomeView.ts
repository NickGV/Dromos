import type { LinkOutcome } from '../../application';
import type { BannerTone } from './syncBanner';

/** The message shown after pressing "Enviar a Habitica". */
export interface LinkOutcomeView {
	readonly tone: BannerTone;
	readonly message: string;
}

export function linkOutcomeView(outcome: LinkOutcome): LinkOutcomeView {
	switch (outcome.kind) {
		case 'linked':
			return { tone: 'success', message: 'Tarea enviada a Habitica.' };
		case 'already-linked':
			return { tone: 'neutral', message: 'Esa tarea ya está en Habitica.' };
		case 'not-found':
			return { tone: 'warning', message: 'No se encontró la tarea en la nota. Sincroniza e inténtalo de nuevo.' };
		case 'not-a-project':
			return { tone: 'warning', message: 'Solo las tareas de proyectos se envían a Habitica.' };
		case 'habitica-failed':
			return failure(outcome.error);
		case 'duplicate':
			return {
				tone: 'warning',
				message: `Esa tarea ya estaba vinculada, así que se creó un to-do duplicado en Habitica. Bórralo allí. Id: ${outcome.habiticaId}`,
			};
		case 'write-failed':
			return {
				tone: 'error',
				message: `La tarea se creó en Habitica pero no se pudo guardar su id en la nota. Id: ${outcome.habiticaId}`,
			};
	}
}

function failure(error: Extract<LinkOutcome, { kind: 'habitica-failed' }>['error']): LinkOutcomeView {
	switch (error) {
		case 'Offline':
			return { tone: 'warning', message: 'Sin conexión: no se pudo enviar la tarea.' };
		case 'Unauthorized':
			return { tone: 'error', message: 'Token inválido: no se pudo enviar la tarea.' };
		case 'RateLimited':
			return { tone: 'warning', message: 'Demasiadas solicitudes a Habitica. Inténtalo en un momento.' };
		case 'Unknown':
			return { tone: 'error', message: 'No se pudo enviar la tarea a Habitica.' };
	}
}
