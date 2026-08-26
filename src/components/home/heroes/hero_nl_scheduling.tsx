import React from 'react';
import { useTranslation } from 'react-i18next';
import HeroCtas from './hero_ctas';
import DemoNlScheduling from './demos/demo_nl_scheduling';
import {
	Eyebrow,
	HeroRoot,
	HeroStack,
	HeroStackCopy,
	Subtitle,
	Title,
	TitleAccent,
} from './hero_shell';

const VARIANT = 'nl_scheduling' as const;

/**
 * Centred rather than split: the proof for this arm is a whole week, which needs
 * the full width to stay readable.
 */
const HeroNlScheduling: React.FC = () => {
	const { t } = useTranslation();
	const key = `home.heroExperiment.${VARIANT}`;

	return (
		<HeroRoot data-variant={VARIANT}>
			<HeroStack>
				<HeroStackCopy>
					<Eyebrow>{t(`${key}.eyebrow`)}</Eyebrow>
					<Title>
						{t(`${key}.titleLead`)}{' '}
						<TitleAccent as="span">{t(`${key}.titleAccent`)}</TitleAccent>
					</Title>
					<Subtitle>{t(`${key}.subtitle`)}</Subtitle>
					<HeroCtas
						variant={VARIANT}
						primaryLabel={t(`${key}.primaryCta`)}
						secondaryLabel={t(`${key}.secondaryCta`)}
					/>
				</HeroStackCopy>
				<DemoNlScheduling />
			</HeroStack>
		</HeroRoot>
	);
};

export default HeroNlScheduling;
