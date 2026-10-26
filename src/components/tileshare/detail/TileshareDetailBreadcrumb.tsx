import React from 'react';
import styled, { keyframes } from 'styled-components';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Routes } from '@/core/constants/routes';

type TileshareDetailBreadcrumbProps = {
	/** Name of the current tileshare, shown as the active crumb. */
	current: string;
	/** Optional intermediate crumb (e.g. the parent multi cluster) linking back. */
	parent?: { label: string; href: string };
	/** While true, dynamic crumbs render as shimmer placeholders instead of text. */
	loading?: boolean;
};

const TileshareDetailBreadcrumb: React.FC<TileshareDetailBreadcrumbProps> = ({
	current,
	parent,
	loading,
}) => {
	const { t } = useTranslation();

	return (
		<Nav aria-label="Breadcrumb">
			<Crumb to={Routes.Tileshare.root}>{t('tilesharedemo.detail.breadcrumbRoot')}</Crumb>
			<Separator aria-hidden>/</Separator>
			{parent && (
				<>
					{loading ? (
						<Skeleton $width="7rem" aria-hidden />
					) : (
						<Crumb to={parent.href}>{parent.label}</Crumb>
					)}
					<Separator aria-hidden>/</Separator>
				</>
			)}
			{loading ? (
				<Skeleton $width="9rem" aria-hidden />
			) : (
				<Current aria-current="page">{current}</Current>
			)}
		</Nav>
	);
};

const Nav = styled.nav`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const Crumb = styled(Link)`
	color: ${({ theme }) => theme.colors.text.muted};
	text-decoration: none;
	transition: color 0.15s ease;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;

	&:hover {
		color: ${({ theme }) => theme.colors.text.secondary};
	}
`;

const Separator = styled.span`
	color: ${({ theme }) => theme.colors.text.muted};
`;

const Current = styled.span`
	color: ${({ theme }) => theme.colors.text.primary};
	text-decoration: underline;
	text-decoration-color: ${({ theme }) => theme.colors.text.muted};
	text-underline-offset: 3px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const shimmer = keyframes`
	0%   { background-position: 200% 0; }
	100% { background-position: -200% 0; }
`;

const Skeleton = styled.span<{ $width: string }>`
	display: inline-block;
	width: ${({ $width }) => $width};
	height: 0.85em;
	border-radius: ${({ theme }) => theme.borderRadius.small};
	background: linear-gradient(
		90deg,
		${({ theme }) => theme.colors.skeleton.base} 25%,
		${({ theme }) => theme.colors.skeleton.highlight} 50%,
		${({ theme }) => theme.colors.skeleton.base} 75%
	);
	background-size: 200% 100%;
	animation: ${shimmer} 2.4s ease-in-out infinite;
`;

export default TileshareDetailBreadcrumb;
