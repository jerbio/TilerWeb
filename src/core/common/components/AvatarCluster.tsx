import React from 'react';
import styled from 'styled-components';
import { useTheme } from 'styled-components';
import type { AppTheme } from '@/core/theme/types';

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

const AvatarCluster: React.FC<AvatarClusterProps> = ({
	users,
	max = 3,
	size = 32,
	className,
	renderWrapper,
}) => {
	const theme = useTheme() as AppTheme;
	const COLORS = [
		theme.colors.brand[500],
		theme.colors.purple[500],
		theme.colors.teal[500],
		theme.colors.indigo[500],
	];

	const visible = users.slice(0, max);
	const overflow = users.length - max;

	return (
		<Cluster className={className}>
			{visible.map((user, i) => {
				const avatar = (
					<Avatar key={i} $bg={COLORS[i % COLORS.length]} $size={size} $index={i}>
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

const Avatar = styled.div<{ $bg: string; $size: number; $index: number }>`
	width: ${({ $size }) => $size}px;
	height: ${({ $size }) => $size}px;
	border-radius: 50%;
	background-color: ${({ $bg }) => $bg};
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
	color: ${({ theme }) => theme.colors.white};
	margin-left: ${({ $index, $size }) => ($index === 0 ? 0 : -Math.floor($size / 3))}px;
	border: 2px solid ${({ theme }) => theme.colors.background.card};
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
