import React from 'react';
import styled from 'styled-components';
import styles from '../../util/styles';

const StyledSectionWrapper = styled.div`
	display: flex;
	justify-content: center;
	width: 100%;
	position: relative;
`;

const StyledSection = styled.section<{
	maxWidth?: number;
	paddingBlock?: string;
}>`
	position: relative;
	isolation: isolate;
	width: 100%;
	overflow: hidden;
	max-width: ${(props) =>
		props.maxWidth ? `${props.maxWidth}px` : styles.container.sizes.xLarge};
	margin: 0 auto;
	padding: ${(props) =>
			props.paddingBlock || styles.container.paddingBlock.default}
		${styles.container.paddingInline.default};

	@media (min-width: ${styles.screens.lg}) {
		padding: ${styles.container.paddingBlock.lg}
			${styles.container.paddingInline.lg};
	}
`;

type SectionProps = {
	children: React.ReactNode;
	width?: number;
	noPaddingBlock?: boolean;
};

const Section = ({ children, width, noPaddingBlock }: SectionProps) => {
	return (
		<StyledSectionWrapper>
			<StyledSection
				style={{
					maxWidth: width,
					paddingBlock: noPaddingBlock ? '0' : undefined,
				}}
			>
				{children}
			</StyledSection>
		</StyledSectionWrapper>
	);
};

export default Section;

