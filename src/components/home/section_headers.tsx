import React from 'react';
import styled from 'styled-components';
import styles from '../../util/styles';

interface SectionHeadersProps {
	headerText: string;
	subHeaderText: string;
	spanText?: string;
	image?: string;
	imageAlt?: string;
	align?: 'left' | 'center' | 'right';
}

const Container = styled.div<{ align: 'left' | 'center' | 'right' }>`
	display: flex;
	flex-direction: column;
	align-items: ${({ align }) =>
		align === 'left'
			? 'flex-start'
			: align === 'right'
				? 'flex-end'
				: 'center'};
	text-align: ${({ align }) => align};
	padding: 20px;
`;

const Header = styled.h1`
	margin: 0;
	font-size: ${styles.typography.fontSize.displaySm};
	span {
		color: ${styles.colors.backgroundRed};
	}
	img {
		width: 20px;
		height: auto;
		margin-left: 10px;
	}
`;

const SubHeader = styled.p`
	margin: 0;
	color: ${styles.colors.textGrey};
	font-size: ${styles.typography.fontSize.base};
	width: 480px;
`;

const SectionHeaders: React.FC<SectionHeadersProps> = ({
	headerText,
	subHeaderText,
	spanText,
	image,
	imageAlt,
	align = 'center',
}) => {
	return (
		<Container align={align}>
			<Header>
				{headerText}
				<br />
				{spanText && <span>{spanText}</span>}
				{image && <img src={image} alt={imageAlt} />}
			</Header>
			<SubHeader>{subHeaderText}</SubHeader>
		</Container>
	);
};

export default SectionHeaders;
