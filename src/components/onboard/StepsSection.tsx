import React from 'react';
import styled, { keyframes } from 'styled-components';
import { useTranslation } from 'react-i18next';
import palette from '@/core/theme/palette';
import step1Png from '@/assets/articles/step1.png';
import step2Png from '@/assets/articles/step2.png';
import step3Png from '@/assets/articles/step3.png';
import step4Png from '@/assets/articles/step4.png';
import step5Png from '@/assets/articles/step5.png';
import step6Png from '@/assets/articles/step6.png';

// ─── Animations ──────────────────────────────────────────────────────────────

const fadeUp = keyframes`
	from { opacity: 0; transform: translateY(24px); }
	to   { opacity: 1; transform: translateY(0); }
`;

// ─── Wrapper ─────────────────────────────────────────────────────────────────

const SectionWrapper = styled.section`
	width: 100%;
	max-width: 760px;
	display: flex;
	flex-direction: column;
	gap: 0;
`;

const SectionHeading = styled.h2`
	font-family: ${palette.typography.fontFamily.inter};
	font-size: clamp(1.25rem, 3vw, 1.75rem);
	font-weight: ${palette.typography.fontWeight.bold};
	color: ${palette.colors.gray[100]};
	margin: 0 0 2.5rem;
	letter-spacing: -0.03em;
`;

// ─── Step Card ───────────────────────────────────────────────────────────────

const Step = styled.article<{ $index: number }>`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding: 2rem 0;
	border-top: 1px solid ${palette.colors.gray[800]};
	animation: ${fadeUp} 0.6s ease both;
	animation-delay: ${({ $index }) => $index * 0.08}s;

	&:last-child {
		border-bottom: 1px solid ${palette.colors.gray[800]};
	}
`;

const StepHeader = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 1.125rem;
`;

const StepNumber = styled.div`
	flex-shrink: 0;
	width: 40px;
	height: 40px;
	border-radius: 50%;
	background: ${palette.colors.brand[500]};
	box-shadow: 0 4px 16px ${palette.colors.brand[500]}40;
	display: flex;
	align-items: center;
	justify-content: center;
	font-family: ${palette.typography.fontFamily.inter};
	font-weight: ${palette.typography.fontWeight.bold};
	font-size: 1rem;
	color: #fff;
`;

const StepTitle = styled.h3`
	font-family: ${palette.typography.fontFamily.inter};
	font-size: 1.25rem;
	font-weight: ${palette.typography.fontWeight.semibold};
	color: ${palette.colors.gray[100]};
	margin: 0;
	padding-top: 6px;
	letter-spacing: -0.02em;
`;

const StepBody = styled.p`
	font-size: 1rem;
	line-height: 1.72;
	color: ${palette.colors.gray[400]};
	margin: 0;
`;

const Callout = styled.blockquote`
	background: ${palette.colors.gray[800]};
	border-left: 3px solid ${palette.colors.brand[500]};
	border-radius: 0 ${palette.borderRadius.small} ${palette.borderRadius.small} 0;
	padding: 1rem 1.25rem;
	margin: 0;
	font-size: 0.9375rem;
	line-height: 1.65;
	color: ${palette.colors.gray[400]};

	strong {
		color: ${palette.colors.gray[200]};
	}
`;

// ─── Phone Frame ─────────────────────────────────────────────────────────────

const PhoneFrame = styled.div`
	width: 260px;
	flex-shrink: 0;
	background: #000;
	border-radius: 36px;
	padding: 10px;
	box-shadow:
		0 2px 4px rgba(0, 0, 0, 0.3),
		0 8px 24px rgba(0, 0, 0, 0.4),
		0 28px 56px rgba(0, 0, 0, 0.3),
		0 0 0 1px rgba(255, 255, 255, 0.06);
	position: relative;
	align-self: flex-start;

	&::before {
		content: '';
		position: absolute;
		top: 10px;
		left: 50%;
		transform: translateX(-50%);
		width: 80px;
		height: 22px;
		background: #000;
		border-radius: 0 0 14px 14px;
		z-index: 2;
	}

	@media (max-width: 720px) {
		width: 100%;
		max-width: 300px;
		align-self: center;
	}
`;

const PhoneScreen = styled.img`
	width: 100%;
	display: block;
	border-radius: 26px;
	aspect-ratio: 9 / 19.5;
	object-fit: cover;
	background: ${palette.colors.gray[900]};
`;

const StepContentRow = styled.div`
	display: flex;
	gap: 2rem;
	align-items: flex-start;

	@media (max-width: 720px) {
		flex-direction: column;
	}
`;

const StepText = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

// ─── Component ───────────────────────────────────────────────────────────────

const STEPS = [
	{ key: 'step1', img: step1Png },
	{ key: 'step2', img: step2Png },
	{ key: 'step3', img: step3Png },
	{ key: 'step4', img: step4Png },
	{ key: 'step5', img: step5Png },
	{ key: 'step6', img: step6Png },
] as const;

const StepsSection: React.FC = () => {
	const { t } = useTranslation();

	return (
		<SectionWrapper aria-labelledby="steps-heading">
			<SectionHeading id="steps-heading">{t('getStarted.steps.heading')}</SectionHeading>

			{STEPS.map(({ key, img }, i) => {
				const calloutStrong = t(`getStarted.steps.${key}.calloutStrong`);
				const callout = t(`getStarted.steps.${key}.callout`);
				return (
					<Step key={key} $index={i}>
						<StepHeader>
							<StepNumber aria-hidden="true">{i + 1}</StepNumber>
							<StepTitle>{t(`getStarted.steps.${key}.title`)}</StepTitle>
						</StepHeader>
						<StepContentRow>
							<PhoneFrame>
								<PhoneScreen
									src={img}
									alt={t(`getStarted.steps.${key}.title`)}
									loading="lazy"
								/>
							</PhoneFrame>
							<StepText>
								<StepBody>{t(`getStarted.steps.${key}.body`)}</StepBody>
								{callout && (
									<Callout>
										{calloutStrong && <strong>{calloutStrong}</strong>}
										{calloutStrong ? ' ' : ''}
										{callout}
									</Callout>
								)}
							</StepText>
						</StepContentRow>
					</Step>
				);
			})}
		</SectionWrapper>
	);
};

export default StepsSection;
