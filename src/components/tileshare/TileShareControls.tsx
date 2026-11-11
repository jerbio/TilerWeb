import styled from 'styled-components';

export const ShareControls = styled.div`
	display: grid;
	grid-template-columns: max-content minmax(0, 1fr);
	gap: 16px;
	align-items: center;
	min-width: 0;
	padding: 12px;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: 14px;
	background: ${({ theme }) => theme.colors.background.card};
	@container share-experience (max-width: 760px) {
		grid-template-columns: minmax(0, 1fr);
		gap: 12px;
	}
`;
export const ShareNavigation = styled.div`
	display: grid;
	justify-items: start;
	align-content: center;
	gap: 8px;
	min-width: 0;
	max-width: 100%;
	> [role='tablist'] {
		justify-self: start;
		max-width: 100%;
		overflow-x: auto;
		box-sizing: border-box;
	}
`;
