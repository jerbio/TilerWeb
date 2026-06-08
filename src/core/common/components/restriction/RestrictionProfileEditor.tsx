import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { Check, Copy, ClipboardPaste } from 'lucide-react';
import type { DaySchedule } from '@/core/common/types/schedule';
import TimeDropdown from '@/core/common/components/TimeDropdown';
import TimeUtil from '@/core/util/time';
import { Routes } from '@/core/constants/routes';

export enum RestrictionType {
	Work = 'work',
	Personal = 'personal',
	Custom = 'custom',
}

export interface RestrictionProfileEditorProps {
	/** Whether time restrictions are currently enabled. */
	isRestricted: boolean;
	onIsRestrictedChange: (value: boolean) => void;
	/** Which restriction type is selected (only relevant when isRestricted is true). */
	restrictionType: RestrictionType;
	onRestrictionTypeChange: (value: RestrictionType) => void;
	/** The custom day schedule (only shown when restrictionType === RestrictionType.Custom). */
	customSchedule: DaySchedule[];
	onCustomScheduleChange: (value: DaySchedule[]) => void;
}

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

export const RESTRICTION_TYPE_KEYS: Record<RestrictionType, string> = {
	[RestrictionType.Work]: 'calendarEvent.edit.restrictionTypeWork',
	[RestrictionType.Personal]: 'calendarEvent.edit.restrictionTypePersonal',
	[RestrictionType.Custom]: 'calendarEvent.edit.restrictionTypeCustom',
};

const DAY_LABEL_KEYS: Record<(typeof DAY_KEYS)[number], string> = {
	sun: 'settings.sections.tilePreferences.dayLabels.sun',
	mon: 'settings.sections.tilePreferences.dayLabels.mon',
	tue: 'settings.sections.tilePreferences.dayLabels.tue',
	wed: 'settings.sections.tilePreferences.dayLabels.wed',
	thu: 'settings.sections.tilePreferences.dayLabels.thu',
	fri: 'settings.sections.tilePreferences.dayLabels.fri',
	sat: 'settings.sections.tilePreferences.dayLabels.sat',
};

const KEYS = {
	restrictionEnabled: 'calendarEvent.edit.restrictionEnabled',
	restrictionWorkInfo: 'calendarEvent.edit.restrictionWorkInfo',
	restrictionPersonalInfo: 'calendarEvent.edit.restrictionPersonalInfo',
	restrictionGoToPreferences: 'calendarEvent.edit.restrictionGoToPreferences',
	restrictionDayOff: 'calendarEvent.edit.restrictionDayOff',
	copyTimes: 'settings.sections.tilePreferences.copyTimes',
	pasteTimes: 'settings.sections.tilePreferences.paste',
	cancelCopy: 'settings.sections.tilePreferences.cancelCopy',
} as const;

const DISABLED_TIME_PLACEHOLDER = '—';

const DEFAULT_START_TIME = TimeUtil.minutesFromStartOfDayToMeridian(9 * 60); // '9:00 AM'
const DEFAULT_END_TIME = TimeUtil.minutesFromStartOfDayToMeridian(17 * 60); // '5:00 PM'

const RestrictionProfileEditor: React.FC<RestrictionProfileEditorProps> = ({
	isRestricted,
	onIsRestrictedChange,
	restrictionType,
	onRestrictionTypeChange,
	customSchedule,
	onCustomScheduleChange,
}) => {
	const { t } = useTranslation();
	const [copiedTimes, setCopiedTimes] = useState<{
		startTime: string;
		endTime: string;
		dayIndex: number;
	} | null>(null);

	const handleCopy = (dayIndex: number, startTime: string, endTime: string) => {
		setCopiedTimes({ dayIndex, startTime, endTime });
	};

	const handlePaste = (dayIndex: number) => {
		if (!copiedTimes) return;
		onCustomScheduleChange(
			customSchedule.map((d) =>
				d.dayIndex === dayIndex
					? {
							...d,
							startTime: copiedTimes.startTime,
							endTime: copiedTimes.endTime,
						}
					: d
			)
		);
	};

	const handleDayToggle = (dayIndex: number, currentlySelected: boolean) => {
		onCustomScheduleChange(
			customSchedule.map((d) =>
				d.dayIndex === dayIndex
					? currentlySelected
						? { ...d, startTime: '', endTime: '' }
						: { ...d, startTime: DEFAULT_START_TIME, endTime: DEFAULT_END_TIME }
					: d
			)
		);
	};

	const handleStartTimeChange = (dayIndex: number, val: string) => {
		onCustomScheduleChange(
			customSchedule.map((d) => (d.dayIndex === dayIndex ? { ...d, startTime: val } : d))
		);
	};

	const handleEndTimeChange = (dayIndex: number, val: string) => {
		onCustomScheduleChange(
			customSchedule.map((d) => (d.dayIndex === dayIndex ? { ...d, endTime: val } : d))
		);
	};

	return (
		<>
			<ToggleRow>
				<CheckboxInput
					type="checkbox"
					id="restriction-enabled"
					checked={isRestricted}
					onChange={(e) => onIsRestrictedChange(e.target.checked)}
					aria-label={t(KEYS.restrictionEnabled)}
				/>
				<ToggleLabel htmlFor="restriction-enabled">
					{t(KEYS.restrictionEnabled)}
				</ToggleLabel>
			</ToggleRow>

			{isRestricted && (
				<TypeGroup>
					{Object.values(RestrictionType).map((type) => (
						<TypeOption key={type}>
							<input
								type="radio"
								id={`restriction-type-${type}`}
								name="restriction-type"
								value={type}
								checked={restrictionType === type}
								onChange={() => onRestrictionTypeChange(type)}
								aria-label={t(RESTRICTION_TYPE_KEYS[type])}
							/>
							<label htmlFor={`restriction-type-${type}`}>
								{t(RESTRICTION_TYPE_KEYS[type])}
							</label>
						</TypeOption>
					))}

					{(restrictionType === RestrictionType.Work ||
						restrictionType === RestrictionType.Personal) && (
						<InfoBanner>
							<span>
								{t(
									restrictionType === RestrictionType.Work
										? KEYS.restrictionWorkInfo
										: KEYS.restrictionPersonalInfo
								)}
							</span>
							<PrefsLink
								href={Routes.SettingsPreferences}
								target="_blank"
								rel="noopener noreferrer"
							>
								{t(KEYS.restrictionGoToPreferences)}
							</PrefsLink>
						</InfoBanner>
					)}

					{restrictionType === RestrictionType.Custom && (
						<DayScheduleList data-testid="restriction-day-schedule">
							{customSchedule.map((day) => {
								const isSelected = !!(day.startTime || day.endTime);
								const dayKey = DAY_KEYS[day.dayIndex];
								return (
									<DayRow
										key={day.dayIndex}
										data-testid={`restriction-day-row-${day.dayIndex}`}
									>
										<DayToggle
											type="button"
											$selected={isSelected}
											data-selected={String(isSelected)}
											data-testid={`restriction-day-toggle-${day.dayIndex}`}
											onClick={() =>
												handleDayToggle(day.dayIndex, isSelected)
											}
										>
											{t(DAY_LABEL_KEYS[dayKey])}
										</DayToggle>
										{!isSelected && (
											<OffLabel>{t(KEYS.restrictionDayOff)}</OffLabel>
										)}
										<TimeDropdown
											value={day.startTime}
											onChange={(val) =>
												handleStartTimeChange(day.dayIndex, val)
											}
											interval={60}
											disabled={!isSelected}
											placeholder={DISABLED_TIME_PLACEHOLDER}
										/>
										<TimeDropdown
											value={day.endTime}
											onChange={(val) =>
												handleEndTimeChange(day.dayIndex, val)
											}
											interval={60}
											disabled={!isSelected}
											placeholder={DISABLED_TIME_PLACEHOLDER}
										/>
										<CopyPasteAction>
											{copiedTimes ? (
												copiedTimes.dayIndex === day.dayIndex ? (
													<IconButton
														type="button"
														$active
														onClick={() => setCopiedTimes(null)}
														title={t(KEYS.cancelCopy)}
														aria-label={t(KEYS.cancelCopy)}
														data-testid={`restriction-copy-active-${day.dayIndex}`}
													>
														<Check size={16} />
													</IconButton>
												) : (
													<IconButton
														type="button"
														onClick={() => handlePaste(day.dayIndex)}
														title={t(KEYS.pasteTimes)}
														aria-label={t(KEYS.pasteTimes)}
														data-testid={`restriction-paste-btn-${day.dayIndex}`}
													>
														<ClipboardPaste size={16} />
													</IconButton>
												)
											) : isSelected && day.startTime && day.endTime ? (
												<IconButton
													type="button"
													onClick={() =>
														handleCopy(
															day.dayIndex,
															day.startTime,
															day.endTime
														)
													}
													title={t(KEYS.copyTimes)}
													aria-label={t(KEYS.copyTimes)}
													data-testid={`restriction-copy-btn-${day.dayIndex}`}
												>
													<Copy size={16} />
												</IconButton>
											) : (
												<IconPlaceholder />
											)}
										</CopyPasteAction>
									</DayRow>
								);
							})}
						</DayScheduleList>
					)}
				</TypeGroup>
			)}
		</>
	);
};

export default RestrictionProfileEditor;

/* ── Styled Components ── */

const ToggleRow = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const ToggleLabel = styled.label`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.secondary};
	font-weight: 500;
	cursor: pointer;
`;

const CheckboxInput = styled.input`
	width: 16px;
	height: 16px;
	accent-color: ${({ theme }) => theme.colors.brand[500]};
	cursor: pointer;
`;

const TypeGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	margin-top: 0.5rem;
`;

const TypeOption = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;

	label {
		font-size: ${({ theme }) => theme.typography.fontSize.sm};
		color: ${({ theme }) => theme.colors.text.primary};
		cursor: pointer;
	}
`;

const InfoBanner = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	padding: 0.625rem 0.75rem;
	background: ${({ theme }) => theme.colors.background.card2};
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	color: ${({ theme }) => theme.colors.text.muted};
	margin-top: 0.25rem;
`;

const PrefsLink = styled.a`
	background: none;
	border: none;
	padding: 0;
	cursor: pointer;
	color: ${({ theme }) => theme.colors.brand[500]};
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	text-align: left;
	font-weight: 500;
	text-decoration: none;
	align-self: flex-start;

	&:hover {
		text-decoration: underline;
	}
`;

const DayScheduleList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	margin-top: 0.5rem;
`;

const DayRow = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;

	> select {
		flex: 1;
		height: 32px;
		padding-top: 0;
		padding-bottom: 0;
	}
`;

const OffLabel = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	font-weight: 600;
	color: ${({ theme }) => theme.colors.text.muted};
	text-transform: uppercase;
	letter-spacing: 0.04em;
	flex-shrink: 0;
	width: 22px;
`;

const CopyPasteAction = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	flex-shrink: 0;
`;

const IconButton = styled.button<{ $active?: boolean }>`
	background: none;
	border: none;
	cursor: pointer;
	padding: 2px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 4px;
	color: ${({ $active, theme }) =>
		$active ? theme.colors.brand[500] : theme.colors.text.secondary};
	opacity: 0.7;
	transition:
		opacity 0.15s ease,
		color 0.15s ease;

	&:hover {
		opacity: 1;
		color: ${({ theme }) => theme.colors.brand[400]};
	}
`;

const IconPlaceholder = styled.div`
	width: 16px;
	height: 16px;
`;

const DayToggle = styled.button<{ $selected: boolean }>`
	width: 36px;
	height: 36px;
	border-radius: 50%;
	border: 2px solid
		${({ $selected, theme }) =>
			$selected ? theme.colors.brand[500] : theme.colors.border.default};
	background: ${({ $selected, theme }) => ($selected ? theme.colors.brand[500] : 'transparent')};
	color: ${({ $selected, theme }) => ($selected ? '#ffffff' : theme.colors.text.muted)};
	font-size: 0.625rem;
	font-weight: 600;
	cursor: pointer;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	transition:
		background 0.15s ease,
		border-color 0.15s ease;
`;
