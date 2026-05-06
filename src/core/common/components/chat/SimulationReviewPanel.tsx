import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import Button from '@/core/common/components/button';
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

const Panel = styled.section`
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 12px;
	border: 1px solid rgba(0, 0, 0, 0.12);
	border-radius: 8px;
`;

const Header = styled.header`
	display: flex;
	align-items: center;
	gap: 8px;
`;

const Stepper = styled.div`
	display: flex;
	gap: 4px;
	margin-left: auto;
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
const PANEL_BRAND = 'rgba(99,102,241,0.95)';
const PANEL_BRAND_SOFT = 'rgba(99,102,241,0.55)';

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

	return (
		<Panel data-testid="simulation-review-panel" aria-label="Simulation review">
			<Header>
				<strong>{t('home.expanded.chat.reviewSimulation', 'Review simulation')}</strong>
				<Stepper>
					<Button variant="ghost" height={28} onClick={goPrev} disabled={!canPrev}>
						{t('home.expanded.chat.previous', 'Previous')}
					</Button>
					<Button variant="ghost" height={28} onClick={goNext} disabled={!canNext}>
						{t('home.expanded.chat.next', 'Next')}
					</Button>
				</Stepper>
			</Header>

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
								<RowTitle>{item.action.descriptions || item.action.id}</RowTitle>
								{!item.previewAction && <RowSubtext>{noPreviewSubtext}</RowSubtext>}
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

			<Footer>
				<Button variant="primary" onClick={onApply}>
					{t('home.expanded.chat.applyNow', 'Apply now')}
				</Button>
				<Button variant="ghost" onClick={onExitReview}>
					{t('home.expanded.chat.exitReview', 'Exit review')}
				</Button>
			</Footer>
		</Panel>
	);
};

export default SimulationReviewPanel;
