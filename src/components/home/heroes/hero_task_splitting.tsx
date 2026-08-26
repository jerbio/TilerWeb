import React from 'react';
import { useTranslation } from 'react-i18next';
import HeroCtas from './hero_ctas';
import DemoTaskSplitting from './demos/demo_task_splitting';
import {
	DemoSlot,
	Eyebrow,
	HeroCopy,
	HeroLayout,
	HeroRoot,
	Subtitle,
	Title,
	TitleAccent,
} from './hero_shell';

const VARIANT = 'task_splitting' as const;

const HeroTaskSplitting: React.FC = () => {
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
				</HeroCopy>
				<DemoSlot data-demo-slot={VARIANT}>
					<DemoTaskSplitting />
				</DemoSlot>
			</HeroLayout>
		</HeroRoot>
	);
};

export default HeroTaskSplitting;
