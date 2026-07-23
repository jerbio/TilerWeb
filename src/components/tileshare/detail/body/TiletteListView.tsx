import React from 'react';
import styled from 'styled-components';
import { TileShareTemplate } from '@/core/common/types/tileshare';
import TiletteRow from './TiletteRow';

type TiletteListViewProps = {
	tilettes: TileShareTemplate[];
	clusterId: string;
};

/** List view body: one row per tilette. The count + toggle live in TiletteBody. */
const TiletteListView: React.FC<TiletteListViewProps> = ({ tilettes, clusterId }) => (
	<List>
		{tilettes.map((tilette) => (
			<TiletteRow key={tilette.id} tilette={tilette} clusterId={clusterId} />
		))}
	</List>
);

const List = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

export default TiletteListView;
