import type { TitlesReading } from '../../application';
import { plural, type Translator } from '../../i18n';
import { longDate } from './dates';
import { unreadableText } from './shopView';
import type { SyncBannerView } from './syncBanner';

/** One earned title in the card's list (titles S5). */
export interface TitleRowView {
	readonly id: string;
	readonly title: string;
	/** The day it was granted, written out: "2 de junio de 2027". */
	readonly when: string;
	readonly feat: string | null;
	/** Esdras's why in quotes, "«…»"; `null` when the row has none. */
	readonly why: string | null;
	/** "— Esdras", after the why. */
	readonly sign: string;
	/** Today's title, the one the plaque shows: "En tu placa" in place of the button. */
	readonly current: boolean;
	/** The button's name, "Usar este título: Perseverante", so the buttons of the list never sound alike. */
	readonly useLabel: string;
}

/** What `TitlesCard` shows (titles S5, option A "La lista"). */
export interface TitlesCardView {
	/** The dialog's name: "Los títulos de Nicolás". */
	readonly ariaLabel: string;
	/** "Tu título" over today's title; `null` when `Character.md` has none. */
	readonly kicker: string | null;
	/** Today's title, large, or the dialog's name when there is none. */
	readonly title: string;
	/** "Otorgado el 2 de junio de 2027 · 5 títulos otorgados por Esdras", the day only for a granted title. */
	readonly since: string;
	/** After a write that failed: the title stays as it was. */
	readonly error: string | null;
	/** "Los que ganaste", or "El que ganaste" for one. */
	readonly listTitle: string;
	/** Newest grant first, in the order read. */
	readonly rows: readonly TitleRowView[];
	/** "En tu placa". */
	readonly currentText: string;
	/** "Usar este título". */
	readonly useText: string;
	/** With a single title, where titles come from. */
	readonly note: string | null;
	/** The rows of `Titles.md` that could not be read, named as the Shop names its own. */
	readonly unreadable: string | null;
}

/**
 * The titles card (titles S5) from one read of `Titles.md` and the character the plaque shows: today's
 * title, the earned titles newest first, today's one marked by its text, and the notes at the foot. A
 * `title` that is not a granted one is still shown, with no row marked. `failed` adds the line of a
 * write that did not happen.
 */
export function titlesCardView(reading: TitlesReading, character: { readonly name: string; readonly title: string }, today: string, t: Translator, failed = false): TitlesCardView {
	const { titles } = reading;
	const ariaLabel = t('titles.card.aria', { name: character.name });
	const current = titles.findIndex((title) => title.title === character.title);
	const granted = titles[current];
	const count = plural(t, 'titles.count', titles.length);
	return {
		ariaLabel,
		kicker: character.title === '' ? null : t('titles.kicker'),
		title: character.title === '' ? ariaLabel : character.title,
		since: granted ? `${t('titles.granted', { date: longDate(granted.granted, today, t) })} · ${count}` : count,
		error: failed ? (character.title === '' ? t('titles.writeFailed.none') : t('titles.writeFailed', { title: character.title })) : null,
		listTitle: plural(t, 'titles.earned', titles.length),
		rows: titles.map((title, index) => ({
			id: title.id,
			title: title.title,
			when: longDate(title.granted, today, t),
			feat: title.feat,
			why: title.why === null ? null : t('titles.why', { why: title.why }),
			sign: t('titles.sign'),
			current: index === current,
			useLabel: t('titles.use.aria', { title: title.title }),
		})),
		currentText: t('titles.current'),
		useText: t('titles.use'),
		note: titles.length === 1 ? t('titles.note') : null,
		unreadable: unreadableText(reading.unreadable, t),
	};
}

/** The plaque's title button's name, "Corredor. Ver los títulos": it starts with the text it shows. */
export function titleButtonLabel(title: string, t: Translator): string {
	return t('titles.open', { title });
}

/** What the live region says when a title arrives while the view is open: "Esdras te otorgó un título: Perseverante." */
export function titleArrival(title: string, t: Translator): string {
	return `${t('titles.news')} ${title}.`;
}

/** The sync line's banner with a title's arrival added to what its live region announces; as it was without one. */
export function withTitleArrival(banner: SyncBannerView, arrival: string | null): SyncBannerView {
	if (arrival === null) return banner;
	const said = /[.!?…]$/.test(banner.announcement) ? banner.announcement : `${banner.announcement}.`;
	return { ...banner, announcement: `${said} ${arrival}` };
}
