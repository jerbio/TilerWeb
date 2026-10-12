import { act, fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { ThemeProvider } from 'styled-components';
import { darkTheme } from '@/core/theme/dark';
import { lightTheme } from '@/core/theme/light';
import { Actions, Status } from '@/core/constants/enums';
import { DirectorySearchPage, VibeAction } from '@/core/common/types/chat';
import DirectorySearchCard from './DirectorySearchCard';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }),
}));
const page: DirectorySearchPage = {
	Kind: 'Contact',
	ResultId: 'result',
	HasMore: false,
	Matches: [
		{ Id: 'first', Name: 'Ada', Revision: 'a', EmailHint: 'a***@home.test' },
		{ Id: 'second', Name: 'Ada', Revision: 'b', EmailHint: 'a***@work.test' },
	],
};
const action = (result = page): VibeAction => ({
	id: 'action',
	descriptions: 'Search',
	type: Actions.Directory_Search,
	status: Status.Executed,
	creationTimeInMs: 0,
	beforeScheduleId: null,
	afterScheduleId: null,
	vibeRequest: null,
	directorySearch: result,
});

for (const [mode, theme] of [
	['light', lightTheme],
	['dark', darkTheme],
] as const) {
	it(`keeps duplicate names distinct and selects the exact ID in ${mode} theme`, async () => {
		const saved = { ...page, Selection: page.Matches[1] };
		const select = vi.fn().mockResolvedValue(saved);
		const changed = vi.fn();
		render(
			<ThemeProvider theme={theme}>
				<DirectorySearchCard action={action()} onSelect={select} onChanged={changed} />
			</ThemeProvider>
		);
		expect(select).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole('button', { name: /work.test/ }));
		await act(async () => {});
		expect(select).toHaveBeenCalledWith('second', expect.any(AbortSignal));
		expect(changed).toHaveBeenCalledWith(saved);
	});
}

it('shows a failure without marking a choice selected', async () => {
	const changed = vi.fn();
	render(
		<ThemeProvider theme={darkTheme}>
			<DirectorySearchCard
				action={action()}
				onSelect={vi.fn().mockRejectedValue(new Error('private failure'))}
				onChanged={changed}
			/>
		</ThemeProvider>
	);
	fireEvent.click(screen.getByRole('button', { name: /home.test/ }));
	expect(await screen.findByRole('alert')).toHaveTextContent('Could not confirm');
	expect(screen.getByRole('alert')).not.toHaveTextContent('private failure');
	expect(changed).not.toHaveBeenCalled();
	expect(screen.getByRole('button', { name: /home.test/ })).toHaveAttribute(
		'aria-pressed',
		'false'
	);
});

it('aborts a pending choice and ignores a late result after unmount', async () => {
	let finish!: (page: DirectorySearchPage) => void;
	const select = vi.fn().mockImplementation(
		() =>
			new Promise<DirectorySearchPage>((resolve) => {
				finish = resolve;
			})
	);
	const changed = vi.fn();
	const { unmount } = render(
		<ThemeProvider theme={darkTheme}>
			<DirectorySearchCard action={action()} onSelect={select} onChanged={changed} />
		</ThemeProvider>
	);
	fireEvent.click(screen.getByRole('button', { name: /home.test/ }));
	expect(screen.getByRole('button', { name: /work.test/ })).toBeDisabled();
	const signal = select.mock.calls[0][1] as AbortSignal;
	unmount();
	expect(signal.aborted).toBe(true);
	await act(async () => finish({ ...page, Selection: page.Matches[0] }));
	expect(changed).not.toHaveBeenCalled();
});

it('shows team paths, previous selection, and incomplete-page guidance', () => {
	const teams: DirectorySearchPage = {
		...page,
		Kind: 'Team',
		HasMore: true,
		Matches: [
			{
				Id: 'qa',
				Name: 'QA',
				Revision: 'v',
				TeamPath: [
					{ Id: 'eng', Name: 'Engineering' },
					{ Id: 'qa', Name: 'QA' },
				],
			},
		],
	};
	teams.Selection = teams.Matches[0];
	render(
		<ThemeProvider theme={lightTheme}>
			<DirectorySearchCard
				action={action(teams)}
				disabled
				onSelect={vi.fn()}
				onChanged={vi.fn()}
			/>
		</ThemeProvider>
	);
	expect(screen.getByRole('button', { name: /Engineering/ })).toBeDisabled();
	expect(screen.getByRole('button', { name: /Engineering/ })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	expect(screen.getByText(/More matches/)).toBeInTheDocument();
});

it('shows an empty state with no choices', () => {
	render(
		<ThemeProvider theme={darkTheme}>
			<DirectorySearchCard
				action={action({ ...page, Matches: [] })}
				onSelect={vi.fn()}
				onChanged={vi.fn()}
			/>
		</ThemeProvider>
	);
	expect(screen.getByText(/No matches/)).toBeInTheDocument();
	expect(screen.queryAllByRole('button')).toHaveLength(0);
});
