import React from 'react';
import styled from 'styled-components';
import { useTheme } from '@/core/theme/ThemeProvider';
import colorUtil, { RGB } from '@/core/util/colors';

export type AvatarUser = {
	name: string | null;
	email?: string | null;
};

type AvatarClusterProps = {
	users: AvatarUser[];
	max?: number;
	size?: number;
	className?: string;
	renderWrapper?: (user: AvatarUser, index: number, avatar: React.ReactNode) => React.ReactNode;
};

function getInitials(name: string | null): string {
	if (!name) return '?';
	const parts = name.trim().split(' ');
	if (parts.length === 1) return parts[0][0].toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const COLORS: RGB[] = [
	{ r: 124, g: 212, b: 253 }, // bluelight[300] — sky blue
	{ r: 189, g: 180, b: 254 }, // purple[300]    — lavender
	{ r: 110, g: 237, b: 231 }, // teal[200]      — seafoam
	{ r: 250, g: 167, b: 224 }, // pink[300]      — soft pink
];

const AvatarCluster: React.FC<AvatarClusterProps> = ({
	users,
	max = 3,
	size = 32,
	className,
	renderWrapper,
}) => {
	const { isDarkMode } = useTheme();

	const visible = users.slice(0, max);
	const overflow = users.length - max;

	return (
		<Cluster className={className}>
			{visible.map((user, i) => {
				const avatar = (
					<Avatar
						key={i}
						$colors={COLORS[i % COLORS.length]}
						$darkmode={isDarkMode}
						$size={size}
						$index={i}
					>
						{getInitials(user.name)}
					</Avatar>
				);
				return renderWrapper ? renderWrapper(user, i, avatar) : avatar;
			})}
			{overflow > 0 && <OverflowBadge $size={size}>+{overflow}</OverflowBadge>}
		</Cluster>
	);
};

const Cluster = styled.div`
	display: flex;
	align-items: center;
`;

const Avatar = styled.div<{ $colors: RGB; $darkmode: boolean; $size: number; $index: number }>`
	width: ${({ $size }) => $size}px;
	height: ${({ $size }) => $size}px;
	border-radius: 50%;
	background-color: ${({ $colors, $darkmode }) => {
		const c = colorUtil.setLightness($colors, $darkmode ? 0.25 : 0.9);
		return `rgb(${c.r}, ${c.g}, ${c.b})`;
	}};
	color: ${({ $colors, $darkmode }) => {
		const c = colorUtil.setLightness($colors, $darkmode ? 0.85 : 0.28);
		return `rgb(${c.r}, ${c.g}, ${c.b})`;
	}};
	border: 2px solid
		${({ $colors, $darkmode, theme }) => {
			if ($darkmode) {
				const c = colorUtil.setLightness($colors, 0.45);
				return `rgb(${c.r}, ${c.g}, ${c.b})`;
			}
			return theme.colors.background.card;
		}};
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
	margin-left: ${({ $index, $size }) => ($index === 0 ? 0 : -Math.floor($size / 3))}px;
	flex-shrink: 0;
`;

const OverflowBadge = styled.div<{ $size: number }>`
	width: ${({ $size }) => $size}px;
	height: ${({ $size }) => $size}px;
	border-radius: 50%;
	background-color: ${({ theme }) => theme.colors.background.card2};
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
	color: ${({ theme }) => theme.colors.text.secondary};
	margin-left: ${({ $size }) => -Math.floor($size / 3)}px;
	border: 2px solid ${({ theme }) => theme.colors.background.card};
	flex-shrink: 0;
`;

export default AvatarCluster;
