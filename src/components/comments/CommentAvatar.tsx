import React from 'react';
import styled from 'styled-components';
import type { ColorScaleHue } from '@/core/theme/types';

type CommentAvatarProps = {
	id: string | null;
	name: string | null;
	size?: 'md' | 'sm';
	/** Rings the avatar so it reads clearly when stacked on others. */
	stacked?: boolean;
};

const HUES: ColorScaleHue[] = ['teal', 'purple', 'orange', 'blue', 'pink', 'indigo', 'warning'];

export function initialsOf(name: string | null): string {
	const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
	if (words.length === 0) return '?';
	return words
		.slice(0, 2)
		.map((w) => w[0].toUpperCase())
		.join('');
}

function hueOf(id: string | null): ColorScaleHue {
	let hash = 0;
	for (const ch of id ?? '') hash = (hash * 31 + ch.charCodeAt(0)) | 0;
	return HUES[Math.abs(hash) % HUES.length];
}

/** Initials avatar with a stable per-user color; accounts have no profile image. */
const CommentAvatar: React.FC<CommentAvatarProps> = ({ id, name, size = 'md', stacked }) => (
	<Circle
		data-testid="comment-avatar"
		aria-hidden="true"
		$hue={hueOf(id)}
		$size={size}
		$stacked={stacked}
	>
		{initialsOf(name)}
	</Circle>
);

const Circle = styled.span<{ $hue: ColorScaleHue; $size: 'md' | 'sm'; $stacked?: boolean }>`
	flex-shrink: 0;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: ${({ $size }) => ($size === 'md' ? '2rem' : '1.25rem')};
	height: ${({ $size }) => ($size === 'md' ? '2rem' : '1.25rem')};
	border-radius: 50%;
	font-size: ${({ $size }) => ($size === 'md' ? '0.75rem' : '0.5625rem')};
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
	color: ${({ theme, $hue }) => theme.colors[$hue][50]};
	background-color: ${({ theme, $hue }) => theme.colors[$hue][700]};
	box-shadow: ${({ theme, $stacked }) =>
		$stacked ? `0 0 0 2px ${theme.colors.background.page}` : 'none'};
	user-select: none;
`;

export default CommentAvatar;
