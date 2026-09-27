import styled from 'styled-components';

export const Timeline = styled.section`
	color: ${({ theme }) => theme.colors.text.primary};
	font-size: 14px;
	width: 100%;
	min-width: 0;
	button,
	summary,
	a {
		-webkit-tap-highlight-color: transparent;
	}
	button:focus-visible,
	summary:focus-visible,
	a:focus-visible,
	h2:focus-visible {
		outline: 2px solid ${({ theme }) => theme.colors.text.secondary};
		outline-offset: 4px;
		border-radius: 6px;
	}
	button:disabled {
		opacity: 0.45;
		cursor: wait;
	}
`;
export const Header = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	min-height: 40px;
	margin-bottom: 8px;
	h2 {
		margin: 0;
		font-size: 16px;
		font-weight: 600;
		letter-spacing: -0.3px;
	}
`;
export const HeaderActions = styled.div`
	display: flex;
	align-items: center;
	gap: 6px;
`;
export const TextButton = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	border: 0;
	background: transparent;
	padding: 8px 4px;
	min-height: 32px;
	color: ${({ theme }) => theme.colors.text.secondary};
	font: inherit;
	font-size: 12px;
	font-weight: 500;
	cursor: pointer;
	&:hover {
		color: ${({ theme }) => theme.colors.text.primary};
	}
`;
export const Options = styled.details`
	position: relative;
	summary {
		list-style: none;
		cursor: pointer;
		padding: 6px;
		display: flex;
		color: ${({ theme }) => theme.colors.text.secondary};
	}
	summary::-webkit-details-marker {
		display: none;
	}
`;
export const Filter = styled.label`
	position: absolute;
	z-index: 2;
	right: 0;
	top: calc(100% + 8px);
	display: flex;
	gap: 10px;
	align-items: center;
	min-width: 180px;
	padding: 14px;
	border-radius: 8px;
	cursor: pointer;
	background: ${({ theme }) => theme.colors.background.card};
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	box-shadow: 0 8px 24px
		color-mix(in srgb, ${({ theme }) => theme.colors.backdrop.default} 40%, transparent);
	input {
		accent-color: ${({ theme }) => theme.colors.text.primary};
	}
`;
export const List = styled.ol`
	list-style: none;
	padding: 0;
	margin: 0;
`;
export const Row = styled.li`
	position: relative;
	border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
	&:hover {
		background: ${({ theme }) => theme.colors.button.ghost.bgHover};
	}
`;
export const RowLink = styled.a`
	display: grid;
	grid-template-columns: 42px minmax(0, 1fr) auto;
	column-gap: 16px;
	align-items: center;
	min-height: 100px;
	padding: 22px 0;
	color: inherit;
	text-decoration: none;
`;
export const Avatar = styled.span`
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	border-radius: 50%;
	border: 1px solid ${({ theme }) => theme.colors.avatar.border};
	flex-shrink: 0;
	background: ${({ theme }) => theme.colors.avatar.background};
	color: ${({ theme }) => theme.colors.avatar.text};
	font-size: 12px;
	font-weight: 600;
	letter-spacing: 0.3px;
`;
export const Badge = styled.span<{ $tone: 'success' | 'danger' | 'neutral' | 'warning' }>`
	position: absolute;
	bottom: -6px;
	right: -6px;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 23px;
	height: 23px;
	border-radius: 6px;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	background: ${({ theme }) => theme.colors.background.card};
	color: ${({ $tone, theme }) =>
		({
			success: theme.colors.text.success,
			danger: theme.colors.text.error,
			neutral: theme.colors.text.secondary,
			warning: theme.colors.text.warning,
		})[$tone]};
`;
export const Copy = styled.span`
	display: block;
	min-width: 0;
	overflow-wrap: anywhere;
`;
export const Sentence = styled.span`
	display: block;
	line-height: 1.55;
	color: ${({ theme }) => theme.colors.text.secondary};
	font-weight: 500;
	strong {
		color: ${({ theme }) => theme.colors.text.primary};
		font-weight: 600;
	}
`;
export const Actor = styled.span`
	font-weight: 600;
`;
export const Detail = styled.span`
	display: block;
	font-size: 12px;
	line-height: 1.5;
	color: ${({ theme }) => theme.colors.text.secondary};
	margin-top: 5px;
`;
export const Trailing = styled.span`
	display: flex;
	align-items: flex-end;
	align-self: stretch;
	justify-content: space-between;
	flex-direction: column;
	gap: 12px;
	color: ${({ theme }) => theme.colors.text.secondary};
	min-width: 48px;
	padding: 0 2px;
	time {
		font-size: 12px;
		white-space: nowrap;
		line-height: 1.4;
	}
`;
export const Dismiss = styled.button`
	position: absolute;
	right: 27px;
	bottom: 17px;
	width: 28px;
	height: 28px;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 0;
	border-radius: 6px;
	background: ${({ theme }) => theme.colors.background.page};
	color: ${({ theme }) => theme.colors.text.secondary};
	cursor: pointer;
	@media (hover: hover) and (pointer: fine) {
		opacity: 0;
		${Row}:hover &, ${Row}:focus-within & {
			opacity: 1;
		}
	}
	&:hover {
		color: ${({ theme }) => theme.colors.text.primary};
		background: ${({ theme }) => theme.colors.background.card2};
	}
`;
export const Notice = styled.div`
	margin: 12px 0;
	padding: 16px;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: 8px;
	color: ${({ theme }) => theme.colors.text.secondary};
	font-size: 13px;
	line-height: 1.6;
	p {
		margin: 0 0 6px;
	}
`;
export const More = styled(TextButton)`
	width: 100%;
	margin-top: 12px;
`;
