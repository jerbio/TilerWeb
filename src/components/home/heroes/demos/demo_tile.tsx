/**
 * The tile used by every hero demo.
 *
 * Geometry and colour derivation are lifted from
 * `core/common/components/calendar/calendar_event.tsx` rather than re-invented:
 * the tile is the most recognisable surface in the product, and a demo tile that
 * reads as foreign makes the hero a promise the app does not keep.
 *
 * Kept as a separate presentational component because the real one is bound to
 * calendar state, drag handlers, and simulation tiers that a static demo has no
 * use for.
 */

import React from 'react';
import styled, { css } from 'styled-components';
import colorUtil, { type RGB } from '@/core/util/colors';
import palette from '@/core/theme/palette';

export type DemoTileState = 'settled' | 'moved' | 'placed' | 'ghost';

export type DemoTileProps = {
	title: string;
	time?: string;
	note?: string;
	colors: RGB;
	state?: DemoTileState;
	className?: string;
};

export const tileRgb = (value: RGB, lightness: number): string => {
	const c = colorUtil.setLightness(value, lightness);
	return `rgb(${c.r}, ${c.g}, ${c.b})`;
};

const rgb = tileRgb;

/**
 * The product tile's surface, in one place.
 *
 * Shared so the timeline blocks and the stacked tiles cannot drift apart — the
 * lightness stops are the ones `calendar_event.tsx` uses in dark mode.
 */
export const tileSurfaceCss = css<{ $colors: RGB }>`
	background-color: ${({ $colors }) => rgb($colors, 0.325)};
	color: ${({ $colors }) => rgb($colors, 0.85)};
	border: 1px solid ${({ $colors }) => rgb($colors, 0.1)};
	border-radius: 10px;
`;

const Outer = styled.div`
	padding: 4px;
	width: 100%;
	border-radius: ${palette.borderRadius.large};
`;

const Surface = styled.div<{ $colors: RGB; $state: DemoTileState }>`
	background-color: ${({ $colors }) => rgb($colors, 0.325)};
	color: ${({ $colors }) => rgb($colors, 0.85)};
	border: 1px solid ${({ $colors }) => rgb($colors, 0.1)};
	padding: 7px 8px;
	border-radius: 10px;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	gap: 2px;
	overflow: hidden;
	transition:
		transform 200ms ease,
		opacity 200ms ease;

	${({ $state }) =>
		$state === 'ghost' &&
		`
		opacity: 0.45;
		border-style: dashed;
	`}

	${({ $state }) => $state === 'placed' && `box-shadow: inset 0 0 0 2px currentColor;`}

	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`;

const Title = styled.h3`
	margin: 0;
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.sm};
	font-weight: ${palette.typography.fontWeight.semibold};
	line-height: ${palette.typography.lineHeight.xs};
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

const Meta = styled.p<{ $colors: RGB }>`
	margin: 0;
	display: flex;
	gap: 0.5ch;
	align-items: center;
	color: ${({ $colors }) => rgb($colors, 0.7)};
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.xxs};
	font-weight: ${palette.typography.fontWeight.semibold};
	white-space: nowrap;
`;

const DemoTile: React.FC<DemoTileProps> = ({
	title,
	time,
	note,
	colors,
	state = 'settled',
	className,
}) => (
	<Outer className={className}>
		<Surface $colors={colors} $state={state} data-tile-state={state}>
			<Title>{title}</Title>
			{(time || note) && (
				<Meta $colors={colors}>
					{time}
					{time && note ? ' · ' : ''}
					{note}
				</Meta>
			)}
		</Surface>
	</Outer>
);

/**
 * Muted lilac-family hues fed through the product tile's own lightness derivation.
 *
 * The app assigns tile colours at random, so a demo using fully saturated brand
 * hues is technically faithful but reads as noise next to five other tiles. These
 * hold the hue at roughly a third of the saturation, which keeps the displacement
 * choreography — ghosts, trails, the late badge — legible against them.
 *
 * Amber is reserved for disruption, so nothing else in the set goes warm.
 */
export const DEMO_TILE_COLORS = {
	work: { r: 166, g: 89, b: 143 },
	focus: { r: 105, g: 89, b: 166 },
	personal: { r: 89, g: 98, b: 166 },
	admin: { r: 166, g: 139, b: 89 },
} as const satisfies Record<string, RGB>;

export default DemoTile;
