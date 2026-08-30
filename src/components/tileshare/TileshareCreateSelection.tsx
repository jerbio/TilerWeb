import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { a, useSpring } from '@react-spring/web';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Layers, MessageSquare } from 'lucide-react';

type TileshareCreateSelectionProps = {
	open: boolean;
	anchorRef: React.RefObject<HTMLElement | null>;
	onClose: () => void;
	onSelectSingle: () => void;
	onSelectMulti: () => void;
};

const TileshareCreateSelection: React.FC<TileshareCreateSelectionProps> = ({
	open,
	anchorRef,
	onClose,
	onSelectSingle,
	onSelectMulti,
}) => {
	const { t } = useTranslation();
	const [pos, setPos] = useState({ top: 0, right: 0 });
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		const rect = anchorRef.current?.getBoundingClientRect();
		if (rect) {
			setPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
		}
	}, [open, anchorRef]);

	useEffect(() => {
		if (!open) return;
		const handleClick = (e: MouseEvent) => {
			if (
				anchorRef.current?.contains(e.target as Node) ||
				menuRef.current?.contains(e.target as Node)
			)
				return;
			onClose();
		};
		document.addEventListener('mousedown', handleClick);
		return () => document.removeEventListener('mousedown', handleClick);
	}, [open, anchorRef, onClose]);

	useEffect(() => {
		if (!open) return;
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		document.addEventListener('keydown', handleKey);
		return () => document.removeEventListener('keydown', handleKey);
	}, [open, onClose]);

	const animation = useSpring({
		opacity: open ? 1 : 0,
		scale: open ? 1 : 0.9,
		y: open ? 0 : -8,
		config: { duration: 150 },
	});

	if (!open) return null;

	function handleSelect(action: () => void) {
		onClose();
		action();
	}

	const singleDescription = t('tilesharedemo.dashboard.createSelection.single.description');
	const multiDescription = t('tilesharedemo.dashboard.createSelection.multi.description');

	return createPortal(
		<Container
			ref={menuRef}
			style={{
				top: pos.top,
				right: pos.right,
				opacity: animation.opacity,
				transform: animation.y.to(
					(y) => `translateY(${y}px) scale(${animation.scale.get()})`
				),
			}}
		>
			<Selection onClick={() => handleSelect(onSelectSingle)}>
				<div>
					<MessageSquare size={20} />
				</div>
				<TextBlock>
					<h3>{t('tilesharedemo.dashboard.createSelection.single.label')}</h3>
					{singleDescription && <p>{singleDescription}</p>}
				</TextBlock>
				<ChevronRight size={18} />
			</Selection>
			<Seperator />
			<Selection onClick={() => handleSelect(onSelectMulti)}>
				<div>
					<Layers size={20} />
				</div>
				<TextBlock>
					<h3>{t('tilesharedemo.dashboard.createSelection.multi.label')}</h3>
					{multiDescription && <p>{multiDescription}</p>}
				</TextBlock>
				<ChevronRight size={18} />
			</Selection>
		</Container>,
		document.body
	);
};

const Seperator = styled.hr`
	border: none;
	height: 1px;
	background-color: ${({ theme }) => theme.colors.border.subtle};
`;

const Container = styled(a.div)`
	position: fixed;
	z-index: 10000;
	width: 280px;
	background-color: ${({ theme }) => theme.colors.background.card};
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.large};
	display: flex;
	flex-direction: column;
	overflow: hidden;
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
	transform-origin: top right;
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
		margin-block: auto;
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
		transition: color 0.2s ease;
	}

	transition: background-color 0.2s ease;
`;

const TextBlock = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: center;
	flex: 1;
`;

export default TileshareCreateSelection;
