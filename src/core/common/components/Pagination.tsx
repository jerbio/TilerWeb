import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react';
import palette from '@/core/theme/palette';
import Select from '@/core/common/components/select';

export const ITEMS_PER_PAGE_OPTIONS = [5, 10, 15, 20] as const;
export type ItemsPerPage = (typeof ITEMS_PER_PAGE_OPTIONS)[number];

export type PaginationProps = {
	page: number;
	totalPages?: number;
	onChange: (page: number) => void;
	siblingCount?: number;
	showFirstLast?: boolean;
	size?: 'small' | 'medium' | 'large';
	disabled?: boolean;
	pageSize?: ItemsPerPage;
	onPageSizeChange?: (size: ItemsPerPage) => void;
	/**
	 * 'numbered' (default) renders first/last + numbered page buttons and needs
	 * `totalPages`. 'simple' renders only Prev / page indicator / Next and relies
	 * on `hasNext` — for server-side paging where no total count is available.
	 */
	mode?: 'numbered' | 'simple';
	/** Simple mode: whether another page is available after the current one. */
	hasNext?: boolean;
	className?: string;
};

const ELLIPSIS = '…';

function buildPageRange(page: number, totalPages: number, siblingCount: number): (number | '…')[] {
	const totalShown = siblingCount * 2 + 5; // siblings + current + 2 edges + 2 ellipses

	if (totalPages <= totalShown) {
		return Array.from({ length: totalPages }, (_, i) => i + 1);
	}

	const leftSibling = Math.max(page - siblingCount, 2);
	const rightSibling = Math.min(page + siblingCount, totalPages - 1);

	const showLeftEllipsis = leftSibling > 2;
	const showRightEllipsis = rightSibling < totalPages - 1;

	const pages: (number | '…')[] = [1];

	if (showLeftEllipsis) {
		pages.push(ELLIPSIS);
	} else {
		for (let i = 2; i < leftSibling; i++) pages.push(i);
	}

	for (let i = leftSibling; i <= rightSibling; i++) pages.push(i);

	if (showRightEllipsis) {
		pages.push(ELLIPSIS);
	} else {
		for (let i = rightSibling + 1; i < totalPages; i++) pages.push(i);
	}

	pages.push(totalPages);
	return pages;
}

const Pagination: React.FC<PaginationProps> = ({
	page,
	totalPages = 0,
	onChange,
	siblingCount = 1,
	showFirstLast = true,
	size = 'medium',
	disabled = false,
	pageSize,
	onPageSizeChange,
	mode = 'numbered',
	hasNext = false,
	className,
}) => {
	const { t } = useTranslation();

	const pages = useMemo(
		() => buildPageRange(page, totalPages, siblingCount),
		[page, totalPages, siblingCount]
	);

	const isSimple = mode === 'simple';
	const showNav = isSimple ? true : totalPages > 1;
	const showPageSize = pageSize !== undefined && onPageSizeChange !== undefined;

	if (!showNav && !showPageSize) return null;

	const isFirst = page === 1;
	const isLast = page === totalPages;

	return (
		<Wrapper className={className}>
			{showPageSize && (
				<Select
					value={String(pageSize)}
					onChange={(value) => onPageSizeChange(Number(value) as ItemsPerPage)}
					options={ITEMS_PER_PAGE_OPTIONS.map((count) => ({
						value: String(count),
						label: `${count} / page`,
					}))}
					sized={size}
					disabled={disabled}
					aria-label="Items per page"
				/>
			)}
			{showNav && isSimple && (
				<Nav aria-label="Pagination">
					<PageButton
						$size={size}
						$active={false}
						disabled={disabled || isFirst}
						onClick={() => onChange(page - 1)}
						aria-label="Previous page"
					>
						<ChevronLeft size={iconSize(size)} />
					</PageButton>

					<PageIndicator $size={size}>
						{t('common.pagination.page', { page })}
					</PageIndicator>

					<PageButton
						$size={size}
						$active={false}
						disabled={disabled || !hasNext}
						onClick={() => onChange(page + 1)}
						aria-label="Next page"
					>
						<ChevronRight size={iconSize(size)} />
					</PageButton>
				</Nav>
			)}
			{showNav && !isSimple && (
				<Nav aria-label="Pagination">
					{showFirstLast && (
						<PageButton
							$size={size}
							$active={false}
							disabled={disabled || isFirst}
							onClick={() => onChange(1)}
							aria-label="First page"
						>
							<ChevronFirst size={iconSize(size)} />
						</PageButton>
					)}

					<PageButton
						$size={size}
						$active={false}
						disabled={disabled || isFirst}
						onClick={() => onChange(page - 1)}
						aria-label="Previous page"
					>
						<ChevronLeft size={iconSize(size)} />
					</PageButton>

					{pages.map((p, i) =>
						p === ELLIPSIS ? (
							<Ellipsis key={`ellipsis-${i}`} $size={size}>
								{ELLIPSIS}
							</Ellipsis>
						) : (
							<PageButton
								key={p}
								$size={size}
								$active={p === page}
								disabled={disabled}
								onClick={() => p !== page && onChange(p as number)}
								aria-label={`Page ${p}`}
								aria-current={p === page ? 'page' : undefined}
							>
								{p}
							</PageButton>
						)
					)}

					<PageButton
						$size={size}
						$active={false}
						disabled={disabled || isLast}
						onClick={() => onChange(page + 1)}
						aria-label="Next page"
					>
						<ChevronRight size={iconSize(size)} />
					</PageButton>

					{showFirstLast && (
						<PageButton
							$size={size}
							$active={false}
							disabled={disabled || isLast}
							onClick={() => onChange(totalPages)}
							aria-label="Last page"
						>
							<ChevronLast size={iconSize(size)} />
						</PageButton>
					)}
				</Nav>
			)}
		</Wrapper>
	);
};

const iconSize = (size: PaginationProps['size']) =>
	size === 'small' ? 12 : size === 'large' ? 16 : 14;

const buttonDimension = (size: PaginationProps['size']) =>
	size === 'small' ? '28px' : size === 'large' ? '40px' : '32px';

const Wrapper = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	width: 100%;
`;

const Nav = styled.nav`
	display: inline-flex;
	align-items: center;
	gap: 4px;
`;

const PageButton = styled.button<{ $size: PaginationProps['size']; $active: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: ${({ $size }) => buttonDimension($size)};
	height: ${({ $size }) => buttonDimension($size)};
	border-radius: ${palette.borderRadius.little};
	border: 1px solid
		${({ theme, $active }) =>
			$active ? theme.colors.pagination.borderActive : theme.colors.pagination.border};
	background: ${({ theme, $active }) =>
		$active ? theme.colors.pagination.bgActive : theme.colors.pagination.bg};
	color: ${({ theme, $active }) =>
		$active ? theme.colors.pagination.textActive : theme.colors.pagination.text};
	font-size: ${({ $size }) =>
		$size === 'small'
			? palette.typography.fontSize.xs
			: $size === 'large'
				? palette.typography.fontSize.base
				: palette.typography.fontSize.sm};
	font-weight: ${palette.typography.fontWeight.medium};
	cursor: pointer;
	transition:
		background 0.15s ease,
		border-color 0.15s ease,
		color 0.15s ease;
	line-height: 1;

	&:hover:not(:disabled) {
		background: ${({ theme, $active }) =>
			$active ? theme.colors.pagination.bgActive : theme.colors.pagination.bgHover};
	}

	&:disabled {
		color: ${({ theme }) => theme.colors.pagination.textDisabled};
		border-color: ${({ theme }) => theme.colors.pagination.border};
		background: ${({ theme }) => theme.colors.pagination.bg};
		cursor: not-allowed;
	}

	&:focus-visible {
		outline: 2px solid ${({ theme }) => theme.colors.border.strong};
		outline-offset: 2px;
	}
`;

const Ellipsis = styled.span<{ $size: PaginationProps['size'] }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: ${({ $size }) => buttonDimension($size)};
	height: ${({ $size }) => buttonDimension($size)};
	font-size: ${({ $size }) =>
		$size === 'small' ? palette.typography.fontSize.xs : palette.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.pagination.ellipsis};
	user-select: none;
`;

const PageIndicator = styled.span<{ $size: PaginationProps['size'] }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	height: ${({ $size }) => buttonDimension($size)};
	padding-inline: ${palette.space.small};
	font-size: ${({ $size }) =>
		$size === 'small' ? palette.typography.fontSize.xs : palette.typography.fontSize.sm};
	font-weight: ${palette.typography.fontWeight.medium};
	color: ${({ theme }) => theme.colors.pagination.text};
	white-space: nowrap;
	user-select: none;
`;

export default Pagination;
