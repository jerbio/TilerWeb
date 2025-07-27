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
	size?: 'base' | 'large';
}

const Container = styled.div<{ $align: 'left' | 'center' | 'right' }>`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	align-items: ${({ $align: align }) =>
		align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'};
	text-align: ${({ $align: align }) => align};
	max-width: 100%;
	margin-bottom: 2rem;

	@media (max-width: 768px) {
		align-items: center;
		text-align: center;
	}
`;

const Header = styled.h2<{ size: 'base' | 'large' }>`
	font-family: ${styles.typography.fontFamily.urban};
	font-size: ${({ size }) =>
		size === 'large'
			? styles.typography.fontSize.displayBase
			: styles.typography.fontSize.displaySm};
	font-weight: bold;
	background: linear-gradient(to bottom, white, 70%, ${styles.colors.gray[400]});
	-webkit-background-clip: text;
	background-clip: text;
	color: transparent;
	line-height: 1.1;
	xp img {
		width: 20px;
		height: auto;
		margin-left: 10px;
	}

	@media (max-width: 768px) {
		font-size: ${({ size }) =>
			size === 'large'
				? styles.typography.fontSize.displaySm
				: styles.typography.fontSize.displayXs};
		text-align: center;
	}
`;

const SubHeader = styled.p`
	color: ${styles.colors.gray[500]};
	max-width: 480px;
`;

const SpanText = styled.span`
	color: ${styles.colors.brand[400]};
`;

const Image = styled.img`
	display: inline-block;
	height: 32px;
	width: 32px;
	margin-left: 0.5ch;
`;

const SectionHeaders: React.FC<SectionHeadersProps> = ({
	headerText,
	subHeaderText,
	spanText,
	image,
	imageAlt,
	align = 'center',
	size = 'base',
}) => {
	return (
		<Container $align={align}>
			<Header size={size}>
				{headerText}
				{spanText && (
					<>
						<br />
						<SpanText>{spanText}</SpanText>
					</>
				)}
				{image && <Image src={image} alt={imageAlt} width={32} height={32} />}
			</Header>
			<SubHeader>{subHeaderText}</SubHeader>
		</Container>
	);
};

export default SectionHeaders;
