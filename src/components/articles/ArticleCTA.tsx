import { Link } from 'react-router';
import styled from 'styled-components';
import palette from '@/core/theme/palette';

const CTAWrapper = styled.div`
	margin: 4rem auto 0;
	max-width: 760px;
	padding: 0 1.5rem 5rem;
`;

const CTACard = styled.div`
	background: linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%);
	border-radius: ${palette.borderRadius.large};
	padding: 3rem 2rem;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1.25rem;
	text-align: center;
`;

const CTAHeading = styled.h2`
	font-family: ${palette.typography.fontFamily.urban};
	font-size: ${palette.typography.fontSize.displaySm};
	font-weight: 800;
	color: white;
	margin: 0;
`;

const CTASubtext = styled.p`
	font-size: ${palette.typography.fontSize.base};
	color: rgba(255, 255, 255, 0.75);
	margin: 0;
`;

const CTAButton = styled(Link)`
	background-color: white;
	color: ${palette.colors.brand[500]};
	font-weight: ${palette.typography.fontWeight.semibold};
	font-size: ${palette.typography.fontSize.base};
	padding: 0.85rem 2.25rem;
	border-radius: 999px;
	text-decoration: none;
	transition: opacity 0.2s ease;
	margin-top: 0.5rem;

	&:hover {
		opacity: 0.9;
	}
`;

const CTANote = styled.p`
	font-size: ${palette.typography.fontSize.sm};
	color: rgba(255, 255, 255, 0.5);
	margin: 0;
`;

export default function ArticleCTA() {
	return (
		<CTAWrapper>
			<CTACard>
				<CTAHeading>Ready to build your timeline?</CTAHeading>
				<CTASubtext>Five minutes of setup. A schedule that actually works.</CTASubtext>
				<CTAButton to="/signup">Get Started Free</CTAButton>
				<CTANote>Available on iOS and Android. Free to start.</CTANote>
			</CTACard>
		</CTAWrapper>
	);
}
