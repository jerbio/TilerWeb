import React from 'react';
import styled from 'styled-components';
import palette from '@/core/theme/palette';
import { useTranslation } from 'react-i18next';

const ExplainerWrapper = styled.div`
	text-align: center;
	padding: 2rem 1rem 1rem;
	max-width: 800px;
	margin: 0 auto;
`;

const Badge = styled.span`
	display: inline-block;
	padding: 0.375rem 0.875rem;
	background: linear-gradient(135deg, ${palette.colors.brand[500]}20, ${palette.colors.brand[600]}30);
	border: 1px solid ${palette.colors.brand[500]}40;
	border-radius: 9999px;
	color: ${palette.colors.brand[300]};
	font-size: ${palette.typography.fontSize.xs};
	font-weight: ${palette.typography.fontWeight.semibold};
	text-transform: uppercase;
	letter-spacing: 0.5px;
	margin-bottom: 1rem;
`;

const Title = styled.h2`
	font-size: ${palette.typography.fontSize.displayLg};
	font-weight: ${palette.typography.fontWeight.bold};
	color: ${palette.colors.white};
	margin: 0 0 0.75rem 0;
	font-family: ${palette.typography.fontFamily.urban};
	line-height: 1.2;

	@media (max-width: ${palette.screens.sm}) {
		font-size: ${palette.typography.fontSize.displaySm};
	}
`;

const Subtitle = styled.p`
	font-size: ${palette.typography.fontSize.lg};
	color: ${palette.colors.gray[400]};
	margin: 0;
	line-height: 1.6;
	font-family: ${palette.typography.fontFamily.inter};

	@media (max-width: ${palette.screens.sm}) {
		font-size: ${palette.typography.fontSize.base};
	}
`;

const DemoExplainerSection: React.FC = () => {
	const { t } = useTranslation();

	return (
		<ExplainerWrapper>
			<Badge>{t('home.demoExplainer.badge')}</Badge>
			<Title>{t('home.demoExplainer.title')}</Title>
			<Subtitle>{t('home.demoExplainer.subtitle')}</Subtitle>
		</ExplainerWrapper>
	);
};

export default DemoExplainerSection;
