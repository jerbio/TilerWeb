import { BrickWall, ChevronRight, Sparkle } from 'lucide-react';
import React from 'react';
import styled from 'styled-components';
import { useCalendarUI } from './calendar-ui.provider';
import { useTranslation } from 'react-i18next';

export const CalendarCreateSelection: React.FC = () => {
	const { t } = useTranslation();
	const { createTile, createSelection, createBlock } = useCalendarUI((state) => state);

	function openCreateTile() {
		createSelection.actions.close();
		createTile.actions.open();
	}

	function openCreateBlock() {
		createSelection.actions.close();
		createBlock.actions.open();
	}

	return (
		<Container>
			<Selection onClick={openCreateTile}>
				<div>
					<Sparkle size={20} />
				</div>
				<div>
					<h3>{t('calendar.createSelection.tile.label')}</h3>
					<p>{t('calendar.createSelection.tile.description')}</p>
				</div>
				<ChevronRight size={18} />
			</Selection>
			<Seperator />
			<Selection onClick={openCreateBlock}>
				<div>
					<BrickWall size={20} />
				</div>
				<div>
					<h3>{t('calendar.createSelection.block.label')}</h3>
					<p>{t('calendar.createSelection.block.description')}</p>
				</div>
				<ChevronRight size={18} />
			</Selection>
		</Container>
	);
};

const Seperator = styled.hr`
	border: none;
	height: 1px;
	background-color: ${(props) => props.theme.colors.border.subtle};
`;

const Container = styled.div`
	background-color: ${({ theme }) => theme.colors.background.card};
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.large};
	display: flex;
	flex-direction: column;
	overflow: hidden;
`;

const Selection = styled.button`
	display: flex;
	gap: 0.75rem;
	padding: 10px;

	p {
		font-size: ${({ theme }) => theme.typography.fontSize.sm};
		font-family: ${({ theme }) => theme.typography.fontFamily.inter};
		color: ${({ theme }) => theme.colors.text.muted};
		text-align: left;
	}

	&:hover {
		background-color: ${({ theme }) => `${theme.colors.brand[300]}05`};
		& > :first-child {
			background-color: ${({ theme }) => `${theme.colors.brand[500]}10`};
			border-color: ${({ theme }) => `${theme.colors.brand[500]}20`};
			color: ${({ theme }) => theme.colors.brand[400]};
		}

		& > :last-child {
			opacity: 1;
			transform: translateX(0);
		}

		h3 {
			color: ${({ theme }) => theme.colors.text.primary};
		}
	}

	& > :last-child {
		margin-block: auto;
		min-width: 36px;
		color: ${({ theme }) => theme.colors.brand[400]};
		opacity: 0;
		transform: translateX(10px);
		transition:
			opacity 0.2s ease,
			transform 0.2s ease;
	}

	& > :first-child {
		margin-top: 2px;
		border-radius: ${({ theme }) => theme.borderRadius.medium};
		border: 1px solid ${({ theme }) => theme.colors.border.strong};
		color: ${({ theme }) => theme.colors.text.muted};
		height: 36px;
		aspect-ratio: 1 / 1;
		display: flex;
		justify-content: center;
		align-items: center;

		transition:
			background-color 0.2s ease,
			border-color 0.2s ease,
			color 0.2s ease;
	}

	h3 {
		font-size: ${({ theme }) => theme.typography.fontSize.base};
		font-family: ${({ theme }) => theme.typography.fontFamily.urban};
		font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
		color: ${({ theme }) => theme.colors.text.secondary};
		text-align: left;
		leading: 1;
		flex: 1;
		transition: color 0.2s ease;
	}

	transition: background-color 0.2s ease;
`;

export default CalendarCreateSelection;
