import React from 'react';
import { useTranslation } from 'react-i18next';
import HeroCtas from './hero_ctas';
import DemoCapacityCheck from './demos/demo_capacity_check';
import {
	DemoSlot,
	Eyebrow,
	Footnote,
	HeroCopy,
	HeroLayout,
	HeroRoot,
	Subtitle,
	Title,
} from './hero_shell';

const VARIANT = 'capacity_check' as const;

const HeroCapacityCheck: React.FC = () => {
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
					<Footnote>{t(`${key}.footnote`)}</Footnote>
				</HeroCopy>
				<DemoSlot data-demo-slot={VARIANT}>
					<DemoCapacityCheck />
				</DemoSlot>
			</HeroLayout>
		</HeroRoot>
	);
};

export default HeroCapacityCheck;
