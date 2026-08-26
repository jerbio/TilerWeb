/**
 * Shared frame for the demo panel.
 *
 * Fixes the panel's height so every arm occupies the same vertical space no
 * matter how many tiles its scenario ends up showing. Without this the fold
 * would sit at a different place per arm, and each arm would be measured
 * against a subtly different page.
 */

import styled from 'styled-components';
import palette from '@/core/theme/palette';

export const DemoPanel = styled.div`
	width: 100%;
	max-width: 460px;
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding: ${palette.space.small};
	border-radius: ${palette.borderRadius.xLarge};
	border: 1px solid ${palette.colors.gray[800]};
	background: ${palette.colors.gray[900]};
`;

export const DemoHeader = styled.div`
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 8px;
`;

export const DemoLabel = styled.p`
	margin: 0;
	color: ${palette.colors.gray[400]};
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.xs};
	font-weight: ${palette.typography.fontWeight.semibold};
	letter-spacing: 0.06em;
	text-transform: uppercase;
`;

export const DemoStatus = styled.span`
	color: ${palette.colors.purple[300]};
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.xs};
	font-weight: ${palette.typography.fontWeight.semibold};
`;

/** Holds a constant height so tiles appearing mid-scenario cannot shift the fold. */
export const DemoStage = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
	min-height: 200px;
`;

export const DemoRow = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
`;

export const DemoRowLabel = styled.span`
	flex: 0 0 44px;
	color: ${palette.colors.gray[500]};
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.xxs};
	font-weight: ${palette.typography.fontWeight.semibold};
	text-transform: uppercase;
`;

export const DemoCaption = styled.p`
	margin: 0;
	color: ${palette.colors.gray[500]};
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.xxs};
`;
