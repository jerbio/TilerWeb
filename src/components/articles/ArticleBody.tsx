import React from 'react';
import styled from 'styled-components';
import palette from '@/core/theme/palette';
import { ArticleSection } from '@/core/common/data/articles';

const BodyWrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2.5rem;
	max-width: 760px;
	margin: 3rem auto 0;
	padding: 0 1.5rem;
`;

const LeadProse = styled.p`
	font-size: ${palette.typography.fontSize.xl};
	color: rgba(255, 255, 255, 0.85);
	line-height: 1.7;
	margin: 0;
`;

const Prose = styled.p`
	font-size: ${palette.typography.fontSize.base};
	color: rgba(255, 255, 255, 0.6);
	line-height: 1.8;
	margin: 0;
`;

const SectionHeading = styled.h2`
	font-family: ${palette.typography.fontFamily.urban};
	font-size: ${palette.typography.fontSize.displayXs};
	font-weight: 700;
	color: white;
	text-align: center;
	margin: 1rem 0 0;
`;

const StepWrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
	padding-top: 1rem;
	border-top: 1px solid ${palette.colors.gray[800]};
`;

const StepHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
`;

const StepBadge = styled.div`
	width: 36px;
	height: 36px;
	min-width: 36px;
	border-radius: 50%;
	background-color: ${palette.colors.brand[500]};
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 700;
	font-size: ${palette.typography.fontSize.base};
	color: white;
`;

const StepTitle = styled.h3`
	font-family: ${palette.typography.fontFamily.urban};
	font-size: ${palette.typography.fontSize.lg};
	font-weight: 700;
	color: white;
	margin: 0;
`;

const StepContentRow = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1.25rem;

	@media (min-width: ${palette.screens.lg}) {
		flex-direction: row;
		align-items: flex-start;
		gap: 2rem;
	}
`;

const StepImage = styled.img`
	width: 100%;
	border-radius: ${palette.borderRadius.large};
	object-fit: cover;
	max-height: 240px;

	@media (min-width: ${palette.screens.lg}) {
		width: 320px;
		min-width: 320px;
		max-height: 280px;
	}
`;

const StepText = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	flex: 1;
`;

const StepBody = styled.p`
	font-size: ${palette.typography.fontSize.base};
	color: rgba(255, 255, 255, 0.65);
	line-height: 1.8;
	margin: 0;
`;

const Callout = styled.div`
	background-color: ${palette.colors.gray[900]};
	border-left: 3px solid ${palette.colors.brand[500]};
	border-radius: 0 8px 8px 0;
	padding: 1rem 1.25rem;
`;

const CalloutLabel = styled.span`
	font-weight: ${palette.typography.fontWeight.semibold};
	color: white;
`;

const CalloutText = styled.span`
	color: rgba(255, 255, 255, 0.65);
	font-size: ${palette.typography.fontSize.sm};
`;

const StandaloneImage = styled.img`
	width: 100%;
	border-radius: ${palette.borderRadius.large};
	object-fit: cover;
`;

const Caption = styled.p`
	font-size: ${palette.typography.fontSize.xs};
	color: rgba(255, 255, 255, 0.35);
	text-align: center;
	margin: -1.5rem 0 0;
`;

interface ArticleBodyProps {
	sections: ArticleSection[];
}

export default function ArticleBody({ sections }: ArticleBodyProps) {
	return (
		<BodyWrapper>
			{sections.map((section, i) => {
				switch (section.type) {
					case 'prose':
						return section.lead ? (
							<LeadProse key={i}>{section.text}</LeadProse>
						) : (
							<Prose key={i}>{section.text}</Prose>
						);

					case 'heading':
						return <SectionHeading key={i}>{section.title}</SectionHeading>;

					case 'step':
						return (
							<StepWrapper key={i}>
								<StepHeader>
									<StepBadge>{section.stepNumber}</StepBadge>
									<StepTitle>{section.stepTitle}</StepTitle>
								</StepHeader>
								<StepContentRow>
									{section.stepImage && (
										<StepImage src={section.stepImage} alt={section.stepTitle} />
									)}
									<StepText>
										<StepBody>{section.stepBody}</StepBody>
										{section.callout && (
											<Callout>
												<CalloutLabel>{section.callout.label}: </CalloutLabel>
												<CalloutText>{section.callout.text}</CalloutText>
											</Callout>
										)}
									</StepText>
								</StepContentRow>
							</StepWrapper>
						);

					case 'callout':
						return (
							<Callout key={i}>
								{section.label && <CalloutLabel>{section.label}: </CalloutLabel>}
								<CalloutText>{section.text}</CalloutText>
							</Callout>
						);

					case 'image':
						return (
							<React.Fragment key={i}>
								<StandaloneImage src={section.src} alt={section.caption || ''} />
								{section.caption && <Caption>{section.caption}</Caption>}
							</React.Fragment>
						);

					default:
						return null;
				}
			})}
		</BodyWrapper>
	);
}
