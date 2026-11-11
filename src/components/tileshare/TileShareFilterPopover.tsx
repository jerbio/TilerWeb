import { ReactNode, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { ChevronDown } from 'lucide-react';

const focusable =
	'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]';
const orderedControls = (root: ParentNode) =>
	Array.from(root.querySelectorAll<HTMLElement>(focusable)).sort((a, b) =>
		a === b ? 0 : a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
	);

/** A non-modal, viewport-bounded multi-select surface that never changes the toolbar height. */
export default function TileShareFilterPopover({
	label,
	open,
	onOpenChange,
	children,
}: {
	label: ReactNode;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	children: ReactNode;
}) {
	const { t } = useTranslation();
	const id = useId();
	const trigger = useRef<HTMLButtonElement>(null);
	const panel = useRef<HTMLDivElement>(null);
	const change = useRef(onOpenChange);
	change.current = onOpenChange;
	const [placement, setPlacement] = useState<{
		top: number;
		left: number;
		width: number;
		height: number;
	} | null>(null);
	const placed = placement !== null;
	useLayoutEffect(() => {
		if (!open) return;
		const update = () => {
			if (!trigger.current || !panel.current) return;
			const bounds = trigger.current.getBoundingClientRect();
			const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
			const margin = 12;
			const gap = 6;
			const width = Math.min(Math.max(bounds.width, 280), viewportWidth - margin * 2);
			const viewportTop = window.visualViewport?.offsetTop ?? 0;
			const viewportBottom =
				viewportTop + (window.visualViewport?.height ?? window.innerHeight);
			const below = viewportBottom - bounds.bottom - gap - margin;
			const above = bounds.top - viewportTop - gap - margin;
			const down = below >= Math.min(panel.current.scrollHeight, 320) || below >= above;
			const height = Math.max(0, Math.min(360, down ? below : above));
			const top = down
				? bounds.bottom + gap
				: Math.max(
						viewportTop + margin,
						bounds.top - gap - Math.min(height, panel.current.scrollHeight)
					);
			const left = Math.max(margin, Math.min(bounds.left, viewportWidth - width - margin));
			const next = { top, left, width, height };
			setPlacement((previous) =>
				previous &&
				Object.keys(next).every(
					(key) => previous[key as keyof typeof next] === next[key as keyof typeof next]
				)
					? previous
					: next
			);
		};
		update();
		window.addEventListener('resize', update);
		window.addEventListener('scroll', update, true);
		window.visualViewport?.addEventListener('resize', update);
		window.visualViewport?.addEventListener('scroll', update);
		const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
		if (panel.current) observer?.observe(panel.current);
		return () => {
			window.removeEventListener('resize', update);
			window.removeEventListener('scroll', update, true);
			window.visualViewport?.removeEventListener('resize', update);
			window.visualViewport?.removeEventListener('scroll', update);
			observer?.disconnect();
		};
	}, [open]);
	useLayoutEffect(() => {
		if (open && placed) panel.current?.querySelector<HTMLElement>(focusable)?.focus();
	}, [open, placed]);
	useEffect(() => {
		if (!open) return;
		const outside = (event: Event) => {
			const target = event.target as Node;
			if (!trigger.current?.contains(target) && !panel.current?.contains(target))
				change.current(false);
		};
		const escape = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return;
			event.preventDefault();
			event.stopPropagation();
			change.current(false);
			trigger.current?.focus();
		};
		document.addEventListener('pointerdown', outside);
		document.addEventListener('focusin', outside);
		document.addEventListener('keydown', escape);
		return () => {
			document.removeEventListener('pointerdown', outside);
			document.removeEventListener('focusin', outside);
			document.removeEventListener('keydown', escape);
		};
	}, [open]);
	return (
		<>
			<Trigger
				ref={trigger}
				id={`${id}-trigger`}
				type="button"
				aria-expanded={open}
				aria-controls={open ? `${id}-panel` : undefined}
				aria-haspopup="dialog"
				onClick={() => change.current(!open)}
				onKeyDown={(event) => {
					if (event.key === 'ArrowDown') {
						event.preventDefault();
						change.current(true);
					}
				}}
			>
				{label}
				<ChevronDown size={14} aria-hidden="true" />
			</Trigger>
			{open &&
				createPortal(
					<Panel
						ref={panel}
						role="dialog"
						id={`${id}-panel`}
						aria-labelledby={`${id}-trigger`}
						style={{
							position: 'fixed',
							top: placement?.top ?? 0,
							left: placement?.left ?? 0,
							width: placement?.width ?? 280,
							maxHeight: placement?.height ?? 360,
							visibility: placed ? 'visible' : 'hidden',
						}}
						onKeyDown={(event) => {
							if (event.key !== 'Tab') return;
							const controls = panel.current ? orderedControls(panel.current) : [];
							if (event.shiftKey && event.target === controls[0]) {
								event.preventDefault();
								change.current(false);
								trigger.current?.focus();
							} else if (
								!event.shiftKey &&
								event.target === controls[controls.length - 1]
							) {
								event.preventDefault();
								change.current(false);
								const pageControls = orderedControls(document).filter(
									(el) =>
										!panel.current?.contains(el) &&
										el.tabIndex >= 0 &&
										!el.closest('[hidden],[inert],[aria-hidden="true"]')
								);
								const index = pageControls.indexOf(trigger.current!);
								(pageControls[index + 1] ?? trigger.current)?.focus();
							}
						}}
					>
						{children}
						<Close
							type="button"
							onClick={() => {
								change.current(false);
								trigger.current?.focus();
							}}
						>
							{t('tileShareComposer.close', 'Close')}
						</Close>
					</Panel>,
					document.body
				)}
		</>
	);
}

const Trigger = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: space-between;
	gap: 6px;
	min-height: 36px;
	padding: 8px 10px;
	min-width: 0;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: 8px;
	background: ${({ theme }) => theme.colors.background.card};
	color: ${({ theme }) => theme.colors.text.primary};
	font: inherit;
	font-size: 13px;
	cursor: pointer;
	text-align: start;
	> svg {
		flex-shrink: 0;
	}
	&:hover,
	&[aria-expanded='true'] {
		background: ${({ theme }) => theme.colors.background.card2};
	}
	&:focus-visible {
		outline: 2px solid ${({ theme }) => theme.colors.button.brand.bg};
		outline-offset: 2px;
	}
`;
const Panel = styled.div`
	z-index: 100;
	box-sizing: border-box;
	padding: 12px;
	overflow-y: auto;
	overscroll-behavior: contain;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: 12px;
	background: ${({ theme }) => theme.colors.background.card};
	color: ${({ theme }) => theme.colors.text.primary};
	box-shadow: 0 10px 32px rgb(0 0 0 / 24%);
	font-size: 13px;
	fieldset {
		display: grid;
		gap: 12px;
		padding: 0;
		margin: 0;
		min-width: 0;
		border: 0;
	}
	legend {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
	label {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;
		overflow-wrap: anywhere;
	}
	label:has(> input[type='checkbox']) {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		align-items: start;
	}
	input[type='search'],
	input[type='date'],
	select {
		box-sizing: border-box;
		width: 100%;
		padding: 8px 10px;
		min-width: 0;
		border: 1px solid ${({ theme }) => theme.colors.border.default};
		border-radius: 8px;
		background: ${({ theme }) => theme.colors.background.page};
		color: inherit;
		font: inherit;
	}
	input[type='checkbox'] {
		accent-color: ${({ theme }) => theme.colors.button.brand.bg};
	}
	@media (pointer: coarse) {
		label:has(> input[type='checkbox']) {
			min-height: 36px;
			align-items: center;
		}
	}
	input:focus-visible,
	select:focus-visible,
	button:focus-visible {
		outline: 2px solid ${({ theme }) => theme.colors.button.brand.bg};
		outline-offset: 2px;
	}
`;
const Close = styled.button`
	display: block;
	margin: 12px 0 0 auto;
	padding: 6px 10px;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: 8px;
	background: transparent;
	color: inherit;
	font: inherit;
	cursor: pointer;
`;
