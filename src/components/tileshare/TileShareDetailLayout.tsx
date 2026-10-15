import { ReactNode, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { TileShareActivityScope } from '@/core/common/types/tileshareActivity';
import TileShareActivityTimeline from './TileShareActivityTimeline';
import { tileShareReveal } from './tileshareMotion';
import TileShareTheme from './TileShareTheme';
import { tileShareControls } from './tileshareVisuals';

export default function TileShareDetailLayout({
	children,
	ClusterId,
	TiletteId,
	stickyTitle,
}: TileShareActivityScope & { children: ReactNode; stickyTitle?: string }) {
	const { t } = useTranslation();
	const scrollRoot = useRef<HTMLDivElement>(null);
	const content = useRef<HTMLDivElement>(null);
	const [collapsed, setCollapsed] = useState(false);
	useEffect(() => {
		setCollapsed(false);
		if (!stickyTitle) return;
		const root = scrollRoot.current;
		const header = content.current?.querySelector<HTMLElement>('[data-tileshare-header]');
		if (!root || !header) return;
		const update = () => {
			const bounds = header.getBoundingClientRect();
			setCollapsed(bounds.height > 0 && bounds.bottom <= root.getBoundingClientRect().top);
		};
		update();
		if (typeof IntersectionObserver !== 'undefined') {
			const observer = new IntersectionObserver(update, { root, threshold: 0 });
			observer.observe(header);
			return () => observer.disconnect();
		}
		root.addEventListener('scroll', update, { passive: true });
		return () => root.removeEventListener('scroll', update);
	}, [stickyTitle, ClusterId, TiletteId]);
	return (
		<TileShareTheme>
			<Canvas ref={scrollRoot}>
				<Layout key={`${ClusterId}:${TiletteId}`}>
					<Content ref={content}>
						{stickyTitle && (
							<StickyTitle $visible={collapsed} aria-hidden={!collapsed}>
								<TitleBar title={stickyTitle}>{stickyTitle}</TitleBar>
							</StickyTitle>
						)}
						{children}
					</Content>
					{ClusterId && (
						<Panel aria-label={t('tileshareActivity.title', 'Activities')}>
							<TileShareActivityTimeline
								ClusterId={ClusterId}
								TiletteId={TiletteId}
							/>
						</Panel>
					)}
				</Layout>
			</Canvas>
		</TileShareTheme>
	);
}

const Layout = styled.div`
	${tileShareReveal}
	display: grid;
	grid-template-columns: minmax(0, 1fr) 300px;
	gap: 28px;
	width: 100%;
	max-width: 1440px;
	margin: 0 auto;
	padding: 28px 32px;
	min-height: 100%;
	@media (max-width: 960px) {
		grid-template-columns: minmax(0, 1fr);
	}
	@media (max-width: 600px) {
		padding: 20px 16px;
		gap: 20px;
	}
`;

const Canvas = styled.div`
	${tileShareControls}
	background: ${({ theme }) => theme.colors.background.page};
	flex: 1;
	min-height: 0;
	overflow-y: auto;
`;

const Content = styled.div`
	min-width: 0;
	padding: 0;
`;

// A zero-height sticky layer preserves the original header's footprint and scroll position.
const StickyTitle = styled.div<{ $visible: boolean }>`
	position: sticky;
	top: 0;
	z-index: 5;
	height: 0;
	visibility: ${({ $visible }) => ($visible ? 'visible' : 'hidden')};
	opacity: ${({ $visible }) => ($visible ? 1 : 0)};
	pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};
	transition:
		opacity 140ms ease,
		visibility 140ms ease;
	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`;
const TitleBar = styled.div`
	display: block;
	height: 48px;
	line-height: 48px;
	padding: 0 16px;
	font-size: 16px;
	font-weight: 600;
	color: ${({ theme }) => theme.colors.text.primary};
	background: ${({ theme }) => theme.colors.background.card};
	border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const Panel = styled.aside`
	min-width: 0;
	padding: 20px;
	align-self: start;
	background: ${({ theme }) => theme.colors.background.card};
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: 16px;
	overflow-wrap: anywhere;
	@media (max-width: 960px) {
		padding: 20px;
	}
`;
