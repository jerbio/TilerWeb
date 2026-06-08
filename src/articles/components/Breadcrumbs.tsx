import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router';
import palette from '@/core/theme/palette';

export interface BreadcrumbItem {
	label: string;
	href?: string;
}

interface BreadcrumbsProps {
	items: BreadcrumbItem[];
}

const Nav = styled.nav`
	width: 100%;
	max-width: 760px;
	margin: 0 auto;
`;

const List = styled.ol`
	list-style: none;
	padding: 0;
	margin: 0;
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
	font-family: ${palette.typography.fontFamily.inter};
	font-size: 0.8125rem;
	color: ${palette.colors.gray[500]};
`;

const Item = styled.li`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;

	&::after {
		content: '/';
		color: ${palette.colors.gray[700]};
		margin-left: 0.5rem;
	}

	&:last-child::after {
		content: none;
	}
`;

const Crumb = styled(Link)`
	color: ${palette.colors.gray[400]};
	text-decoration: none;
	transition: color 0.15s ease;

	&:hover {
		color: ${palette.colors.brand[400]};
	}
`;

const Current = styled.span`
	color: ${palette.colors.gray[300]};
`;

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => (
	<Nav aria-label="Breadcrumb">
		<List>
			{items.map((item, i) => {
				const isLast = i === items.length - 1;
				return (
					<Item key={`${item.label}-${i}`}>
						{item.href && !isLast ? (
							<Crumb to={item.href}>{item.label}</Crumb>
						) : (
							<Current aria-current={isLast ? 'page' : undefined}>
								{item.label}
							</Current>
						)}
					</Item>
				);
			})}
		</List>
	</Nav>
);

export default Breadcrumbs;
