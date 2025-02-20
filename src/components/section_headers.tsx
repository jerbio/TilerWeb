import React from 'react';
import styled from 'styled-components';

interface SectionHeadersProps {
	headerText: string;
	subHeaderText: string;
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
`;

const SubHeader = styled.p`
	margin: 0;
`;

const SectionHeaders: React.FC<SectionHeadersProps> = ({
	headerText,
	subHeaderText,
	align = 'center',
}) => {
	return (
		<Container align={align}>
			<Header>{headerText}</Header>
			<SubHeader>{subHeaderText}</SubHeader>
		</Container>
	);
};

export default SectionHeaders;
