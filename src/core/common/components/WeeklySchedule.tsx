import React from 'react';
import styled, { css } from 'styled-components';
import { useTranslation } from 'react-i18next';
import TimeDropdown from '@/core/common/components/TimeDropdown';
import type { DaySchedule } from '@/core/common/types/schedule';

export type { DaySchedule };

export enum WeeklyScheduleSize {
	Sm = 'sm',
	Md = 'md',
	Lg = 'lg',
}

interface WeeklyScheduleProps {
	schedule: DaySchedule[];
	onChange: (dayIndex: number, field: 'startTime' | 'endTime', value: string) => void;
	onDayToggle?: (dayIndex: number, selected: boolean) => void;
	size?: WeeklyScheduleSize;
	disabled?: boolean;
	readOnly?: boolean;
	interval?: 15 | 30 | 60;
}

const DAY_LABEL_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({
	schedule,
	onChange,
	onDayToggle,
	size = WeeklyScheduleSize.Md,
	disabled = false,
	readOnly = false,
	interval = 60,
}) => {
	const { t } = useTranslation();
	const isDisabled = disabled || readOnly;

	return (
		<Container $size={size}>
			{DAY_LABEL_KEYS.map((key, index) => {
				const label = t(`settings.sections.tilePreferences.dayLabels.${key}`);
				const day = schedule[index] ?? { dayIndex: index, startTime: '', endTime: '' };
				const isSelected = !!(day.startTime || day.endTime);

				const handleCircleClick = () => {
					if (isDisabled) return;
					if (onDayToggle) {
						onDayToggle(index, !isSelected);
					}
				};

				return (
					<DayColumn key={index} data-testid={`day-column-${index}`} $size={size}>
						<DayCircle
							$size={size}
							$selected={isSelected}
							$clickable={!isDisabled && !!onDayToggle}
							onClick={handleCircleClick}
							data-testid={`day-circle-${index}`}
						>
							<DayLabel data-testid={`day-label-${index}`} $size={size} $selected={isSelected}>
								{label}
							</DayLabel>
						</DayCircle>

						<TimeRow $size={size}>
							<TimeDropdown
								value={day.startTime}
								onChange={(value) => onChange(index, 'startTime', value)}
								placeholder={t('settings.sections.tilePreferences.start')}
								interval={interval}
								disabled={isDisabled}
							/>
						</TimeRow>

						<TimeRow $size={size}>
							<TimeDropdown
								value={day.endTime}
								onChange={(value) => onChange(index, 'endTime', value)}
								placeholder={t('settings.sections.tilePreferences.end')}
								interval={interval}
								disabled={isDisabled}
							/>
						</TimeRow>
					</DayColumn>
				);
			})}
		</Container>
	);
};

// ── Size config ────────────────────────────────────────────────

const sizeConfig = {
	[WeeklyScheduleSize.Sm]: { circle: 28, font: 'xxs' as const, gap: '0.25rem', timeFont: 'xxs' as const },
	[WeeklyScheduleSize.Md]: { circle: 40, font: 'sm' as const, gap: '0.5rem', timeFont: 'xs' as const },
	[WeeklyScheduleSize.Lg]: { circle: 56, font: 'lg' as const, gap: '0.75rem', timeFont: 'sm' as const },
};

// ── Styled Components ──────────────────────────────────────────

const Container = styled.div<{ $size: WeeklyScheduleSize }>`
	display: flex;
	gap: ${({ $size }) => ($size === WeeklyScheduleSize.Sm ? '0.25rem' : $size === WeeklyScheduleSize.Lg ? '1.5rem' : '0.75rem')};
	align-items: flex-start;
	${({ $size }) => $size === WeeklyScheduleSize.Sm && 'width: 100%;'}
`;

const DayColumn = styled.div<{ $size: WeeklyScheduleSize }>`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: ${({ $size }) => sizeConfig[$size].gap};
	${({ $size }) => $size === WeeklyScheduleSize.Sm && 'flex: 1; min-width: 0;'}
`;

const DayCircle = styled.div<{ $size: WeeklyScheduleSize; $selected: boolean; $clickable: boolean }>`
	${({ $size, $selected, $clickable, theme }) => {
		const sz = sizeConfig[$size].circle;
		return css`
			width: ${sz}px;
			height: ${sz}px;
			border-radius: 50%;
			border: 2px solid ${$selected ? theme.colors.brand[500] : theme.colors.gray[400]};
			background: ${$selected ? theme.colors.brand[500] : 'transparent'};
			display: flex;
			align-items: center;
			justify-content: center;
			transition: background 0.15s ease, border-color 0.15s ease;
			${$clickable && css`
				cursor: pointer;
				&:hover {
					border-color: ${theme.colors.brand[400]};
					background: ${$selected ? theme.colors.brand[600] : theme.colors.brand[500] + '1a'};
				}
			`}
		`;
	}}
`;

const DayLabel = styled.span<{ $size: WeeklyScheduleSize; $selected: boolean }>`
	font-size: ${({ $size, theme }) => theme.typography.fontSize[sizeConfig[$size].font]};
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
	color: ${({ $selected, theme }) => $selected ? '#fff' : theme.colors.text.primary};
	user-select: none;
`;

const TimeRow = styled.div<{ $size: WeeklyScheduleSize }>`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 2px;

	select {
		padding: ${({ $size }) =>
			$size === WeeklyScheduleSize.Sm
				? '0.15rem 0.75rem 0.15rem 0.1rem'
				: $size === WeeklyScheduleSize.Lg
				? '0.5rem 2.5rem 0.5rem 1rem'
				: '0.35rem 2rem 0.35rem 0.75rem'};
		font-size: ${({ $size, theme }) => theme.typography.fontSize[sizeConfig[$size].timeFont]};
		${({ $size }) => $size === WeeklyScheduleSize.Sm
			? 'width: 100%; min-width: 0; background-position: right 0.15rem center; background-size: 8px 8px; overflow: hidden; text-overflow: ellipsis;'
			: `min-width: ${$size === WeeklyScheduleSize.Lg ? '120px' : '90px'};`}
	}
`;

export default WeeklySchedule;
