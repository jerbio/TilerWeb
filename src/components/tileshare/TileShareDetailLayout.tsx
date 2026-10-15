import { ReactNode } from 'react';
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
}: TileShareActivityScope & { children: ReactNode }) {
	const { t } = useTranslation();
	return (
		<TileShareTheme>
			<Canvas>
				<Layout key={`${ClusterId}:${TiletteId}`}>
					<Content>{children}</Content>
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
