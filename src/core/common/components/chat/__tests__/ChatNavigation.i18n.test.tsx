import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import { CalendarRequestProvider } from '../../calendar/CalendarRequestProvider';
import { Actions, Status } from '@/core/constants/enums';
import {
	SimulationState,
	type VibeAction,
	type VibeRequest,
	type SimulationDto,
} from '@/core/common/types/chat';
import ActionPill from '../ActionPill';
import BackToChatButton from '../BackToChatButton';
import { CALENDAR_OVERLAY_CONTAINER_ID } from '../StatusOverlay';

vi.mock('@/global_state', () => ({
	default: (selector: (state: unknown) => unknown) =>
		selector({ getActivePersonaSession: () => ({ scheduleId: 'current' }) }),
}));

type ChatLabels = {
	backToChat: string;
	goToTile: string;
	goToTileAction: string;
	reviewWhenReady: string;
};
type Locale = { home: { expanded: { chat: ChatLabels } } };
const locales = import.meta.glob<{ default: Locale }>('../../../../../i18n/locales/*.json', {
	eager: true,
});

describe('chat navigation translations', () => {
	for (const [file, resource] of Object.entries(locales)) {
		const language = file.split('/').pop()!.replace('.json', '');
		it(`renders labels, tooltips, and pending-review text in ${language} without fallback`, async () => {
			const i18n = createInstance();
			await i18n.init({
				lng: language,
				fallbackLng: false,
				resources: { [language]: { translation: resource.default } },
				interpolation: { escapeValue: false },
			});
			const action: VibeAction = {
				id: 'edit-soccer',
				descriptions: 'Soccer',
				type: Actions.Update_Existing_Task,
				status: Status.Pending,
				creationTimeInMs: 1,
				entityId: 'soccer',
				entityType: 'CalendarEvent',
				beforeScheduleId: 'current',
				afterScheduleId: null,
				vibeRequest: null,
			};
			const request: VibeRequest = {
				id: 'request-1',
				creationTimeInMs: 1,
				activeAction: action.id,
				isClosed: false,
				beforeScheduleId: 'current',
				afterScheduleId: null,
				actions: [action],
			};
			const simulation: SimulationDto = {
				id: 'preview-1',
				vibeRequestId: request.id,
				tilerUserId: 'user-1',
				creationTimeInMs: 1,
				state: SimulationState.Processing,
			};
			const labels = resource.default.home.expanded.chat;
			render(
				<I18nextProvider i18n={i18n}>
					<ThemeProvider>
						<CalendarRequestProvider>
							<div id={CALENDAR_OVERLAY_CONTAINER_ID} />
							<BackToChatButton onReturn={vi.fn()} />
							<ActionPill
								action={action}
								request={request}
								simulation={simulation}
								onSelect={vi.fn()}
							/>
						</CalendarRequestProvider>
					</ThemeProvider>
				</I18nextProvider>
			);
			expect(screen.getByRole('button', { name: labels.backToChat })).toBeInTheDocument();
			const navigate = screen.getByRole('button', {
				name: labels.goToTileAction.replace('{{description}}', 'Soccer'),
			});
			expect(navigate).toHaveAttribute('title', labels.goToTile);
			fireEvent.click(screen.getByRole('button', { name: 'Soccer' }));
			expect(screen.getByText(labels.reviewWhenReady)).toBeInTheDocument();
		});
	}
});
