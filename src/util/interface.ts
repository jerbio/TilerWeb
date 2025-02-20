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
}

export interface Highlight {
	subHeader: string;
	header: string;
	body: string;
	backgroundImage: string;
}
