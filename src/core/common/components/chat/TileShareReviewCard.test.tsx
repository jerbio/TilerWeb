import { act, fireEvent, render, screen } from '@testing-library/react';
import { it, expect, vi } from 'vitest';
import { ThemeProvider } from 'styled-components';
import { darkTheme } from '@/core/theme/dark';
import TileShareReviewCard from './TileShareReviewCard';
vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (_: string, fallback: string) => fallback }),
}));
const result = {
	State: 'NotAttempted' as const,
	ActionId: 'a',
	ReviewToken: 'exact',
	Review: {
		Name: 'Launch',
		CreatesProject: true,
		Tilettes: [
			{
				Name: 'Copy',
				DurationMinutes: 60,
				Recipients: [{ name: 'Ada', email: 'ada@example.test' }],
			},
		],
	},
};
it('shows the effects and submits only after explicit confirmation', async () => {
	const confirm = vi.fn().mockResolvedValue({ State: 'Applied', ActionId: 'a' });
	const changed = vi.fn();
	render(
		<ThemeProvider theme={darkTheme}>
			<TileShareReviewCard
				result={result}
				onConfirm={confirm}
				onCheck={vi.fn()}
				onChanged={changed}
			/>
		</ThemeProvider>
	);
	expect(screen.getByText(/ada@example.test/)).toBeVisible();
	expect(confirm).not.toHaveBeenCalled();
	fireEvent.click(screen.getByRole('button', { name: 'Confirm creation' }));
	await act(async () => {});
	expect(confirm).toHaveBeenCalledWith('exact', expect.any(AbortSignal));
	expect(changed).toHaveBeenCalledWith({ State: 'Applied', ActionId: 'a' });
});
it('a stale review never retries automatically', async () => {
	const confirm = vi
		.fn()
		.mockResolvedValue({ ...result, ReviewToken: 'new', ErrorCode: 'review_changed' });
	render(
		<ThemeProvider theme={darkTheme}>
			<TileShareReviewCard
				result={result}
				onConfirm={confirm}
				onCheck={vi.fn()}
				onChanged={vi.fn()}
			/>
		</ThemeProvider>
	);
	fireEvent.click(screen.getByRole('button', { name: 'Confirm creation' }));
	await act(async () => {});
	expect(confirm).toHaveBeenCalledTimes(1);
	expect(screen.getByRole('alert')).toHaveTextContent(/Review/);
});
it('a lost response offers a read-only status check without another mutation', async () => {
	const confirm = vi.fn().mockRejectedValue(new Error('private error'));
	const check = vi.fn().mockResolvedValue({ State: 'Applied', ActionId: 'a' });
	render(
		<ThemeProvider theme={darkTheme}>
			<TileShareReviewCard
				result={result}
				onConfirm={confirm}
				onCheck={check}
				onChanged={vi.fn()}
			/>
		</ThemeProvider>
	);
	fireEvent.click(screen.getByRole('button', { name: 'Confirm creation' }));
	await act(async () => {});
	expect(screen.getByRole('button', { name: 'Confirm creation' })).toBeDisabled();
	fireEvent.click(screen.getByRole('button', { name: 'Check status' }));
	await act(async () => {});
	expect(check).toHaveBeenCalledTimes(1);
	expect(confirm).toHaveBeenCalledTimes(1);
});

it('reviews a rename with before/after names and the exact confirmation token', async () => {
	const confirm = vi
		.fn()
		.mockResolvedValue({ State: 'Applied', ActionId: 'a', Operation: 'RenameProject' });
	render(
		<ThemeProvider theme={darkTheme}>
			<TileShareReviewCard
				result={{
					...result,
					Review: {
						Name: 'Release',
						PreviousName: 'Launch',
						Operation: 'RenameProject',
						Tilettes: [],
					},
				}}
				onConfirm={confirm}
				onCheck={vi.fn()}
				onChanged={vi.fn()}
			/>
		</ThemeProvider>
	);
	expect(screen.getByText('Rename project: Release')).toBeVisible();
	expect(screen.getByText(/Current name.*Launch/)).toBeVisible();
	expect(screen.queryByText(/Nothing is created/)).not.toBeInTheDocument();
	expect(confirm).not.toHaveBeenCalled();
	fireEvent.click(screen.getByRole('button', { name: 'Confirm rename' }));
	await act(async () => {});
	expect(confirm).toHaveBeenCalledWith('exact', expect.any(AbortSignal));
});
it('reports a saved rename without claiming creation', () => {
	render(
		<ThemeProvider theme={darkTheme}>
			<TileShareReviewCard
				result={{
					State: 'Applied',
					ActionId: 'a',
					Operation: 'RenameProject',
					Url: '/tileshare/p',
				}}
				onConfirm={vi.fn()}
				onCheck={vi.fn()}
				onChanged={vi.fn()}
			/>
		</ThemeProvider>
	);
	expect(screen.getByText('Project renamed.')).toBeVisible();
	expect(screen.queryByText('TileShare created.')).not.toBeInTheDocument();
});

it('reviews a tilette rename with project context and correct saved label', async () => {
	const confirm = vi
		.fn()
		.mockResolvedValue({ State: 'Applied', ActionId: 'a', Operation: 'RenameTilette' });
	const changed = vi.fn();
	const props = { onConfirm: confirm, onCheck: vi.fn(), onChanged: changed };
	const view = render(
		<ThemeProvider theme={darkTheme}>
			<TileShareReviewCard
				{...props}
				result={{
					...result,
					Review: {
						Operation: 'RenameTilette',
						Name: 'API review',
						PreviousName: 'Review',
						ProjectName: 'Launch',
						Tilettes: [],
					},
				}}
			/>
		</ThemeProvider>
	);
	expect(screen.getByRole('region', { name: 'Review tilette rename' })).toBeVisible();
	expect(screen.getByText('Rename tilette: API review')).toBeVisible();
	expect(screen.getByText('Current name: Review')).toBeVisible();
	expect(screen.getByText('Project: Launch')).toBeVisible();
	fireEvent.click(screen.getByRole('button', { name: 'Confirm rename' }));
	await act(async () => {});
	expect(confirm).toHaveBeenCalledWith('exact', expect.any(AbortSignal));
	view.rerender(
		<ThemeProvider theme={darkTheme}>
			<TileShareReviewCard
				{...props}
				result={{ State: 'Applied', ActionId: 'a', Operation: 'RenameTilette' }}
			/>
		</ThemeProvider>
	);
	expect(screen.getByText('Tilette renamed.')).toBeVisible();
	expect(screen.queryByText('Project renamed.')).not.toBeInTheDocument();
});

it('reviews exact notes as text and confirms the bound proposal', async () => {
	const confirm = vi
		.fn()
		.mockResolvedValue({ State: 'Applied', ActionId: 'a', Operation: 'SetTiletteNotes' });
	render(
		<ThemeProvider theme={darkTheme}>
			<TileShareReviewCard
				result={{
					...result,
					Review: {
						Operation: 'SetTiletteNotes',
						Name: 'Review',
						ProjectName: 'Launch',
						PreviousNotes: '<b>Original</b>',
						Notes: '',
						Tilettes: [],
					},
				}}
				onConfirm={confirm}
				onCheck={vi.fn()}
				onChanged={vi.fn()}
			/>
		</ThemeProvider>
	);
	expect(screen.getByRole('region', { name: 'Review tilette notes' })).toBeVisible();
	expect(screen.getByText('<b>Original</b>')).toBeVisible();
	expect(screen.getByText('Clear notes')).toBeVisible();
	expect(confirm).not.toHaveBeenCalled();
	fireEvent.click(screen.getByRole('button', { name: 'Confirm notes' }));
	await act(async () => {});
	expect(confirm).toHaveBeenCalledWith('exact', expect.any(AbortSignal));
});
it('reports saved notes instead of creation', () => {
	render(
		<ThemeProvider theme={darkTheme}>
			<TileShareReviewCard
				result={{ State: 'Applied', ActionId: 'a', Operation: 'SetTiletteNotes' }}
				onConfirm={vi.fn()}
				onCheck={vi.fn()}
				onChanged={vi.fn()}
			/>
		</ThemeProvider>
	);
	expect(screen.getByText('Tilette notes updated.')).toBeVisible();
	expect(screen.queryByText('TileShare created.')).not.toBeInTheDocument();
});

it('reviews deletion effects before confirming and reports a deleted tilette', async () => {
	const confirm = vi
		.fn()
		.mockResolvedValue({ State: 'Applied', ActionId: 'a', Operation: 'DeleteTilette' });
	const props = { onConfirm: confirm, onCheck: vi.fn(), onChanged: vi.fn() };
	const view = render(
		<ThemeProvider theme={darkTheme}>
			<TileShareReviewCard
				{...props}
				result={{
					...result,
					Review: {
						Operation: 'DeleteTilette',
						Name: 'Review',
						ProjectName: 'Launch',
						AssignmentCount: 2,
						LinkedCalendarCount: 3,
						Tilettes: [],
					},
				}}
			/>
		</ThemeProvider>
	);
	expect(screen.getByRole('region', { name: 'Review tilette deletion' })).toBeVisible();
	expect(screen.getByText('Assignments: 2')).toBeVisible();
	expect(screen.getByText('Linked calendar items: 3')).toBeVisible();
	expect(confirm).not.toHaveBeenCalled();
	fireEvent.click(screen.getByRole('button', { name: 'Confirm deletion' }));
	await act(async () => {});
	expect(confirm).toHaveBeenCalledWith('exact', expect.any(AbortSignal));
	view.rerender(
		<ThemeProvider theme={darkTheme}>
			<TileShareReviewCard
				{...props}
				result={{
					State: 'Applied',
					ActionId: 'a',
					Operation: 'DeleteTilette',
					Url: '/tileshare/p',
				}}
			/>
		</ThemeProvider>
	);
	expect(screen.getByText('Tilette deleted.')).toBeVisible();
	expect(screen.getByRole('link', { name: 'Open project' })).toHaveAttribute(
		'href',
		'/tileshare/p'
	);
});

it('reviews name and notes together and confirms one composite update', async () => {
	const confirm = vi
		.fn()
		.mockResolvedValue({ State: 'Applied', ActionId: 'a', Operation: 'UpdateTilette' });
	render(
		<ThemeProvider theme={darkTheme}>
			<TileShareReviewCard
				result={{
					...result,
					Review: {
						Operation: 'UpdateTilette',
						Name: 'Weekly review',
						PreviousName: 'Review',
						ProjectName: 'Launch',
						UpdatesName: true,
						UpdatesNotes: true,
						PreviousNotes: 'Old instructions',
						Notes: '',
						Tilettes: [],
					},
				}}
				onConfirm={confirm}
				onCheck={vi.fn()}
				onChanged={vi.fn()}
			/>
		</ThemeProvider>
	);
	expect(screen.getByRole('region', { name: 'Review tilette update' })).toBeVisible();
	expect(screen.getByText('Current name: Review')).toBeVisible();
	expect(screen.getByText('Old instructions')).toBeVisible();
	expect(screen.getByText('Clear notes')).toBeVisible();
	expect(screen.queryByRole('button', { name: 'Confirm creation' })).not.toBeInTheDocument();
	fireEvent.click(screen.getByRole('button', { name: 'Confirm update' }));
	await act(async () => {});
	expect(confirm).toHaveBeenCalledTimes(1);
	expect(confirm).toHaveBeenCalledWith('exact', expect.any(AbortSignal));
});
it('does not show omitted notes as a clear operation', () => {
	render(
		<ThemeProvider theme={darkTheme}>
			<TileShareReviewCard
				result={{
					...result,
					Review: {
						Operation: 'UpdateTilette',
						Name: 'Weekly review',
						PreviousName: 'Review',
						UpdatesName: true,
						UpdatesNotes: false,
						Tilettes: [],
					},
				}}
				onConfirm={vi.fn()}
				onCheck={vi.fn()}
				onChanged={vi.fn()}
			/>
		</ThemeProvider>
	);
	expect(screen.queryByText('Clear notes')).not.toBeInTheDocument();
	expect(screen.queryByText('Current notes')).not.toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'Confirm update' })).toBeVisible();
});
it('reports a saved composite update as updated', () => {
	render(
		<ThemeProvider theme={darkTheme}>
			<TileShareReviewCard
				result={{ State: 'Applied', ActionId: 'a', Operation: 'UpdateTilette' }}
				onConfirm={vi.fn()}
				onCheck={vi.fn()}
				onChanged={vi.fn()}
			/>
		</ThemeProvider>
	);
	expect(screen.getByRole('status')).toHaveTextContent('Tilette updated.');
});

it('shows the exact schedule effects beside the single update confirmation', () => {
	const summary =
		'Deadline: 2035-01-09 09:00 UTC -> 2035-01-12 09:00 UTC\nAccepted calendars to update: 1';
	render(
		<ThemeProvider theme={darkTheme}>
			<TileShareReviewCard
				result={{
					...result,
					Review: {
						...result.Review,
						Operation: 'UpdateTilette',
						ScheduleSummary: summary,
						Tilettes: [],
					},
				}}
				onConfirm={vi.fn()}
				onCheck={vi.fn()}
				onChanged={vi.fn()}
			/>
		</ThemeProvider>
	);
	expect(screen.getByText(/Accepted calendars to update: 1/)).toBeVisible();
	expect(screen.getAllByRole('button', { name: 'Confirm update' })).toHaveLength(1);
});
it('a confirmed rejection does not offer uncertain-save recovery or resubmit', async () => {
	const rejected = {
		State: 'Rejected' as const,
		ActionId: 'a',
		ErrorCode: 'locked_work_conflict',
	};
	const changed = vi.fn();
	render(
		<ThemeProvider theme={darkTheme}>
			<TileShareReviewCard
				result={result}
				onConfirm={vi.fn().mockResolvedValue(rejected)}
				onCheck={vi.fn()}
				onChanged={changed}
			/>
		</ThemeProvider>
	);
	fireEvent.click(screen.getByRole('button', { name: 'Confirm creation' }));
	await act(async () => {});
	expect(changed).toHaveBeenCalledWith(rejected);
	expect(screen.getByRole('alert')).toHaveTextContent('No changes were applied');
	expect(screen.queryByRole('button', { name: 'Check status' })).not.toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'Confirm creation' })).toBeDisabled();
});

it('queued schedule updates expose only a read-only status check', async () => {
	const confirm = vi.fn();
	const check = vi.fn().mockResolvedValue({ State: 'Applied', ActionId: 'a' });
	const changed = vi.fn();
	render(
		<ThemeProvider theme={darkTheme}>
			<TileShareReviewCard
				disabled
				result={{ State: 'Pending', ActionId: 'a', Operation: 'UpdateTilette' } as any}
				onConfirm={confirm}
				onCheck={check}
				onChanged={changed}
			/>
		</ThemeProvider>
	);
	expect(screen.getByRole('status')).toHaveTextContent(/No changes have been saved/);
	fireEvent.click(screen.getByRole('button', { name: 'Check status' }));
	await act(async () => {});
	expect(confirm).not.toHaveBeenCalled();
	expect(changed).toHaveBeenCalledWith({ State: 'Applied', ActionId: 'a' });
});
it('a failed schedule calculation is not an uncertain mutation', () => {
	render(
		<ThemeProvider theme={darkTheme}>
			<TileShareReviewCard
				result={
					{
						State: 'Failed',
						ActionId: 'a',
						Operation: 'UpdateTilette',
						ErrorCode: 'schedule_no_fit',
					} as any
				}
				onConfirm={vi.fn()}
				onCheck={vi.fn()}
				onChanged={vi.fn()}
			/>
		</ThemeProvider>
	);
	expect(screen.getByRole('alert')).toHaveTextContent(/No changes were applied/);
	expect(screen.queryByRole('button')).not.toBeInTheDocument();
});

it('reviews project name and notes together with one confirmation', async () => {
	const confirm = vi
		.fn()
		.mockResolvedValue({ State: 'Applied', ActionId: 'a', Operation: 'UpdateProject' });
	render(
		<ThemeProvider theme={darkTheme}>
			<TileShareReviewCard
				result={{
					...result,
					Review: {
						Operation: 'UpdateProject',
						Name: 'Weekly review',
						PreviousName: 'Review',
						ProjectName: 'Launch',
						UpdatesName: true,
						UpdatesNotes: true,
						PreviousNotes: 'Old instructions',
						Notes: '',
						Tilettes: [],
					},
				}}
				onConfirm={confirm}
				onCheck={vi.fn()}
				onChanged={vi.fn()}
			/>
		</ThemeProvider>
	);
	expect(screen.getByRole('region', { name: 'Review project update' })).toBeVisible();
	expect(screen.getByText('Current name: Review')).toBeVisible();
	expect(screen.getByText('Old instructions')).toBeVisible();
	expect(screen.getByText('Clear notes')).toBeVisible();
	expect(screen.queryByRole('button', { name: 'Confirm creation' })).not.toBeInTheDocument();
	fireEvent.click(screen.getByRole('button', { name: 'Confirm update' }));
	await act(async () => {});
	expect(confirm).toHaveBeenCalledTimes(1);
	expect(confirm).toHaveBeenCalledWith('exact', expect.any(AbortSignal));
});

it('reports a saved composite project update', () => {
	render(
		<ThemeProvider theme={darkTheme}>
			<TileShareReviewCard
				result={{ State: 'Applied', ActionId: 'a', Operation: 'UpdateProject' }}
				onConfirm={vi.fn()}
				onCheck={vi.fn()}
				onChanged={vi.fn()}
			/>
		</ThemeProvider>
	);
	expect(screen.getByText('Project updated.')).toBeVisible();
	expect(screen.queryByText('TileShare created.')).not.toBeInTheDocument();
});

it.each(['UpdateRecipients', 'UpdateAccess'] as const)(
	'shows %s effects with update confirmation',
	async (Operation) => {
		const confirm = vi.fn().mockResolvedValue({ State: 'Applied', ActionId: 'a', Operation });
		render(
			<ThemeProvider theme={darkTheme}>
				<TileShareReviewCard
					result={{
						...result,
						Operation,
						Review: {
							Name: 'Launch',
							Operation,
							Tilettes: [],
							EffectsSummary:
								'Participant: 1 calendar to suspend; independent grants survive.',
						},
					}}
					onConfirm={confirm}
					onCheck={vi.fn()}
					onChanged={vi.fn()}
				/>
			</ThemeProvider>
		);
		expect(screen.getByText(/1 calendar to suspend/)).toBeVisible();
		expect(screen.queryByRole('button', { name: 'Confirm creation' })).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Confirm update' }));
		await act(async () => {});
		expect(confirm).toHaveBeenCalledWith('exact', expect.any(AbortSignal));
	}
);
