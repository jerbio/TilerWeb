export interface Tile {
	id: string;
	name: string;
}

export interface TileCardProps {
	heading: string;
	location: string;
	startTime: string;
	endTime: string;
	background_color: string;
	style?: React.CSSProperties;
	index?: number;
}

export interface Highlight {
	subHeader: string;
	header: string;
	body: string;
	backgroundImage: string;
}
