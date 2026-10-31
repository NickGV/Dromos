import { StatBadge } from '../atoms/StatBadge';
import { XpBar } from '../atoms/XpBar';
import { useT } from '../i18n';
import type { CharacterCardView } from '../presenters/characterCardView';

/** The character read from `Character.md` (S8): name, title, level, XP and the four stats. */
export function CharacterCard({ view }: { readonly view: CharacterCardView }) {
	const t = useT();
	return (
		<section className="dromos-card dromos-character" aria-label={t('character.aria')}>
			<div className="dromos-character-head">
				<div className="dromos-character-names">
					<h2 className="dromos-character-name">{view.name}</h2>
					{view.title ? <p className="dromos-character-title">{view.title}</p> : null}
				</div>
				<span className="dromos-character-level">{view.levelText}</span>
			</div>
			<XpBar {...view.xp} />
			<div className="dromos-stats">
				{view.stats.map((stat) => (
					<StatBadge key={stat.id} label={stat.label} value={stat.value} />
				))}
			</div>
		</section>
	);
}
