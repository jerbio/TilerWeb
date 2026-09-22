import React from 'react';
import styled from 'styled-components';
import palette from '@/core/theme/palette';
import SEO from '@/core/common/components/SEO';

/**
 * Public 404 page for unknown routes.
 *
 * Rendered by the catch-all route in `App.tsx`. Carries `noindex` so search
 * engines drop any indexed dead URLs, while `follow` keeps crawling of the
 * home link below intact.
 */

const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 1.25rem;
	min-height: 60vh;
	padding: 4rem 2rem;
	text-align: center;
`;

const Code = styled.p`
	margin: 0;
	font-family: ${palette.typography.fontFamily.urban};
	font-size: ${palette.typography.fontSize.displayXxl};
	font-weight: ${palette.typography.fontWeight.bold};
	line-height: 1;
	background: linear-gradient(
		to bottom,
		${palette.colors.white},
		70%,
		${palette.colors.gray[400]}
	);
	-webkit-background-clip: text;
	background-clip: text;
	color: transparent;
`;

const Title = styled.h1`
	margin: 0;
	font-family: ${palette.typography.fontFamily.urban};
	font-size: ${palette.typography.fontSize.displaySm};
	font-weight: ${palette.typography.fontWeight.bold};
	color: ${palette.colors.white};
`;

const Description = styled.p`
	margin: 0;
	max-width: 480px;
	color: ${palette.colors.gray[400]};
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.lg};
	line-height: ${palette.typography.lineHeight.lg};
`;

const HomeLink = styled.a`
	display: inline-block;
	margin-top: 1rem;
	padding: 0.75rem 1.75rem;
	border-radius: ${palette.borderRadius.medium};
	background: ${palette.colors.brand[500]};
	color: ${palette.colors.white};
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.base};
	font-weight: ${palette.typography.fontWeight.semibold};
	text-decoration: none;
	transition: background 0.2s ease;

	&:hover {
		background: ${palette.colors.brand[600]};
	}
`;

const NotFound: React.FC = () => (
	<>
		<SEO
			title="Page Not Found - Tiler"
			description="The page you are looking for does not exist. Return to Tiler's home to explore AI scheduling."
			noindex
			canonicalUrl="/404"
		/>
		<Wrapper>
			<Code>404</Code>
			<Title>Page not found</Title>
			<Description>
				We couldn&apos;t find the page you&apos;re looking for. It may have moved, or the
				link might be out of date.
			</Description>
			<HomeLink href="/">Back to Home</HomeLink>
		</Wrapper>
	</>
);

export default NotFound;
