import React from 'react';
import styled from 'styled-components';
import { TileShareTemplate } from '@/core/common/types/tileshare';
import TiletteRow from './TiletteRow';
import PaginationFooter from './PaginationFooter';
import { useTranslation } from 'react-i18next';

type TiletteListViewProps = {
	/** The tilettes visible on the current page. */
	tilettes: TileShareTemplate[];
	clusterId: string;
	showFooter: boolean;
	hasPrev: boolean;
	hasNext: boolean;
	onPrev: () => void;
	onNext: () => void;
};

/** List view body: one row per tilette. The count + toggle live in TiletteBody. */
const TiletteListView: React.FC<TiletteListViewProps> = ({
	tilettes,
	clusterId,
	showFooter,
	hasPrev,
	hasNext,
	onPrev,
	onNext,
}) => {
	const { t } = useTranslation();
	return (
		<Wrap>
			<Surface>
				<Columns aria-hidden="true">
					<span>{t('tileShareDensity.task', 'Tilette')}</span>
					<span>{t('tilesharePreview.progress', 'Completion')}</span>
					<span>{t('tileShareDensity.people', 'People')}</span>
					<span>{t('tileShareDensity.response', 'Response')}</span>
					<span />
				</Columns>
				<List role="list">
					{tilettes.map((tilette) => (
						<TiletteRow key={tilette.id} tilette={tilette} clusterId={clusterId} />
					))}
				</List>
			</Surface>
			{showFooter && (
				<PaginationFooter
					hasPrev={hasPrev}
					hasNext={hasNext}
					onPrev={onPrev}
					onNext={onNext}
				/>
			)}
		</Wrap>
	);
};

const Wrap = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
`;

const List = styled.div`
	display: flex;
	flex-direction: column;
`;
const Surface = styled.div`
	container-type: inline-size;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: 12px;
	background: ${({ theme }) => theme.colors.background.card};
`;
const Columns = styled.div`
	display: none;
	@container (min-width:820px) {
		display: grid;
		grid-template-columns: minmax(180px, 1fr) 138px 64px 216px 32px;
		gap: 12px;
		padding: 10px 16px;
		font-size: 12px;
		color: ${({ theme }) => theme.colors.text.secondary};
		border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
	}
`;

export default TiletteListView;
