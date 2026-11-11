import { createContext, useContext, useEffect, useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { Filter, Search, X } from 'lucide-react';
import Button from '@/core/common/components/button';
import TileShareFilterPopover from './TileShareFilterPopover';
import { useAuth } from '@/core/auth/useAuth';
import { ContactModel, TileletteStatus, TileShareTemplate } from '@/core/common/types/tileshare';
import { classParticipants, contactKeys } from '@/core/util/tileshareMode';
import {
	dueFilters,
	emptyShareFilters,
	FilterEnvironment,
	filterTimeZone,
	hasShareFilters,
	parseShareFilters,
	responseFilters,
	ShareFilters,
} from '@/core/util/tileshareFilters';

export function contactLabel(person: ContactModel): string {
	return (
		[person.FirstName, person.LastName].filter(Boolean).join(' ') ||
		person.Email ||
		person.PhoneNumber ||
		person.Id ||
		''
	);
}
export function useShareFilters(
	key: string,
	tilettes: TileShareTemplate[],
	participants?: ContactModel[]
) {
	const { user } = useAuth();
	const { i18n } = useTranslation();
	const read = (): ShareFilters => {
		try {
			return parseShareFilters(JSON.parse(localStorage.getItem(key) ?? 'null'));
		} catch {
			return emptyShareFilters();
		}
	};
	const [state, setState] = useState(() => ({ key, value: read() }));
	const filters = state.key === key ? state.value : read();
	const [now, setNow] = useState(Date.now);
	useEffect(() => {
		const foreground = () => {
			if (document.visibilityState === 'visible') setNow(Date.now());
		};
		document.addEventListener('visibilitychange', foreground);
		const timer =
			filters.due !== 'any' && filters.due !== 'none'
				? window.setInterval(() => setNow(Date.now()), 60_000)
				: null;
		return () => {
			document.removeEventListener('visibilitychange', foreground);
			if (timer !== null) clearInterval(timer);
		};
	}, [filters.due]);
	const people = useMemo(
		() => classParticipants(tilettes, participants),
		[tilettes, participants]
	);
	const env: FilterEnvironment = useMemo(
		() => ({ people, now, timeZone: filterTimeZone(user?.timeZone), locale: i18n?.language }),
		[people, now, user?.timeZone, i18n?.language]
	);
	const setFilters = (next: ShareFilters) => {
		const value = parseShareFilters(next);
		setState({ key, value });
		setNow(Date.now());
		try {
			localStorage.setItem(key, JSON.stringify(value));
		} catch {
			/* Filtering still works when storage is unavailable. */
		}
	};
	return { filters, setFilters, env, active: hasShareFilters(filters) };
}
export const ShareFilterContext = createContext<ReturnType<typeof useShareFilters> | null>(null);
export const useShareFilterContext = () => useContext(ShareFilterContext);

const stages = Object.values(TileletteStatus);
const stageLabels = {
	unassigned: 'Unassigned',
	delegated: 'Delegated',
	in_progress: 'In progress',
	completed: 'Completed',
};
const responseLabels = {
	none: 'Awaiting response',
	tentative: 'Tentative',
	accepted: 'Accepted',
	declined: 'Declined',
	unknown: 'Unknown response',
};
const dueLabels = {
	any: 'Any time',
	overdue: 'Overdue',
	today: 'Today',
	week: 'Next 7 days',
	custom: 'Custom range',
	none: 'No deadline',
};

/** One floating filter at a time; selected values remain owned by the experience. */
export default function TileShareFilterToolbar({
	personalStatus = false,
	showPeople = true,
}: {
	personalStatus?: boolean;
	showPeople?: boolean;
}) {
	const state = useShareFilterContext();
	const { t } = useTranslation();
	const id = useId();
	const [peopleQuery, setPeopleQuery] = useState('');
	const [openPopover, setOpenPopover] = useState<'status' | 'response' | 'people' | 'due' | null>(
		null
	);
	const setPopover = (name: NonNullable<typeof openPopover>, open: boolean) =>
		setOpenPopover((current) => (open ? name : current === name ? null : current));
	if (!state) return null;
	const { filters, setFilters, env, active } = state;
	const stageName = (stage: TileletteStatus) =>
		t(`tileShareFilters.stages.${stage}`, stageLabels[stage]);
	const responseName = (response: ShareFilters['responses'][number]) =>
		t(`tileshareRsvp.${response}`, responseLabels[response]);
	const dueName = (due: ShareFilters['due']) =>
		t(`tileShareFilters.dates.${due}`, dueLabels[due]);
	const change = <K extends keyof ShareFilters>(field: K, value: ShareFilters[K]) =>
		setFilters({ ...filters, [field]: value });
	const toggle = (field: 'statuses' | 'responses' | 'people', value: string) => {
		const selected = filters[field] as string[];
		setFilters({
			...filters,
			[field]: selected.includes(value)
				? selected.filter((v) => v !== value)
				: [...selected, value],
		});
	};
	const people = env.people.filter((person) =>
		contactLabel(person)
			.toLocaleLowerCase(env.locale)
			.includes(peopleQuery.trim().toLocaleLowerCase(env.locale))
	);
	return (
		<Toolbar aria-label={t('tileShareFilters.title', 'Filter tilettes')}>
			<SearchLabel htmlFor={`${id}-title`}>
				<Search size={16} aria-hidden="true" />
				<HiddenLabel>{t('tileShareFilters.search', 'Search tilette names')}</HiddenLabel>
				<input
					id={`${id}-title`}
					type="search"
					placeholder={t('tileShareFilters.search', 'Search tilette names')}
					value={filters.query}
					onChange={(event) => change('query', event.target.value)}
				/>
			</SearchLabel>
			<Choices>
				<TileShareFilterPopover
					open={openPopover === 'status'}
					onOpenChange={(open) => setPopover('status', open)}
					label={
						<>
							<Filter size={14} aria-hidden="true" />
							{personalStatus
								? t('tileShareFilters.participantStatus', 'Participant status')
								: t('tileShareFilters.status', 'Status')}
							{filters.statuses.length > 0 &&
								` (${new Intl.NumberFormat(env.locale).format(filters.statuses.length)})`}
						</>
					}
				>
					<fieldset>
						<legend>
							{personalStatus
								? t('tileShareFilters.participantStatus', 'Participant status')
								: t('tileShareFilters.status', 'Status')}
						</legend>
						{stages.map((stage) => (
							<label key={stage}>
								<input
									type="checkbox"
									checked={filters.statuses.includes(stage)}
									onChange={() => toggle('statuses', stage)}
								/>
								{stageName(stage)}
							</label>
						))}
					</fieldset>
				</TileShareFilterPopover>
				<TileShareFilterPopover
					open={openPopover === 'response'}
					onOpenChange={(open) => setPopover('response', open)}
					label={
						<>
							{t('tileShareFilters.response', 'Invitation response')}
							{filters.responses.length > 0 &&
								` (${new Intl.NumberFormat(env.locale).format(filters.responses.length)})`}
						</>
					}
				>
					<fieldset>
						<legend>{t('tileShareFilters.response', 'Invitation response')}</legend>
						{responseFilters.map((response) => (
							<label key={response}>
								<input
									type="checkbox"
									checked={filters.responses.includes(response)}
									onChange={() => toggle('responses', response)}
								/>
								{responseName(response)}
							</label>
						))}
					</fieldset>
				</TileShareFilterPopover>
				{showPeople && (
					<TileShareFilterPopover
						open={openPopover === 'people'}
						onOpenChange={(open) => setPopover('people', open)}
						label={
							<>
								{t('shareExperience.people', 'People')}
								{filters.people.length > 0 &&
									` (${new Intl.NumberFormat(env.locale).format(filters.people.length)})`}
							</>
						}
					>
						<fieldset>
							<legend>{t('shareExperience.people', 'People')}</legend>
							<label htmlFor={`${id}-people`}>
								{t('tileShareFilters.findPeople', 'Find people')}
								<input
									id={`${id}-people`}
									type="search"
									value={peopleQuery}
									onChange={(event) => setPeopleQuery(event.target.value)}
								/>
							</label>
							{people.map((person) => {
								const key = contactKeys(person)[0];
								const aliases = contactKeys(person);
								return (
									<label key={key}>
										<input
											type="checkbox"
											checked={filters.people.some((value) =>
												aliases.includes(value)
											)}
											onChange={() => {
												const selected = filters.people.some((value) =>
													aliases.includes(value)
												);
												change(
													'people',
													selected
														? filters.people.filter(
																(value) => !aliases.includes(value)
															)
														: [...filters.people, key]
												);
											}}
										/>
										{contactLabel(person)}
									</label>
								);
							})}
							{!people.length && (
								<p>{t('tileShareFilters.noPeople', 'No matching people.')}</p>
							)}
						</fieldset>
					</TileShareFilterPopover>
				)}
				<TileShareFilterPopover
					open={openPopover === 'due'}
					onOpenChange={(open) => setPopover('due', open)}
					label={
						<>
							<span>{t('tileShareFilters.due', 'Due date')}</span>
							<small>{dueName(filters.due)}</small>
						</>
					}
				>
					<label htmlFor={`${id}-due`}>
						{t('tileShareFilters.due', 'Due date')}
						<select
							id={`${id}-due`}
							value={filters.due}
							onChange={(event) =>
								change('due', event.target.value as ShareFilters['due'])
							}
						>
							{dueFilters.map((due) => (
								<option key={due} value={due}>
									{dueName(due)}
								</option>
							))}
						</select>
					</label>
					{filters.due === 'custom' && (
						<DateRange>
							<label htmlFor={`${id}-from`}>
								{t('tileShareFilters.from', 'From')}
								<input
									id={`${id}-from`}
									type="date"
									value={filters.from}
									max={filters.to || undefined}
									onChange={(event) => change('from', event.target.value)}
								/>
							</label>
							<label htmlFor={`${id}-to`}>
								{t('tileShareFilters.to', 'Through')}
								<input
									id={`${id}-to`}
									type="date"
									value={filters.to}
									min={filters.from || undefined}
									onChange={(event) => change('to', event.target.value)}
								/>
							</label>
						</DateRange>
					)}
				</TileShareFilterPopover>
			</Choices>
			{active && (
				<Active aria-label={t('tileShareFilters.active', 'Active filters')}>
					{filters.statuses.map((stage) => (
						<button
							type="button"
							key={stage}
							onClick={() => toggle('statuses', stage)}
							aria-label={t('tileShareFilters.remove', 'Remove filter: {{name}}', {
								name: stageName(stage),
							})}
						>
							{stageName(stage)}
							<X size={12} aria-hidden="true" />
						</button>
					))}
					{filters.responses.map((response) => (
						<button
							type="button"
							key={response}
							onClick={() => toggle('responses', response)}
							aria-label={t('tileShareFilters.remove', 'Remove filter: {{name}}', {
								name: responseName(response),
							})}
						>
							{responseName(response)}
							<X size={12} aria-hidden="true" />
						</button>
					))}
					{filters.people.map((key) => {
						const person = env.people.find((person) =>
							contactKeys(person).includes(key)
						);
						const name = person
							? contactLabel(person)
							: t('tileshareRsvp.participant', 'Participant');
						return (
							<button
								type="button"
								key={key}
								onClick={() => toggle('people', key)}
								aria-label={t(
									'tileShareFilters.remove',
									'Remove filter: {{name}}',
									{ name }
								)}
							>
								{name}
								<X size={12} aria-hidden="true" />
							</button>
						);
					})}
					{filters.query.trim() && (
						<button type="button" onClick={() => change('query', '')}>
							{t('tileShareFilters.nameFilter', 'Name: {{name}}', {
								name: filters.query.trim(),
							})}
							<X size={12} aria-hidden="true" />
						</button>
					)}
					{filters.due !== 'any' && (
						<button type="button" onClick={() => change('due', 'any')}>
							{dueName(filters.due)}
							<X size={12} aria-hidden="true" />
						</button>
					)}
					<Button
						variant="ghost"
						onClick={() => {
							setFilters(emptyShareFilters());
							setPeopleQuery('');
						}}
					>
						{t('tileShareFilters.clear', 'Clear filters')}
					</Button>
				</Active>
			)}
		</Toolbar>
	);
}

const HiddenLabel = styled.span`
	position: absolute;
	width: 1px;
	height: 1px;
	overflow: hidden;
	clip-path: inset(50%);
	white-space: nowrap;
`;
const Toolbar = styled.section`
	display: grid;
	gap: 8px;
	min-width: 0;
	color: ${({ theme }) => theme.colors.text.primary};
	input[type='search'] {
		box-sizing: border-box;
		width: 100%;
		min-width: 0;
		padding: 8px 10px;
		min-height: 36px;
		border: 1px solid ${({ theme }) => theme.colors.border.default};
		border-radius: 8px;
		background: ${({ theme }) => theme.colors.background.page};
		color: inherit;
		font: inherit;
		font-size: 13px;
	}
	input:focus-visible,
	button:focus-visible {
		outline: 2px solid ${({ theme }) => theme.colors.button.brand.bg};
		outline-offset: 2px;
	}
`;
const SearchLabel = styled.label`
	display: flex;
	align-items: center;
	gap: 8px;
	min-width: 0;
	> svg {
		flex-shrink: 0;
	}
	input {
		flex: 1;
	}
`;
const Choices = styled.div`
	display: flex;
	align-items: stretch;
	flex-wrap: wrap;
	gap: 8px;
	min-width: 0;
	> button {
		flex: 1 1 auto;
	}
`;
const DateRange = styled.div`
	display: grid;
	gap: 12px;
	margin-top: 12px;
	min-width: 0;
`;
const Active = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
	> button {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 10px;
		border-radius: 20px;
		border: 1px solid ${({ theme }) => theme.colors.border.default};
		background: ${({ theme }) => theme.colors.background.card2};
		color: inherit;
		cursor: pointer;
		font: inherit;
		font-size: 12px;
		max-width: 100%;
		overflow-wrap: anywhere;
	}
`;
