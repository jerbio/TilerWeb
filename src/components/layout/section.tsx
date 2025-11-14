import React from 'react';
import styled from 'styled-components';
import palette from '../../core/theme/palette';

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
		props.maxWidth ? `${props.maxWidth}px` : palette.container.sizes.xLarge};
	margin: 0 auto;
	padding: ${(props) =>
			props.paddingBlock !== undefined
				? `${props.paddingBlock}px`
				: palette.container.paddingBlock.default}
		${palette.container.paddingInline.default};

	@media (min-width: ${palette.screens.lg}) {
		padding: ${(props) =>
				props.paddingBlock !== undefined
					? `${props.paddingBlock}px`
					: palette.container.paddingBlock.lg}
			${palette.container.paddingInline.lg};
	}
`;

type SectionProps = {
	children: React.ReactNode;
	width?: number;
	paddingBlock?: number;
	id?: string;
};

const Section = ({ children, width, paddingBlock, id }: SectionProps) => {
	return (
		<StyledSectionWrapper id={id}>
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
