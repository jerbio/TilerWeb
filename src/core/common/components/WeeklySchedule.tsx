import React, { useState } from 'react';
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
  const [copiedTimes, setCopiedTimes] = useState<{
    startTime: string;
    endTime: string;
    dayIndex: number;
  } | null>(null);

  const handleCopy = (dayIndex: number, startTime: string, endTime: string) => {
    setCopiedTimes({ startTime, endTime, dayIndex });
  };

  const handlePaste = (dayIndex: number) => {
    if (!copiedTimes) return;
    onChange(dayIndex, 'startTime', copiedTimes.startTime);
    onChange(dayIndex, 'endTime', copiedTimes.endTime);
  };

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
              <DayLabel
                data-testid={`day-label-${index}`}
                $size={size}
                $selected={isSelected}
              >
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
            {!isDisabled && (
              <CopyPasteAction $size={size}>
                {copiedTimes ? (
                  copiedTimes.dayIndex === index ? (
                    <IconButton
                      type="button"
                      $size={size}
                      $active
                      onClick={() => setCopiedTimes(null)}
                      data-testid={`copy-active-${index}`}
                      title={t(
                        'settings.sections.tilePreferences.cancelCopy'
                      )}
                    >
                      <CheckIcon $size={size} />
                    </IconButton>
                  ) : (
                    <IconButton
                      type="button"
                      $size={size}
                      onClick={() => handlePaste(index)}
                      data-testid={`paste-btn-${index}`}
                      title={t('settings.sections.tilePreferences.paste')}
                    >
                      <PasteIcon $size={size} />
                    </IconButton>
                  )
                ) : day.startTime && day.endTime ? (
                  <IconButton
                    type="button"
                    $size={size}
                    onClick={() =>
                      handleCopy(index, day.startTime, day.endTime)
                    }
                    data-testid={`copy-btn-${index}`}
                    title={t('settings.sections.tilePreferences.copyTimes')}
                  >
                    <CopyIcon $size={size} />
                  </IconButton>
                ) : (
                  <IconPlaceholder $size={size} />
                )}
              </CopyPasteAction>
            )}{' '}
          </DayColumn>
        );
      })}
    </Container>
  );
};

// ── Size config ────────────────────────────────────────────────

const sizeConfig = {
  [WeeklyScheduleSize.Sm]: {
    circle: 28,
    font: 'xxs' as const,
    gap: '0.25rem',
    timeFont: 'xxs' as const,
  },
  [WeeklyScheduleSize.Md]: {
    circle: 40,
    font: 'sm' as const,
    gap: '0.5rem',
    timeFont: 'xs' as const,
  },
  [WeeklyScheduleSize.Lg]: {
    circle: 56,
    font: 'lg' as const,
    gap: '0.75rem',
    timeFont: 'sm' as const,
  },
};

// ── Styled Components ──────────────────────────────────────────

const Container = styled.div<{ $size: WeeklyScheduleSize }>`
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	gap: ${({ $size }) =>
    $size === WeeklyScheduleSize.Sm
      ? '0.25rem'
      : $size === WeeklyScheduleSize.Lg
        ? '1.5rem'
        : '0.75rem'};
	align-items: flex-start;
	${({ $size }) => $size === WeeklyScheduleSize.Sm && 'width: 100%;'}

	@media (max-width: ${({ theme }) => theme.screens.md}) {
		grid-template-columns: repeat(4, 1fr);
	}
`;

const DayColumn = styled.div<{ $size: WeeklyScheduleSize }>`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: ${({ $size }) => sizeConfig[$size].gap};
	${({ $size }) => $size === WeeklyScheduleSize.Sm && 'flex: 1; min-width: 0;'}
`;

const DayCircle = styled.div<{
  $size: WeeklyScheduleSize;
  $selected: boolean;
  $clickable: boolean;
}>`
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
			transition:
				background 0.15s ease,
				border-color 0.15s ease;
			${$clickable &&
      css`
				cursor: pointer;
				&:hover {
					border-color: ${theme.colors.brand[400]};
					background: ${$selected
          ? theme.colors.brand[600]
          : theme.colors.brand[500] + '1a'};
				}
			`}
		`;
  }}
`;

const DayLabel = styled.span<{ $size: WeeklyScheduleSize; $selected: boolean }>`
	font-size: ${({ $size, theme }) => theme.typography.fontSize[sizeConfig[$size].font]};
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
	color: ${({ $selected, theme }) => ($selected ? '#fff' : theme.colors.text.primary)};
	user-select: none;
`;

const TimeRow = styled.div<{ $size: WeeklyScheduleSize }>`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 2px;
	width: 100%;

	select {
		padding: ${({ $size }) =>
    $size === WeeklyScheduleSize.Sm
      ? '0.15rem 0.75rem 0.15rem 0.1rem'
      : $size === WeeklyScheduleSize.Lg
        ? '0.5rem 2.5rem 0.5rem 1rem'
        : '0.35rem 2rem 0.35rem 0.75rem'};
		font-size: ${({ $size, theme }) => theme.typography.fontSize[sizeConfig[$size].timeFont]};
		${({ $size }) =>
    $size === WeeklyScheduleSize.Sm
      ? 'width: 100%; min-width: 0; background-position: right 0.15rem center; background-size: 8px 8px; overflow: hidden; text-overflow: ellipsis;'
      : `min-width: ${$size === WeeklyScheduleSize.Lg ? '120px' : '90px'};`}
	}
`;

// ── Copy / Paste Action ────────────────────────────────────────

const iconSizeMap = {
  [WeeklyScheduleSize.Sm]: 14,
  [WeeklyScheduleSize.Md]: 18,
  [WeeklyScheduleSize.Lg]: 24,
};

const CopyPasteAction = styled.div<{ $size: WeeklyScheduleSize }>`
	display: flex;
	justify-content: center;
	min-height: ${({ $size }) => iconSizeMap[$size] + 4}px;
`;

const IconButton = styled.button<{ $size: WeeklyScheduleSize; $active?: boolean }>`
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

const IconPlaceholder = styled.div<{ $size: WeeklyScheduleSize }>`
	width: ${({ $size }) => iconSizeMap[$size]}px;
	height: ${({ $size }) => iconSizeMap[$size]}px;
`;

const CopyIcon: React.FC<{ $size: WeeklyScheduleSize }> = ({ $size }) => {
  const s = iconSizeMap[$size];
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
};

const PasteIcon: React.FC<{ $size: WeeklyScheduleSize }> = ({ $size }) => {
  const s = iconSizeMap[$size];
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
    </svg>
  );
};

const CheckIcon: React.FC<{ $size: WeeklyScheduleSize }> = ({ $size }) => {
  const s = iconSizeMap[$size];
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
};

export default WeeklySchedule;
