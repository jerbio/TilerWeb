import React from 'react';
import styled, { keyframes } from 'styled-components';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import palette from '@/core/theme/palette';

// ─── Animations ──────────────────────────────────────────────────────────────

const shimmer = keyframes`
	0%, 100% { opacity: 1; }
	50%       { opacity: 0.85; }
`;

// ─── Banner ──────────────────────────────────────────────────────────────────

const Banner = styled.section`
	width: 100%;
	max-width: 760px;
	background: linear-gradient(135deg, ${palette.colors.brand[600]}, ${palette.colors.brand[800]});
	border-radius: ${palette.borderRadius.large};
	padding: 3.5rem 2rem;
	text-align: center;
	position: relative;
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		inset: 0;
		background: radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.12), transparent 60%);
		pointer-events: none;
	}
`;

const BannerTitle = styled.h2`
	font-family: ${palette.typography.fontFamily.inter};
	font-size: clamp(1.5rem, 4vw, 2rem);
	font-weight: ${palette.typography.fontWeight.extrabold};
	color: #fff;
	margin: 0 0 0.75rem;
	letter-spacing: -0.04em;
	position: relative;
`;

const BannerBody = styled.p`
	font-size: 1.0625rem;
	line-height: 1.65;
	color: rgba(255, 255, 255, 0.88);
	margin: 0 0 1.75rem;
	position: relative;
`;

const CtaButton = styled(Link)`
	display: inline-block;
	background: #fff;
	color: ${palette.colors.brand[600]};
	font-family: ${palette.typography.fontFamily.inter};
	font-weight: ${palette.typography.fontWeight.bold};
	font-size: 1rem;
	padding: 0.875rem 2.25rem;
	border-radius: 9999px;
	text-decoration: none;
	transition:
		transform 0.2s ease,
		box-shadow 0.2s ease;
	position: relative;
	animation: ${shimmer} 3s ease infinite;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 28px rgba(0, 0, 0, 0.25);
	}
`;

const CtaSub = styled.p`
	font-size: 0.8125rem;
	color: rgba(255, 255, 255, 0.6);
	margin: 1rem 0 0;
	position: relative;
`;

// ─── Component ───────────────────────────────────────────────────────────────

const CtaBanner: React.FC = () => {
	const { t } = useTranslation();

	return (
		<Banner aria-labelledby="cta-heading">
			<BannerTitle id="cta-heading">{t('getStarted.cta.heading')}</BannerTitle>
			<BannerBody>{t('getStarted.cta.body')}</BannerBody>
			<CtaButton to="/signup">{t('getStarted.cta.button')}</CtaButton>
			<CtaSub>{t('getStarted.cta.sub')}</CtaSub>
		</Banner>
	);
};

export default CtaBanner;
