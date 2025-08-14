import React from 'react';
import styled from 'styled-components';
import pallette from '../../core/theme/pallete';

const StyledSectionWrapper = styled.div`
	display: flex;
	justify-content: center;
	width: 100%;
	position: relative;
`;

const StyledSection = styled.section<{
	maxWidth?: number;
	paddingBlock?: number;
}>`
	position: relative;
	isolation: isolate;
	width: 100%;
	overflow: hidden;
	max-width: ${(props) =>
		props.maxWidth ? `${props.maxWidth}px` : pallette.container.sizes.xLarge};
	margin: 0 auto;
	padding: ${(props) =>
			props.paddingBlock !== undefined
				? `${props.paddingBlock}px`
				: pallette.container.paddingBlock.default}
		${pallette.container.paddingInline.default};

	@media (min-width: ${pallette.screens.lg}) {
		padding: ${(props) =>
				props.paddingBlock !== undefined
					? `${props.paddingBlock}px`
					: pallette.container.paddingBlock.lg}
			${pallette.container.paddingInline.lg};
	}
`;

type SectionProps = {
	children: React.ReactNode;
	width?: number;
	paddingBlock?: number;
};

const Section = ({ children, width, paddingBlock }: SectionProps) => {
	return (
		<StyledSectionWrapper>
			<StyledSection
				style={{
					maxWidth: width,
					paddingBlock: paddingBlock,
				}}
			>
				{children}
			</StyledSection>
		</StyledSectionWrapper>
	);
};

export default Section;
