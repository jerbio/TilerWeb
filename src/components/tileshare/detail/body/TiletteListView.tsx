import React from 'react';
import styled from 'styled-components';
import { TileShareTemplate } from '@/core/common/types/tileshare';
import TiletteRow from './TiletteRow';
import PaginationFooter from './PaginationFooter';

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
}) => (
	<Wrap>
		<List>
			{tilettes.map((tilette) => (
				<TiletteRow key={tilette.id} tilette={tilette} clusterId={clusterId} />
			))}
		</List>
		{showFooter && (
			<PaginationFooter hasPrev={hasPrev} hasNext={hasNext} onPrev={onPrev} onNext={onNext} />
		)}
	</Wrap>
);

const Wrap = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
`;

const List = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

export default TiletteListView;
