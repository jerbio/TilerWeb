import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Bottom padding of the detail page's scroll container (TileshareDetailPage).
 * A sticky `bottom: 0` parks above that padding, leaving a visible strip under
 * the footer, so the footer bleeds down over it instead.
 */
const PAGE_PADDING_BOTTOM = '1.5rem';

type PaginationFooterProps = {
	hasPrev: boolean;
	hasNext: boolean;
	onPrev: () => void;
	onNext: () => void;
};

/** Prev/Next footer shared by the tilette list and the assignee board. */
const PaginationFooter: React.FC<PaginationFooterProps> = ({
	hasPrev,
	hasNext,
	onPrev,
	onNext,
}) => {
	const { t } = useTranslation();

	return (
		<Footer>
			<PageButton type="button" onClick={onPrev} disabled={!hasPrev}>
				<ChevronLeft size={18} />
				{t('tilesharedemo.detail.prev')}
			</PageButton>
			<PageButton type="button" onClick={onNext} disabled={!hasNext}>
				{t('tilesharedemo.detail.next')}
				<ChevronRight size={18} />
			</PageButton>
		</Footer>
	);
};

const Footer = styled.div`
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 1.5rem;
	/* Stays visible at the bottom of the scrolling page while a long list
	   scrolls past underneath it. The negative offset + matching padding sink it
	   through the page's bottom padding so it sits flush with the page edge,
	   and the negative margin keeps that extra padding out of the flow height. */
	position: sticky;
	bottom: -${PAGE_PADDING_BOTTOM};
	margin-bottom: -${PAGE_PADDING_BOTTOM};
	z-index: 1;
	padding: 0.75rem 0 calc(0.75rem + ${PAGE_PADDING_BOTTOM});
	background-color: ${({ theme }) => theme.colors.background.page};
`;

const PageButton = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 0.375rem;
	background: transparent;
	border: none;
	padding: 0.25rem 0.25rem;
	cursor: pointer;
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	color: ${({ theme }) => theme.colors.text.primary};
	transition: opacity 0.15s ease;

	&:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
`;

export default PaginationFooter;
