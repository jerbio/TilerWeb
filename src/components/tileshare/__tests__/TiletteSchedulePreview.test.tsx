import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { ThemeProvider } from 'styled-components';
import { darkTheme } from '@/core/theme/dark';
import { lightTheme } from '@/core/theme/light';
import { setupUser } from '@/test/test-utils';
import TiletteSchedulePreview, {
	dayKey,
	formatPreviewInstant,
	layoutPreviewDay,
	safeTimeZone,
} from '../TiletteSchedulePreview';
import { TileSharePreview, TileSharePreviewBlock } from '@/core/common/types/tilesharePreview';
const mocks = vi.hoisted(() => ({
	preview: vi.fn(),
	options: vi.fn(),
	revise: vi.fn(),
	accept: vi.fn(),
	operation: vi.fn(),
	respond: vi.fn(),
}));
vi.mock('@/api/tileshareApi', () => ({
	TileshareApi: class {
		previewAssignment = mocks.preview;
		getPreviewOptions = mocks.options;
		revisePreview = mocks.revise;
		acceptAssignment = mocks.accept;
		getAssignmentResponse = mocks.operation;
		respondToInvitation = mocks.respond;
	},
}));
vi.mock('@/services/SocketService', () => ({
	Hubs: {
		TileShareSchedule: {
			name: 'schedule',
			events: { ResponseChanged: 'changed', Connected: 'connected' },
		},
	},
	SignalRService: class {
		subscribe() {}
		createConnection() {}
		dispose() {}
	},
}));
vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (_: string, fallback: string) => fallback,
		i18n: { language: 'en-US' },
	}),
}));
beforeAll(() => {
	HTMLDialogElement.prototype.showModal = function () {
		this.setAttribute('open', '');
	};
	HTMLDialogElement.prototype.close = function () {
		this.removeAttribute('open');
	};
});
vi.mock('@/core/auth/useAuth', () => ({ useAuth: () => ({ user: { id: 'viewer' } }) }));
beforeEach(() => {
	vi.clearAllMocks();
	sessionStorage.clear();
});
const start = Date.parse('2026-09-30T09:00:00Z');
const session: TileSharePreviewBlock = {
	id: 'session',
	name: 'Review API',
	start,
	end: start + 3600000,
	isProposed: true,
	viable: true,
};
const preview: TileSharePreview = {
	assignmentId: 'mine',
	tiletteId: 'tilette',
	clusterId: 'cluster',
	name: 'Review API',
	description: 'Review work',
	duration: 3600000,
	generatedAt: start - 3600000,
	deadline: start + 86400000,
	rangeStart: start - 86400000,
	rangeEnd: start + 86400000 * 28,
	timeZone: 'UTC',
	unsupportedReason: null,
	isViable: true,
	capabilities: { alternatives: false, fixedSessions: false, reviewedAcceptance: false },
	current: [
		{
			...session,
			id: 'existing',
			name: 'Existing meeting',
			isProposed: false,
			start: start - 3600000,
			end: start,
		},
	],
	proposed: [session],
	sessions: [session],
};
const wrapper = ({ children }: { children: React.ReactNode }) => (
	<MemoryRouter>
		<ThemeProvider theme={darkTheme}>{children}</ThemeProvider>
	</MemoryRouter>
);
describe('tilette schedule preview', () => {
	it('fetches only on explicit expansion and compares the returned snapshots without another request', async () => {
		mocks.preview.mockResolvedValue(preview);
		render(<TiletteSchedulePreview assignmentId="mine" name="Review API" />, { wrapper });
		expect(mocks.preview).not.toHaveBeenCalled();
		await setupUser().click(screen.getByRole('button', { name: 'Preview schedule' }));
		await screen.findByRole('dialog', { name: 'Tilette preview' });
		await screen.findByRole('region', { name: 'Selected schedule' });
		expect(mocks.preview).toHaveBeenCalledTimes(1);
		await setupUser().click(screen.getByRole('button', { name: /^Current$/ }));
		expect(screen.getByText('Existing meeting')).toBeInTheDocument();
		expect(mocks.preview).toHaveBeenCalledTimes(1);
		await setupUser().click(screen.getByRole('button', { name: 'Close preview' }));
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Preview schedule' })).toHaveFocus();
	});

	it('selects a complete alternative without another forecast and locks only the highlighted session on acceptance', async () => {
		const second = {
			...session,
			id: 'second',
			sessionKey: '1',
			start: start + 7200000,
			end: start + 10800000,
		};
		const enabled = {
			...preview,
			previewToken: 'initial',
			capabilities: { alternatives: true, fixedSessions: true, reviewedAcceptance: true },
			sessions: [{ ...session, sessionKey: '0' }, second],
		};
		const moved = { ...second, id: 'moved', start: start + 14400000, end: start + 18000000 };
		const alternative = {
			...enabled,
			previewToken: 'option',
			sessions: [{ ...session, sessionKey: '0' }, moved],
			proposed: [session, moved],
		};
		mocks.preview.mockResolvedValue(enabled);
		mocks.options.mockResolvedValue({
			options: [
				{ optionId: 'option', start: moved.start, end: moved.end, preview: alternative },
			],
			nextOffset: null,
		});
		mocks.accept.mockRejectedValue(new Error('offline'));
		mocks.operation.mockRejectedValue(new Error('offline'));
		render(<TiletteSchedulePreview assignmentId="mine" name="Review API" />, { wrapper });
		await setupUser().click(screen.getByRole('button', { name: 'Preview schedule' }));
		const sessions = await screen.findByRole('list', { name: 'Proposed sessions' });
		await setupUser().click(within(sessions).getAllByRole('button')[1]);
		await setupUser().click(screen.getByRole('button', { name: 'View other time options' }));
		await setupUser().click(
			await screen.findByRole('button', { name: /Sep 30, 2026, 1:00 PM/ })
		);
		expect(screen.getByRole('dialog', { name: 'Find another time' })).toBeInTheDocument();
		expect(screen.getByRole('region', { name: 'Selected schedule' })).toHaveTextContent(
			'1:00 PM'
		);
		expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
		expect(mocks.revise).not.toHaveBeenCalled();
		expect(mocks.accept).not.toHaveBeenCalled();
		await setupUser().click(screen.getByRole('button', { name: 'Accept and lock' }));
		expect(mocks.accept).toHaveBeenCalledWith('mine', {
			StartTimeUnixMsUtc: moved.start,
			DurationInMs: moved.end - moved.start,
		});
		await setupUser().click(await screen.findByRole('button', { name: 'Retry same request' }));
		expect(mocks.accept.mock.calls[1]).toEqual(mocks.accept.mock.calls[0]);
	});

	it('retains the selected timeline on an options error and retries without acceptance', async () => {
		mocks.preview.mockResolvedValue({
			...preview,
			previewToken: 'token',
			sessions: [{ ...session, sessionKey: '0' }],
			capabilities: { alternatives: true, fixedSessions: true, reviewedAcceptance: true },
		});
		mocks.options
			.mockRejectedValueOnce(new Error('offline'))
			.mockResolvedValueOnce({ options: [], nextOffset: null });
		render(<TiletteSchedulePreview assignmentId="mine" name="Review API" />, { wrapper });
		await setupUser().click(screen.getByRole('button', { name: 'Preview schedule' }));
		await setupUser().click(
			await screen.findByRole('button', { name: 'View other time options' })
		);
		expect(screen.getByRole('region', { name: 'Selected schedule' })).toHaveTextContent(
			'9:00 AM'
		);
		await setupUser().click(await screen.findByRole('button', { name: 'Retry options' }));
		await screen.findByText('No different time found. Try another shuffle.');
		expect(mocks.options).toHaveBeenCalledTimes(2);
		expect(mocks.accept).not.toHaveBeenCalled();
	});
	it('deduplicates shuffled alternatives by all session placements', async () => {
		const enabled = {
			...preview,
			previewToken: 'token',
			sessions: [{ ...session, sessionKey: '0' }],
			capabilities: { alternatives: true, fixedSessions: true, reviewedAcceptance: true },
		};
		const optionPreview = {
			...enabled,
			previewToken: 'one',
			sessions: [
				{ ...session, sessionKey: '0', start: start + 3600000, end: start + 7200000 },
			],
		};
		const option = {
			optionId: 'one',
			start: start + 3600000,
			end: start + 7200000,
			preview: optionPreview,
		};
		mocks.preview.mockResolvedValue(enabled);
		mocks.options
			.mockResolvedValueOnce({ options: [option], nextOffset: 4 })
			.mockResolvedValueOnce({
				options: [
					{
						...option,
						optionId: 'duplicate',
						preview: { ...optionPreview, previewToken: 'duplicate' },
					},
				],
				nextOffset: null,
			});
		render(<TiletteSchedulePreview assignmentId="mine" name="Review API" />, { wrapper });
		await setupUser().click(screen.getByRole('button', { name: 'Preview schedule' }));
		await setupUser().click(
			await screen.findByRole('button', { name: 'View other time options' })
		);
		await setupUser().click(await screen.findByRole('button', { name: 'Find more times' }));
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Find more times' })).toBeDisabled()
		);
		expect(
			within(screen.getByRole('list', { name: 'Other time options' })).getAllByRole('button')
		).toHaveLength(1);
	});
	it('keeps acceptance flexible when accepting an alternative without locking', async () => {
		mocks.preview.mockResolvedValue({
			...preview,
			previewToken: 'token',
			sessions: [{ ...session, sessionKey: '0' }],
			capabilities: { alternatives: true, fixedSessions: true, reviewedAcceptance: true },
		});
		mocks.accept.mockRejectedValue(new Error('offline'));
		mocks.operation.mockRejectedValue(new Error('offline'));
		render(<TiletteSchedulePreview assignmentId="mine" name="Review API" />, { wrapper });
		await setupUser().click(screen.getByRole('button', { name: 'Preview schedule' }));
		await setupUser().click(await screen.findByRole('button', { name: 'Accept' }));
		expect(mocks.accept).toHaveBeenCalledWith('mine', undefined);
	});
	it('retries the same direct acceptance after a lost response', async () => {
		mocks.preview.mockResolvedValue({
			...preview,
			previewToken: 'token',
			capabilities: { alternatives: false, fixedSessions: false, reviewedAcceptance: true },
		});
		mocks.accept.mockRejectedValueOnce(new Error('timeout')).mockResolvedValueOnce({
			id: 'mine',
			invitationStatus: 'accepted',
			calendarId: 'calendar',
			reason: null,
		});
		mocks.operation.mockRejectedValue(new Error('offline'));
		render(<TiletteSchedulePreview assignmentId="mine" name="Review API" />, { wrapper });
		await setupUser().click(screen.getByRole('button', { name: 'Preview schedule' }));
		await setupUser().click(await screen.findByRole('button', { name: 'Accept' }));
		await setupUser().click(await screen.findByRole('button', { name: 'Retry same request' }));
		await screen.findByText('Accepted and added to your calendar.');
		expect(mocks.accept).toHaveBeenCalledTimes(2);
		expect(mocks.accept.mock.calls[0]).toEqual(mocks.accept.mock.calls[1]);
		expect(screen.getByRole('link', { name: 'View in calendar' })).toHaveAttribute(
			'href',
			'/timeline?calendarEventId=calendar'
		);
	});
	it('declines from the preview without requesting alternatives or accepting work', async () => {
		mocks.preview.mockResolvedValue({
			...preview,
			previewToken: 'token',
			capabilities: { alternatives: true, fixedSessions: true, reviewedAcceptance: true },
		});
		mocks.respond.mockResolvedValue({});
		render(<TiletteSchedulePreview assignmentId="mine" name="Review API" />, { wrapper });
		await setupUser().click(screen.getByRole('button', { name: 'Preview schedule' }));
		await setupUser().click(await screen.findByRole('button', { name: 'Decline tilette' }));
		await screen.findByText('Invitation declined.');
		expect(mocks.respond).toHaveBeenCalledExactlyOnceWith('mine', 'declined');
		expect(mocks.accept).not.toHaveBeenCalled();
		expect(mocks.options).not.toHaveBeenCalled();
	});
	it('clears a failed read and retries on demand', async () => {
		mocks.preview.mockRejectedValueOnce(new Error('offline')).mockResolvedValue(preview);
		render(<TiletteSchedulePreview assignmentId="mine" name="Review API" />, { wrapper });
		await setupUser().click(screen.getByRole('button', { name: 'Preview schedule' }));
		await setupUser().click(await screen.findByRole('button', { name: 'Retry preview' }));
		await screen.findByRole('region', { name: 'Selected schedule' });
		expect(mocks.preview).toHaveBeenCalledTimes(2);
	});
	it('restarts a stuck preview and ignores its late result', async () => {
		let finishOld!: (value: TileSharePreview) => void;
		mocks.preview
			.mockReturnValueOnce(
				new Promise<TileSharePreview>((resolve) => {
					finishOld = resolve;
				})
			)
			.mockResolvedValue({ ...preview, name: 'Fresh forecast' });
		render(<TiletteSchedulePreview assignmentId="mine" name="Review API" />, { wrapper });
		await setupUser().click(screen.getByRole('button', { name: 'Preview schedule' }));
		const oldSignal = mocks.preview.mock.calls[0][1] as AbortSignal;
		await setupUser().click(screen.getByRole('button', { name: 'Generate new preview' }));
		await screen.findByText('Fresh forecast');
		expect(oldSignal.aborted).toBe(true);
		await act(async () => finishOld({ ...preview, name: 'Old forecast' }));
		expect(screen.queryByText('Old forecast')).not.toBeInTheDocument();
		expect(screen.getByText('Fresh forecast')).toBeInTheDocument();
		expect(mocks.preview).toHaveBeenCalledTimes(2);
		expect(mocks.accept).not.toHaveBeenCalled();
	});
	it('preserves an uncertain acceptance when generating a new preview', async () => {
		const enabled = {
			...preview,
			previewToken: 'original',
			capabilities: { alternatives: false, fixedSessions: false, reviewedAcceptance: true },
		};
		mocks.preview
			.mockResolvedValueOnce(enabled)
			.mockResolvedValue({ ...enabled, previewToken: 'fresh' });
		mocks.accept.mockRejectedValueOnce(new Error('timeout')).mockResolvedValueOnce({
			id: 'mine',
			invitationStatus: 'accepted',
			calendarId: 'calendar',
			reason: null,
		});
		mocks.operation.mockRejectedValue(new Error('offline'));
		render(<TiletteSchedulePreview assignmentId="mine" name="Review API" />, { wrapper });
		await setupUser().click(screen.getByRole('button', { name: 'Preview schedule' }));
		await setupUser().click(await screen.findByRole('button', { name: 'Accept' }));
		await screen.findByRole('button', { name: 'Retry same request' });
		const pending = sessionStorage.getItem('tileshare-preview:viewer:mine');
		await setupUser().click(screen.getByRole('button', { name: 'Generate new preview' }));
		await screen.findByRole('region', { name: 'Selected schedule' });
		expect(mocks.preview).toHaveBeenCalledTimes(2);
		expect(mocks.accept).toHaveBeenCalledTimes(1);
		expect(sessionStorage.getItem('tileshare-preview:viewer:mine')).toBe(pending);
		expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
		await setupUser().click(screen.getByRole('button', { name: 'Retry same request' }));
		await screen.findByText('Accepted and added to your calendar.');
		expect(mocks.accept.mock.calls[1]).toEqual(mocks.accept.mock.calls[0]);
		expect(mocks.accept.mock.calls[1][1]).toBeUndefined();
	});
	it('allows a fresh reviewed response after a rejected operation', async () => {
		const enabled = {
			...preview,
			previewToken: 'original',
			capabilities: { alternatives: false, fixedSessions: false, reviewedAcceptance: true },
		};
		mocks.preview
			.mockResolvedValueOnce(enabled)
			.mockResolvedValue({ ...enabled, previewToken: 'fresh' });
		mocks.accept.mockRejectedValueOnce({ code: '409' }).mockResolvedValueOnce({
			id: 'mine',
			invitationStatus: 'accepted',
			calendarId: 'calendar',
			reason: null,
		});
		render(<TiletteSchedulePreview assignmentId="mine" name="Review API" />, { wrapper });
		await setupUser().click(screen.getByRole('button', { name: 'Preview schedule' }));
		await setupUser().click(await screen.findByRole('button', { name: 'Accept' }));
		await waitFor(() =>
			expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument()
		);
		await setupUser().click(screen.getByRole('button', { name: 'Generate new preview' }));
		await screen.findByRole('button', { name: 'Accept' });
		expect(mocks.accept).toHaveBeenCalledTimes(1);
		await setupUser().click(screen.getByRole('button', { name: 'Accept' }));
		await screen.findByText('Accepted and added to your calendar.');
		expect(mocks.accept.mock.calls[1][1]).toBeUndefined();
		expect(mocks.accept.mock.calls[1]).toEqual(['mine', undefined]);
	});
	it('aborts an outstanding alternative search when regenerating', async () => {
		mocks.preview.mockResolvedValue({
			...preview,
			previewToken: 'token',
			capabilities: { alternatives: true, fixedSessions: true, reviewedAcceptance: true },
			sessions: [{ ...session, sessionKey: '0' }],
		});
		let finishOptions!: (value: unknown) => void;
		mocks.options.mockReturnValueOnce(
			new Promise((resolve) => {
				finishOptions = resolve;
			})
		);
		render(<TiletteSchedulePreview assignmentId="mine" name="Review API" />, { wrapper });
		await setupUser().click(screen.getByRole('button', { name: 'Preview schedule' }));
		await setupUser().click(
			await screen.findByRole('button', { name: 'View other time options' })
		);
		const signal = mocks.options.mock.calls[0][4] as AbortSignal;
		await setupUser().click(screen.getByRole('button', { name: 'Generate new preview' }));
		await screen.findByRole('button', { name: 'View other time options' });
		expect(signal.aborted).toBe(true);
		await act(async () => finishOptions({ options: [], nextOffset: null }));
		expect(screen.getByRole('dialog', { name: 'Tilette preview' })).toBeInTheDocument();
		expect(mocks.preview).toHaveBeenCalledTimes(2);
	});
	it('shows a viable session beyond the returned calendar without navigating into an empty forecast', async () => {
		const outside = {
			...session,
			start: start + 10 * 86400000,
			end: start + 10 * 86400000 + 3600000,
			placement: 'OutsideWindow',
		};
		mocks.preview.mockResolvedValue({
			...preview,
			rangeStart: start,
			rangeEnd: start + 7 * 86400000,
			proposed: [],
			sessions: [outside],
			previewToken: 'token',
			capabilities: { alternatives: true, fixedSessions: true, reviewedAcceptance: true },
		});
		render(<TiletteSchedulePreview assignmentId="mine" name="Review API" />, { wrapper });
		await setupUser().click(screen.getByRole('button', { name: 'Preview schedule' }));
		const outsideButton = await screen.findByRole('button', {
			name: /Scheduled outside the displayed calendar window/,
		});
		expect(outsideButton).toHaveTextContent('Oct 10, 2026');
		expect(screen.getByRole('button', { name: 'Previous day' })).toBeDisabled();
		await setupUser().click(outsideButton);
		expect(screen.getByRole('button', { name: 'Previous day' })).toBeDisabled();
		expect(screen.getByRole('button', { name: 'Accept' })).toBeEnabled();
		expect(
			screen.queryByText(/The full tilette could not be scheduled/)
		).not.toBeInTheDocument();
		expect(mocks.accept).not.toHaveBeenCalled();
	});
	it('keeps an unscheduled candidate visible without presenting its placeholder time as an appointment', async () => {
		mocks.preview.mockResolvedValue({
			...preview,
			isViable: false,
			proposed: [],
			sessions: [{ ...session, viable: false, placement: 'Unscheduled', duration: 3600000 }],
			conflicts: [{ ...session, name: 'Existing work at risk', isProposed: false }],
			previewToken: 'token',
			capabilities: { alternatives: true, fixedSessions: true, reviewedAcceptance: true },
		});
		render(<TiletteSchedulePreview assignmentId="mine" name="Review API" />, { wrapper });
		await setupUser().click(screen.getByRole('button', { name: 'Preview schedule' }));
		const card = (await screen.findByText('Not scheduled', { selector: 'summary' })).closest(
			'details'
		)!;
		expect(card).toHaveAttribute('open');
		expect(card).toHaveTextContent('No confirmed time in this forecast');
		expect(card).not.toHaveTextContent('9:00');
		await setupUser().click(
			screen.getByRole('button', { name: /Scheduling issues this week/ })
		);
		expect(screen.getByRole('heading', { name: 'Scheduling issues this week' })).toHaveFocus();
		expect(screen.getByText(/Existing work at risk/)).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
		expect(screen.queryByRole('region', { name: 'Selected schedule' })).not.toBeInTheDocument();
		expect(screen.getByRole('article')).toHaveTextContent('No confirmed time in this forecast');
		await setupUser().click(screen.getByRole('button', { name: 'Back to preview' }));
		await waitFor(() =>
			expect(
				screen.getByRole('button', { name: /Scheduling issues this week/ })
			).toHaveFocus()
		);
		expect(mocks.preview).toHaveBeenCalledTimes(1);
		expect(screen.getByRole('button', { name: 'Accept' })).toBeDisabled();
		expect(
			screen.queryByRole('checkbox', { name: 'Keep this session at this time' })
		).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'View other time options' })).toBeDisabled();
		expect(screen.getByRole('button', { name: 'Generate new preview' })).toBeEnabled();
	});
	it('shows partial placement and a conflicting session without enabling acceptance', async () => {
		mocks.preview.mockResolvedValue({
			...preview,
			isViable: false,
			sessions: [
				{ ...session, placement: 'Scheduled' },
				{ ...session, id: 'conflict', viable: false, placement: 'Conflict' },
			],
			previewToken: 'token',
			capabilities: { alternatives: false, fixedSessions: false, reviewedAcceptance: true },
		});
		render(<TiletteSchedulePreview assignmentId="mine" name="Review API" />, { wrapper });
		await setupUser().click(screen.getByRole('button', { name: 'Preview schedule' }));
		await screen.findByText('Scheduled sessions: 1 / 2');
		expect(
			screen.getByText('Scheduling conflict', { selector: 'summary' }).closest('details')
		).toHaveAttribute('open');
		expect(screen.getByRole('button', { name: 'Accept' })).toBeDisabled();
	});
	it('treats missing session results as unknown instead of proof that the tilette cannot fit', async () => {
		mocks.preview.mockResolvedValue({
			...preview,
			sessions: [],
			proposed: [],
			isViable: false,
		});
		render(<TiletteSchedulePreview assignmentId="mine" name="Review API" />, { wrapper });
		await setupUser().click(screen.getByRole('button', { name: 'Preview schedule' }));
		await screen.findByText(
			'No session outcome was returned. Generate a new preview to check this tilette.'
		);
		expect(
			screen.queryByText(/The full tilette could not be scheduled/)
		).not.toBeInTheDocument();
	});
	it('aborts an in-flight forecast on close', async () => {
		mocks.preview.mockReturnValue(new Promise(() => {}));
		render(<TiletteSchedulePreview assignmentId="mine" name="Review API" />, { wrapper });
		await setupUser().click(screen.getByRole('button', { name: 'Preview schedule' }));
		const signal = mocks.preview.mock.calls[0][1] as AbortSignal;
		await setupUser().click(screen.getByRole('button', { name: 'Close preview' }));
		expect(signal.aborted).toBe(true);
	});
	it('preserves preview data and selection when the theme changes', async () => {
		mocks.preview.mockResolvedValue(preview);
		const view = render(
			<MemoryRouter>
				<ThemeProvider theme={darkTheme}>
					<TiletteSchedulePreview assignmentId="mine" name="Review API" />
				</ThemeProvider>
			</MemoryRouter>
		);
		await setupUser().click(screen.getByRole('button', { name: 'Preview schedule' }));
		await screen.findByRole('region', { name: 'Selected schedule' });
		view.rerender(
			<MemoryRouter>
				<ThemeProvider theme={lightTheme}>
					<TiletteSchedulePreview assignmentId="mine" name="Review API" />
				</ThemeProvider>
			</MemoryRouter>
		);
		await waitFor(() => expect(mocks.preview).toHaveBeenCalledTimes(1));
		expect(screen.getByRole('region', { name: 'Selected schedule' })).toBeInTheDocument();
	});
	it('does not offer fixed-time acceptance when the server cannot guarantee it', async () => {
		mocks.preview.mockResolvedValue(preview);
		render(<TiletteSchedulePreview assignmentId="mine" name="Review API" />, { wrapper });
		await setupUser().click(screen.getByRole('button', { name: 'Preview schedule' }));
		await screen.findByRole('region', { name: 'Selected schedule' });
		expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /lock/i })).not.toBeInTheDocument();
	});
});
describe('preview time layout', () => {
	it('uses the schedule timezone across midnight and falls back explicitly for unsupported zones', () => {
		expect(dayKey(Date.parse('2026-09-30T01:00:00Z'), 'America/Los_Angeles')).toBe(
			'2026-09-29'
		);
		expect(safeTimeZone('not-a-zone')).toBe('UTC');
	});
	it('uses consistent lanes for a connected chain of overlapping sessions', () => {
		const blocks = [
			session,
			{ ...session, id: 'b', start: start + 1800000, end: start + 5400000 },
			{ ...session, id: 'c', start: start + 3600000, end: start + 7200000 },
		];
		const layout = layoutPreviewDay(blocks, '2026-09-30', 'UTC');
		expect(layout.map((r) => r.lanes)).toEqual([2, 2, 2]);
		expect(layout.map((r) => r.lane)).toEqual([0, 1, 0]);
	});
});

it('distinguishes repeated daylight-saving clock times by their offsets', () => {
	const first = formatPreviewInstant(
		Date.parse('2026-11-01T05:30:00Z'),
		'America/New_York',
		'en-US',
		{ timeStyle: 'short' }
	);
	const second = formatPreviewInstant(
		Date.parse('2026-11-01T06:30:00Z'),
		'America/New_York',
		'en-US',
		{ timeStyle: 'short' }
	);
	expect(first).toContain('1:30');
	expect(second).toContain('1:30');
	expect(first).toContain('GMT-4');
	expect(second).toContain('GMT-5');
});
