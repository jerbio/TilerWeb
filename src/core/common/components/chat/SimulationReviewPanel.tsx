import React, { useMemo } from 'react';
import styled, { useTheme } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import Button from '@/core/common/components/button';
import useSimulationOverlayStore, { ReviewStop } from '@/core/state/simulationOverlayStore';
import useIsMobile from '@/core/common/hooks/useIsMobile';
import {
	SimulationDto,
	SimulationActionDto,
	SimulationScheduleResult,
	VibeAction,
	VibeRequest,
} from '@/core/common/types/chat';

interface SimulationReviewPanelProps {
	request: VibeRequest;
	simulation: SimulationDto;
	/**
	 * Lazy-loaded rendered schedule for this simulation. Phase 4 only needs
	 * the prop to be present (so re-entries don't re-fetch); Phase 5 will
	 * actually consume the contents to drive the calendar overlay.
	 */
	result: SimulationScheduleResult;
	selectedActionId: string | null;
	onSelect: (actionId: string) => void;
	onApply: () => void;
	onExitReview: () => void;
}

interface ReviewItem {
	action: VibeAction;
	previewAction?: SimulationActionDto;
}

const Panel = styled.section<{ $mobile?: boolean }>`
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: ${(p) => (p.$mobile ? '6px 4px 4px' : '12px')};
	border: ${(p) => (p.$mobile ? 'none' : '1px solid rgba(0, 0, 0, 0.12)')};
	border-radius: ${(p) => (p.$mobile ? '0' : '8px')};
`;

const Header = styled.header`
	display: flex;
	align-items: center;
	gap: 8px;
`;

const Stepper = styled.div`
	display: flex;
	align-items: center;
	gap: 6px;
	margin-left: auto;
`;

// Plan §5.3 — review panel rows. Brand indigo aligns with the per-tile
// primary tier accent in `calendar_event.tsx` and the chip wrapper in
// `ActionPill.tsx` so the user can visually trace one selection across all
// three surfaces.
const PANEL_BRAND = 'rgba(99,102,241,0.95)';
const PANEL_BRAND_SOFT = 'rgba(99,102,241,0.55)';

/**
 * Tap target for Prev/Next. Sized to the WCAG 2.5.5 minimum (44×44 dp)
 * because the previous ghost-text rendering was being mistaken for a
 * static label on touch devices. Square shape + chevron icon + visible
 * background reads unambiguously as a button.
 */
const StepIconButton = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	min-width: 36px;
	border-radius: 8px;
	border: 1px solid rgba(255, 255, 255, 0.18);
	background: rgba(255, 255, 255, 0.08);
	color: ${({ theme }) => theme.colors?.text ?? 'inherit'};
	cursor: pointer;
	transition:
		background 0.15s ease,
		border-color 0.15s ease,
		opacity 0.15s ease;
	&:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.16);
		border-color: rgba(255, 255, 255, 0.28);
	}
	&:active:not(:disabled) {
		background: rgba(255, 255, 255, 0.22);
	}
	&:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}
	&:focus-visible {
		outline: 2px solid ${PANEL_BRAND};
		outline-offset: 2px;
	}
`;

const StepPosition = styled.span`
	font-size: 12px;
	font-variant-numeric: tabular-nums;
	opacity: 0.75;
	min-width: 4ch;
	text-align: center;
	user-select: none;
`;

const List = styled.ol`
	list-style: none;
	padding: 0;
	margin: 0;
	display: flex;
	flex-direction: column;
	gap: 4px;
	max-height: 320px;
	overflow-y: auto;
`;

// Plan §5.3 — review panel rows. Brand indigo aligns with the per-tile
// primary tier accent in `calendar_event.tsx` and the chip wrapper in
// `ActionPill.tsx` so the user can visually trace one selection across all
// three surfaces.
const Row = styled.li<{ $selected: boolean; $reviewable: boolean; $navigatable: boolean }>`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 10px;
	border-radius: 6px;
	cursor: ${({ $navigatable }) => ($navigatable ? 'pointer' : 'default')};
	background: ${({ $selected }) => ($selected ? 'rgba(99, 102, 241, 0.12)' : 'transparent')};
	box-shadow: ${({ $selected, $reviewable }) =>
		$selected
			? `inset 3px 0 0 ${PANEL_BRAND}`
			: $reviewable
				? `inset 3px 0 0 ${PANEL_BRAND_SOFT}`
				: 'none'};
	transition:
		background 0.15s ease,
		box-shadow 0.15s ease;
	&:hover {
		background: ${({ $navigatable }) =>
			$navigatable ? 'rgba(99, 102, 241, 0.06)' : 'rgba(0, 0, 0, 0.04)'};
	}
`;

const RowBody = styled.div`
	flex: 1 1 auto;
	min-width: 0;
`;

const RowChevron = styled.span<{ $emphasized: boolean }>`
	display: inline-flex;
	align-items: center;
	color: ${({ $emphasized }) => ($emphasized ? PANEL_BRAND : 'rgba(255,255,255,0.45)')};
	flex-shrink: 0;
`;

const RowTitle = styled.div`
	font-size: 13px;
`;

const RowSubtext = styled.div`
	font-size: 11px;
	opacity: 0.7;
`;

const Footer = styled.footer`
	display: flex;
	gap: 8px;
	margin-top: 8px;
`;

/**
 * Mobile-only "current action" line shown in the peek/mid stops so the
 * user always knows which tile the calendar overlay is highlighting,
 * even when the full action list is collapsed away.
 */
const CurrentActionLine = styled.div`
	font-size: 13px;
	opacity: 0.85;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	flex: 1 1 auto;
	min-width: 0;
`;

/**
 * Drag-handle / cycle button at the top of the bottom sheet. Tapping it
 * advances peek → mid → full → peek. The grab-pill above it is a visual
 * affordance only.
 */
const CollapseToggle = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	min-width: 36px;
	border-radius: 8px;
	border: 1px solid rgba(255, 255, 255, 0.18);
	background: rgba(255, 255, 255, 0.08);
	color: inherit;
	cursor: pointer;
	transition:
		background 0.15s ease,
		border-color 0.15s ease;
	&:hover {
		background: rgba(255, 255, 255, 0.16);
		border-color: rgba(255, 255, 255, 0.28);
	}
	&:focus-visible {
		outline: 2px solid ${PANEL_BRAND};
		outline-offset: 2px;
	}
`;

const GrabPill = styled.div`
	width: 40px;
	height: 4px;
	border-radius: 2px;
	background: rgba(255, 255, 255, 0.25);
	margin: 0 auto 6px;
	cursor: pointer;
`;

/**
 * Phase 4 — Simulation Review Panel.
 *
 * Joins `request.actions` with `simulation.previewActions` by `actionId`
 * to produce a complete, ordered list of changes. Actions without a
 * matching `previewAction` are still rendered (they are still selectable)
 * with a clear "no simulated schedule item available" subtext, per spec.
 *
 * Selection is fully controlled by the parent via `selectedActionId` /
 * `onSelect` so the chip list, panel rows, calendar overlay, and stepper
 * all read from the same single source of truth (see plan §5.3).
 */
const SimulationReviewPanel: React.FC<SimulationReviewPanelProps> = ({
	request,
	simulation,
	selectedActionId,
	onSelect,
	onApply,
	onExitReview,
}) => {
	const { t } = useTranslation();
	const theme = useTheme();
	// Mobile-only collapsible bottom-sheet state. On desktop the panel
	// is part of the always-open right side panel and the collapse stop
	// is ignored — `effectiveStop` is forced to 'full' so all sections
	// render unconditionally.
	const isMobile = useIsMobile(parseInt(theme.screens.lg, 10));
	const reviewStop = useSimulationOverlayStore((s) => s.reviewStop);
	const cycleReviewStop = useSimulationOverlayStore((s) => s.cycleReviewStop);
	const effectiveStop: ReviewStop = isMobile ? reviewStop : 'full';
	const showHeader = effectiveStop !== 'hidden';
	const showStepperAndFooter = effectiveStop !== 'peek' && effectiveStop !== 'hidden';
	const showActionList = effectiveStop === 'full';

	const items = useMemo<ReviewItem[]>(() => {
		// Build chip-aligned item list. The status-strip chips are driven by
		// `simulation.previewActions`, so the panel must surface every
		// previewAction even when `vibeRequest.actions` is empty (which can
		// happen on the wire when the request was hydrated through a path
		// that doesn't serialize the action list). We start from
		// `request.actions` (preserving its order when present) and append
		// any previewAction whose source action is missing from it.
		const byActionId = new Map<string, SimulationActionDto>();
		for (const pa of simulation.previewActions ?? []) {
			const aid = pa.actionId ?? pa.action?.id;
			if (aid) byActionId.set(aid, pa);
		}
		const items: ReviewItem[] = [];
		const seen = new Set<string>();
		for (const action of request.actions ?? []) {
			items.push({ action, previewAction: byActionId.get(action.id) });
			seen.add(action.id);
		}
		for (const pa of simulation.previewActions ?? []) {
			const aid = pa.actionId ?? pa.action?.id;
			if (!aid || seen.has(aid) || !pa.action) continue;
			items.push({ action: pa.action, previewAction: pa });
			seen.add(aid);
		}
		return items;
	}, [request.actions, simulation.previewActions]);

	const selectedIndex = selectedActionId
		? items.findIndex((it) => it.action.id === selectedActionId)
		: -1;
	const canPrev = selectedIndex > 0;
	const canNext = selectedIndex < items.length - 1;

	const goPrev = () => {
		if (!canPrev) return;
		onSelect(items[selectedIndex - 1].action.id);
	};
	const goNext = () => {
		if (!canNext) return;
		const nextIndex = selectedIndex < 0 ? 0 : selectedIndex + 1;
		onSelect(items[nextIndex].action.id);
	};

	const noPreviewSubtext = t(
		'home.expanded.chat.reviewNoPreview',
		'No simulated schedule item available for this change.'
	);

	const currentItem = selectedIndex >= 0 ? items[selectedIndex] : items[0];
	const currentTitle = currentItem
		? currentItem.action.descriptions || currentItem.action.id
		: '';

	const collapseLabel = (() => {
		if (effectiveStop === 'hidden') return t('home.expanded.chat.expand', 'Expand');
		if (effectiveStop === 'peek') return t('home.expanded.chat.expand', 'Expand');
		if (effectiveStop === 'mid') return t('home.expanded.chat.expandMore', 'Expand more');
		return t('home.expanded.chat.collapse', 'Collapse');
	})();

	return (
		<Panel
			data-testid="simulation-review-panel"
			aria-label="Simulation review"
			$mobile={isMobile}
		>
			{isMobile && <GrabPill onClick={cycleReviewStop} aria-hidden="true" />}
			{showHeader && (
				<Header>
					{effectiveStop !== 'full' && currentItem ? (
						<CurrentActionLine title={currentTitle}>{currentTitle}</CurrentActionLine>
					) : (
						<strong>
							{t('home.expanded.chat.reviewSimulation', 'Review simulation')}
						</strong>
					)}
					{isMobile && (
						<CollapseToggle
							type="button"
							onClick={cycleReviewStop}
							aria-label={collapseLabel}
							title={collapseLabel}
							data-testid="review-collapse-toggle"
						>
							{effectiveStop === 'full' ? (
								<ChevronDown size={18} aria-hidden="true" />
							) : (
								<ChevronUp size={18} aria-hidden="true" />
							)}
						</CollapseToggle>
					)}
					{showStepperAndFooter && (
						<Stepper
							role="group"
							aria-label={t('home.expanded.chat.reviewSimulation', 'Review tilecast')}
						>
							<StepIconButton
								type="button"
								onClick={goPrev}
								disabled={!canPrev}
								aria-label={t('home.expanded.chat.previous', 'Previous')}
								title={t('home.expanded.chat.previous', 'Previous')}
								data-testid="review-prev-button"
							>
								<ChevronLeft size={18} aria-hidden="true" />
							</StepIconButton>
							<StepPosition aria-live="polite" aria-atomic="true">
								{items.length > 0
									? `${(selectedIndex < 0 ? 0 : selectedIndex) + 1} / ${items.length}`
									: '0 / 0'}
							</StepPosition>
							<StepIconButton
								type="button"
								onClick={goNext}
								disabled={!canNext}
								aria-label={t('home.expanded.chat.next', 'Next')}
								title={t('home.expanded.chat.next', 'Next')}
								data-testid="review-next-button"
							>
								<ChevronRight size={18} aria-hidden="true" />
							</StepIconButton>
						</Stepper>
					)}
				</Header>
			)}

			{showActionList && (
				<List role="list">
					{items.map((item) => {
						const selected = item.action.id === selectedActionId;
						const reviewable = !!item.previewAction;
						// Navigatable when the calendar can resolve and focus the
						// entity. RestrictionProfile / None types and entries
						// without an entityId can't be navigated to.
						const navigatable =
							reviewable &&
							!!item.previewAction?.entityId &&
							!!item.previewAction?.entityType &&
							item.previewAction.entityType !== 'None' &&
							item.previewAction.entityType !== 'RestrictionProfile';
						return (
							<Row
								key={item.action.id}
								role="listitem"
								aria-current={selected ? 'true' : undefined}
								$selected={selected}
								$reviewable={reviewable}
								$navigatable={navigatable}
								onClick={() => onSelect(item.action.id)}
							>
								<RowBody>
									<RowTitle>
										{item.action.descriptions || item.action.id}
									</RowTitle>
									{!item.previewAction && (
										<RowSubtext>{noPreviewSubtext}</RowSubtext>
									)}
								</RowBody>
								{navigatable && (
									<RowChevron
										$emphasized={selected}
										aria-hidden="true"
										title="Navigate to tile"
									>
										<ChevronRight size={16} strokeWidth={2.25} />
									</RowChevron>
								)}
							</Row>
						);
					})}
				</List>
			)}

			{showStepperAndFooter && (
				<Footer>
					<Button variant="primary" onClick={onApply}>
						{t('home.expanded.chat.applyNow', 'Apply now')}
					</Button>
					<Button variant="ghost" onClick={onExitReview}>
						{t('home.expanded.chat.exitReview', 'Exit review')}
					</Button>
				</Footer>
			)}
		</Panel>
	);
};

export default SimulationReviewPanel;
