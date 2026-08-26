import React from 'react';
import { useTranslation } from 'react-i18next';
import HeroCtas from './hero_ctas';
import DemoStopDeciding from './demos/demo_stop_deciding';
import { DemoSlot, Eyebrow, HeroCopy, HeroLayout, HeroRoot, Subtitle, Title } from './hero_shell';

const VARIANT = 'stop_deciding' as const;

const HeroStopDeciding: React.FC = () => {
	const { t } = useTranslation();
	const key = `home.heroExperiment.${VARIANT}`;

	return (
		<HeroRoot data-variant={VARIANT}>
			<HeroLayout>
				<HeroCopy>
					<Eyebrow>{t(`${key}.eyebrow`)}</Eyebrow>
					<Title>{t(`${key}.title`)}</Title>
					<Subtitle>{t(`${key}.subtitle`)}</Subtitle>
					<HeroCtas
						variant={VARIANT}
						primaryLabel={t(`${key}.primaryCta`)}
						secondaryLabel={t(`${key}.secondaryCta`)}
					/>
				</HeroCopy>
				<DemoSlot data-demo-slot={VARIANT}>
					<DemoStopDeciding />
				</DemoSlot>
			</HeroLayout>
		</HeroRoot>
	);
};

export default HeroStopDeciding;
