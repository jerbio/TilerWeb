import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import palette from '@/core/theme/palette';

// ─── Layout ──────────────────────────────────────────────────────────────────

const SectionWrapper = styled.section`
	width: 100%;
	max-width: 760px;
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
`;

const SectionHeading = styled.h2`
	font-family: ${palette.typography.fontFamily.inter};
	font-size: clamp(1.25rem, 3vw, 1.75rem);
	font-weight: ${palette.typography.fontWeight.bold};
	color: ${palette.colors.gray[100]};
	margin: 0;
	letter-spacing: -0.03em;
	text-align: center;
`;

const Grid = styled.div`
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 1rem;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`;

// ─── Pillar Card ─────────────────────────────────────────────────────────────

const Card = styled.article`
	background: ${palette.colors.gray[800]};
	border: 1px solid ${palette.colors.gray[700]};
	border-radius: ${palette.borderRadius.medium};
	padding: 1.5rem 1.25rem;
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	gap: 0.75rem;
	transition:
		transform 0.22s ease,
		box-shadow 0.22s ease;

	&:hover {
		transform: translateY(-3px);
		box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
	}
`;

const IconBox = styled.div`
	width: 52px;
	height: 52px;
	border-radius: 14px;
	background: ${palette.colors.brand[500]}18;
	border: 1px solid ${palette.colors.brand[500]}30;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 1.5rem;
`;

const PillarTitle = styled.h3`
	font-family: ${palette.typography.fontFamily.inter};
	font-size: 1rem;
	font-weight: ${palette.typography.fontWeight.semibold};
	color: ${palette.colors.gray[100]};
	margin: 0;
`;

const PillarBody = styled.p`
	font-size: 0.875rem;
	line-height: 1.6;
	color: ${palette.colors.gray[500]};
	margin: 0;
`;

// ─── Component ───────────────────────────────────────────────────────────────

const PILLARS = ['goals', 'appointments', 'location'] as const;

const PillarsSection: React.FC = () => {
	const { t } = useTranslation();

	return (
		<SectionWrapper aria-labelledby="pillars-heading">
			<SectionHeading id="pillars-heading">{t('getStarted.pillars.heading')}</SectionHeading>

			<Grid>
				{PILLARS.map((key) => (
					<Card key={key}>
						<IconBox aria-hidden="true">{t(`getStarted.pillars.${key}.icon`)}</IconBox>
						<PillarTitle>{t(`getStarted.pillars.${key}.title`)}</PillarTitle>
						<PillarBody>{t(`getStarted.pillars.${key}.body`)}</PillarBody>
					</Card>
				))}
			</Grid>
		</SectionWrapper>
	);
};

export default PillarsSection;
