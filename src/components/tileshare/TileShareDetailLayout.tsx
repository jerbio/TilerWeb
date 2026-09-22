import { ReactNode } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { TileShareActivityScope } from '@/core/common/types/tileshareActivity';
import TileShareActivityTimeline from './TileShareActivityTimeline';

export default function TileShareDetailLayout({
	children,
	ClusterId,
	TiletteId,
}: TileShareActivityScope & { children: ReactNode }) {
	const { t } = useTranslation();
	return (
		<Layout>
			<Content>{children}</Content>
			{ClusterId && (
				<Panel aria-label={t('tileshareActivity.title', 'Activities')}>
					<TileShareActivityTimeline ClusterId={ClusterId} TiletteId={TiletteId} />
				</Panel>
			)}
		</Layout>
	);
}

const Layout = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(18rem, 28%);
	min-height: 100%;
	@media (max-width: 960px) {
		grid-template-columns: minmax(0, 1fr);
	}
`;

const Content = styled.div`
	min-width: 0;
	padding: 1.5rem;
`;

const Panel = styled.aside`
	min-width: 0;
	padding: 1.5rem;
	border-inline-start: 1px solid ${({ theme }) => theme.colors.border.default};
	overflow-wrap: anywhere;
	section > h2 {
		font-size: 1rem;
		margin-top: 0;
	}
	ol {
		list-style: none;
		margin: 1rem 0 0;
		padding: 0;
	}
	li {
		padding: 1rem 0;
		border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
	}
	li p {
		margin: 0 0 0.5rem;
	}
	time {
		font-size: 0.8rem;
	}
	@media (max-width: 960px) {
		border-inline-start: 0;
		border-top: 1px solid ${({ theme }) => theme.colors.border.default};
	}
`;
