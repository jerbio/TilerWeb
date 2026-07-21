import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Routes } from '@/core/constants/routes';

type TileshareDetailBreadcrumbProps = {
	/** Name of the current tileshare, shown as the active crumb. */
	current: string;
};

const TileshareDetailBreadcrumb: React.FC<TileshareDetailBreadcrumbProps> = ({ current }) => {
	const { t } = useTranslation();

	return (
		<Nav aria-label="Breadcrumb">
			<Root to={Routes.Tileshare.root}>{t('tilesharedemo.detail.breadcrumbRoot')}</Root>
			<Separator aria-hidden>/</Separator>
			<Current aria-current="page">{current}</Current>
		</Nav>
	);
};

const Nav = styled.nav`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const Root = styled(Link)`
	color: ${({ theme }) => theme.colors.text.muted};
	text-decoration: none;
	transition: color 0.15s ease;

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

export default TileshareDetailBreadcrumb;
