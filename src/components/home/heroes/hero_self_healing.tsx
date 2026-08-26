import React from 'react';
import { useTranslation } from 'react-i18next';
import HeroCtas from './hero_ctas';
import DemoSelfHealing from './demos/demo_self_healing';
import {
	DemoSlot,
	Eyebrow,
	Footnote,
	HeroCopy,
	HeroLayout,
	HeroRoot,
	Subtitle,
	Title,
	TitleAccent,
} from './hero_shell';

const VARIANT = 'self_healing' as const;

const HeroSelfHealing: React.FC = () => {
	const { t } = useTranslation();
	const key = `home.heroExperiment.${VARIANT}`;

	return (
		<HeroRoot data-variant={VARIANT}>
			<HeroLayout>
				<HeroCopy>
					<Eyebrow>{t(`${key}.eyebrow`)}</Eyebrow>
					<Title>
						{t(`${key}.titleLead`)}
						<TitleAccent>{t(`${key}.titleAccent`)}</TitleAccent>
					</Title>
					<Subtitle>{t(`${key}.subtitle`)}</Subtitle>
					<HeroCtas
						variant={VARIANT}
						primaryLabel={t(`${key}.primaryCta`)}
						secondaryLabel={t(`${key}.secondaryCta`)}
					/>
					<Footnote>{t(`${key}.footnote`)}</Footnote>
				</HeroCopy>
				<DemoSlot data-demo-slot={VARIANT}>
					<DemoSelfHealing />
				</DemoSlot>
			</HeroLayout>
		</HeroRoot>
	);
};

export default HeroSelfHealing;
