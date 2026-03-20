import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import palette from '@/core/theme/palette';
import {
	ExpandableWrapper,
	ExpandableSection,
	ExpandableHeader,
	ExpandableTextSide,
	SectionBadge,
	SectionTitle,
	SectionSummary,
	ExpandableHeaderRight,
	Chevron,
	ExpandableBody,
	ExpandableBodyInner,
} from './shared';

// ─── Features Visual (header) ────────────────────────────────────────────────

const FeaturesVisual = styled.div`
	width: 160px;
	height: 120px;
	border-radius: ${palette.borderRadius.medium};
	background: ${palette.colors.gray[800]};
	border: 1px solid ${palette.colors.gray[700]};
	padding: 0.75rem;
	display: flex;
	flex-direction: column;
	justify-content: center;
	gap: 0.5rem;
	flex-shrink: 0;

	@media (max-width: 640px) {
		width: 100%;
		height: auto;
	}
`;

const FeaturesVisualRow = styled.div`
	display: flex;
	gap: 0.5rem;
	justify-content: center;
`;

const FeaturesVisualIcon = styled.div<{ $bg: string }>`
	width: 30px;
	height: 30px;
	border-radius: 7px;
	background: ${({ $bg }) => $bg};
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 14px;
	flex-shrink: 0;
`;

// ─── Features Grid ───────────────────────────────────────────────────────────

const FeaturesGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 0.75rem;
	padding: 1.25rem 0 1rem;

	@media (max-width: 540px) {
		grid-template-columns: 1fr 1fr;
	}
	@media (max-width: 360px) {
		grid-template-columns: 1fr;
	}
`;

const FeatureCard = styled.div`
	background: ${palette.colors.gray[800]};
	border: 1px solid ${palette.colors.gray[700]};
	border-radius: ${palette.borderRadius.large};
	padding: 14px;
	display: flex;
	flex-direction: column;
	gap: 7px;
	transition:
		border-color 0.3s,
		transform 0.3s;

	&:hover {
		border-color: ${palette.colors.brand[500]}40;
		transform: translateY(-2px);
	}
`;

const FeatureIconBox = styled.div<{ $bg: string }>`
	width: 36px;
	height: 36px;
	border-radius: 9px;
	background: ${({ $bg }) => $bg};
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 17px;
	flex-shrink: 0;
`;

const FeatureName = styled.h3`
	font-family: ${palette.typography.fontFamily.inter};
	font-size: 0.875rem;
	font-weight: ${palette.typography.fontWeight.semibold};
	color: ${palette.colors.gray[100]};
	margin: 0;
	line-height: 1.3;
`;

const FeatureDesc = styled.p`
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.xs};
	color: ${palette.colors.gray[400]};
	line-height: 1.55;
	margin: 0;
	flex: 1;
`;

const FeatureBadge = styled.span`
	display: inline-block;
	padding: 3px 8px;
	border-radius: 9999px;
	background: ${palette.colors.gray[700]};
	color: ${palette.colors.gray[500]};
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.xs};
	align-self: flex-start;
	margin-top: 2px;
`;

// ─── Component ───────────────────────────────────────────────────────────────

interface FeatureItem {
	emoji: string;
	iconBg: string;
	nameKey: string;
	descKey: string;
	badgeKey: string;
}

const FEATURE_ITEMS: FeatureItem[] = [
	{
		emoji: '🧩',
		iconBg: '#1A2E3A',
		nameKey: 'adaptiveTiles',
		descKey: 'adaptiveTiles',
		badgeKey: 'adaptiveTiles',
	},
	{
		emoji: '🤖',
		iconBg: '#3D1C2A',
		nameKey: 'aiScheduling',
		descKey: 'aiScheduling',
		badgeKey: 'aiScheduling',
	},
	{
		emoji: '💬',
		iconBg: '#1A2840',
		nameKey: 'chatScheduling',
		descKey: 'chatScheduling',
		badgeKey: 'chatScheduling',
	},
	{
		emoji: '🗣️',
		iconBg: '#4A1A2A',
		nameKey: 'naturalLanguage',
		descKey: 'naturalLanguage',
		badgeKey: 'naturalLanguage',
	},
	{
		emoji: '🚗',
		iconBg: '#1A3320',
		nameKey: 'autoTravel',
		descKey: 'autoTravel',
		badgeKey: 'autoTravel',
	},
	{
		emoji: '📍',
		iconBg: '#1A2E3A',
		nameKey: 'autoLocations',
		descKey: 'autoLocations',
		badgeKey: 'autoLocations',
	},
	{
		emoji: '⏰',
		iconBg: '#2A1A3A',
		nameKey: 'timeRestrictions',
		descKey: 'timeRestrictions',
		badgeKey: 'timeRestrictions',
	},
	{
		emoji: '🔄',
		iconBg: '#3D1C2A',
		nameKey: 'adaptiveRescheduling',
		descKey: 'adaptiveRescheduling',
		badgeKey: 'adaptiveRescheduling',
	},
	{
		emoji: '📅',
		iconBg: '#1A2040',
		nameKey: 'calendarIntegration',
		descKey: 'calendarIntegration',
		badgeKey: 'calendarIntegration',
	},
	{
		emoji: '📱',
		iconBg: '#1A3320',
		nameKey: 'crossPlatform',
		descKey: 'crossPlatform',
		badgeKey: 'crossPlatform',
	},
	{
		emoji: '🎯',
		iconBg: '#1A3A20',
		nameKey: 'habitScheduling',
		descKey: 'habitScheduling',
		badgeKey: 'habitScheduling',
	},
	{
		emoji: '↩️',
		iconBg: '#3D1C2A',
		nameKey: 'deferReschedule',
		descKey: 'deferReschedule',
		badgeKey: 'deferReschedule',
	},
	{
		emoji: '🔔',
		iconBg: '#1A2040',
		nameKey: 'smartNotifications',
		descKey: 'smartNotifications',
		badgeKey: 'smartNotifications',
	},
	{
		emoji: '👥',
		iconBg: '#1A2E3A',
		nameKey: 'tileShare',
		descKey: 'tileShare',
		badgeKey: 'tileShare',
	},
];

const FeaturesSection: React.FC = () => {
	const { t } = useTranslation();
	const [featuresOpen, setFeaturesOpen] = useState(false);

	const features = useMemo(
		() =>
			FEATURE_ITEMS.map((item) => ({
				...item,
				name: t(`discover.features.items.${item.nameKey}.name`),
				desc: t(`discover.features.items.${item.descKey}.desc`),
				badge: t(`discover.features.items.${item.badgeKey}.badge`),
			})),
		[t]
	);

	return (
		<ExpandableWrapper>
			<ExpandableSection>
				<ExpandableHeader $open={featuresOpen} onClick={() => setFeaturesOpen((o) => !o)}>
					<ExpandableTextSide>
						<SectionBadge>{t('discover.features.badge')}</SectionBadge>
						<SectionTitle>{t('discover.features.title')}</SectionTitle>
						<SectionSummary>{t('discover.features.summary')}</SectionSummary>
					</ExpandableTextSide>

					<ExpandableHeaderRight>
						<FeaturesVisual>
							<FeaturesVisualRow>
								<FeaturesVisualIcon $bg="#1A2E3A">🧩</FeaturesVisualIcon>
								<FeaturesVisualIcon $bg="#3D1C2A">🤖</FeaturesVisualIcon>
								<FeaturesVisualIcon $bg="#1A2840">💬</FeaturesVisualIcon>
							</FeaturesVisualRow>
							<FeaturesVisualRow>
								<FeaturesVisualIcon $bg="#4A1A2A">🗣️</FeaturesVisualIcon>
								<FeaturesVisualIcon $bg="#1A3320">🚗</FeaturesVisualIcon>
								<FeaturesVisualIcon $bg="#1A2E3A">📍</FeaturesVisualIcon>
							</FeaturesVisualRow>
							<FeaturesVisualRow>
								<FeaturesVisualIcon $bg="#3D1C2A">🔄</FeaturesVisualIcon>
								<FeaturesVisualIcon $bg="#1A2040">📅</FeaturesVisualIcon>
								<FeaturesVisualIcon $bg="#1A2E3A">👥</FeaturesVisualIcon>
							</FeaturesVisualRow>
						</FeaturesVisual>
						<Chevron $open={featuresOpen}>&#9660;</Chevron>
					</ExpandableHeaderRight>
				</ExpandableHeader>

				<ExpandableBody $open={featuresOpen}>
					<ExpandableBodyInner>
						<FeaturesGrid>
							{features.map((feature) => (
								<FeatureCard key={feature.nameKey}>
									<FeatureIconBox $bg={feature.iconBg}>
										{feature.emoji}
									</FeatureIconBox>
									<FeatureName>{feature.name}</FeatureName>
									<FeatureDesc>{feature.desc}</FeatureDesc>
									<FeatureBadge>{feature.badge}</FeatureBadge>
								</FeatureCard>
							))}
						</FeaturesGrid>
					</ExpandableBodyInner>
				</ExpandableBody>
			</ExpandableSection>
		</ExpandableWrapper>
	);
};

export default FeaturesSection;
