import type { ReactNode } from 'react';
import { Landscape } from '../atoms/Landscape';
import { StatBadge } from '../atoms/StatBadge';
import { XpBar } from '../atoms/XpBar';
import { useT } from '../i18n';
import type { CharacterCardView } from '../presenters/characterCardView';

/**
 * The character read from `Character.md` (S8): the landscape, then name, title, level, XP and
 * the stats, with a level-up ribbon under the name when there is one and the sync line at its foot.
 */
export function CharacterCard({ view, ribbon, footer }: { readonly view: CharacterCardView; readonly ribbon: ReactNode; readonly footer: ReactNode }) {
	const t = useT();
	return (
		<section className="dromos-card dromos-character" aria-label={t('character.aria')}>
			<Landscape />
			<div className="dromos-character-head">
				<div className="dromos-character-names">
					<h2 className="dromos-character-name">{view.name}</h2>
					{view.title ? <p className="dromos-character-title">{view.title}</p> : null}
				</div>
				<span className="dromos-character-level">{view.levelText}</span>
			</div>
			{ribbon}
			<XpBar {...view.xp} />
			<div className="dromos-stats">
				{view.stats.map((stat) => (
					<StatBadge key={stat.id} label={stat.label} value={stat.value} />
				))}
			</div>
			{footer}
		</section>
	);
}
