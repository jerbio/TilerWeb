import React from 'react';
import styled from 'styled-components';

type ViewHeaderProps = {
	/** Left-aligned count label, e.g. "Showing 8 Tilettes". */
	label: string;
	/** Right-aligned view toggle. */
	toggle: React.ReactNode;
};

const ViewHeader: React.FC<ViewHeaderProps> = ({ label, toggle }) => (
	<Row>
		<Count>{label}</Count>
		{toggle}
	</Row>
);

const Row = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
`;

const Count = styled.h2`
	margin: 0;
	font-size: ${({ theme }) => theme.typography.fontSize.base};
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	color: ${({ theme }) => theme.colors.text.secondary};
`;

export default ViewHeader;
