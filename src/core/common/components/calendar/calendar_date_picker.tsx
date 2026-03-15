import { useCallback, useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import styled from 'styled-components';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type CalendarDatePickerProps = {
  isOpen: boolean;
  onClose: () => void;
  onDateSelect: (date: dayjs.Dayjs) => void;
  startDay: dayjs.Dayjs;
  daysInView: number;
};

const CalendarDatePicker = ({
  isOpen,
  onClose,
  onDateSelect,
  startDay,
  daysInView,
}: CalendarDatePickerProps) => {
  const [displayMonth, setDisplayMonth] = useState(dayjs().startOf('month'));
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset to current view month when opening
  useEffect(() => {
    if (isOpen) {
      setDisplayMonth(startDay.startOf('month'));
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Defer to avoid catching the opening click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const today = dayjs().startOf('day');
  const viewStart = startDay.startOf('day');
  const viewEnd = viewStart.add(daysInView - 1, 'day').startOf('day');

  const prevMonth = useCallback(() => {
    setDisplayMonth((m) => m.subtract(1, 'month'));
  }, []);

  const nextMonth = useCallback(() => {
    setDisplayMonth((m) => m.add(1, 'month'));
  }, []);

  const handleSelect = useCallback(
    (date: dayjs.Dayjs) => {
      onDateSelect(date);
      onClose();
    },
    [onDateSelect, onClose]
  );

  if (!isOpen) return null;

  // Build the 6×7 grid
  const firstOfMonth = displayMonth.startOf('month');
  const gridStart = firstOfMonth.startOf('week');

  // Build day-of-week header labels from locale
  const weekDayLabels: string[] = [];
  for (let i = 0; i < 7; i++) {
    weekDayLabels.push(gridStart.add(i, 'day').format('dd'));
  }

  const rows: dayjs.Dayjs[][] = [];
  let cursor = gridStart;
  for (let week = 0; week < 6; week++) {
    const row: dayjs.Dayjs[] = [];
    for (let d = 0; d < 7; d++) {
      row.push(cursor);
      cursor = cursor.add(1, 'day');
    }
    rows.push(row);
  }

  return (
    <PickerContainer ref={containerRef}>
      <PickerHeader>
        <NavButton onClick={prevMonth}>
          <ChevronLeft size={14} />
        </NavButton>
        <MonthLabel>{displayMonth.format('MMMM')}</MonthLabel>
        <NavButton onClick={nextMonth}>
          <ChevronRight size={14} />
        </NavButton>
      </PickerHeader>
      <DayNamesRow>
        {weekDayLabels.map((label, i) => (
          <DayName key={i}>{label}</DayName>
        ))}
      </DayNamesRow>
      <DatesGrid>
        {rows.map((row, rowIdx) => (
          <WeekRow
            key={rowIdx}
            $isViewedWeek={row.some(
              (d) =>
                (d.isSame(viewStart, 'day') || d.isAfter(viewStart, 'day')) &&
                (d.isSame(viewEnd, 'day') || d.isBefore(viewEnd, 'day'))
            )}
          >
            {row.map((date, colIdx) => {
              const isToday = date.isSame(today, 'day');
              const isOutsideMonth = !date.isSame(displayMonth, 'month');
              const isInViewedWeek =
                (date.isSame(viewStart, 'day') || date.isAfter(viewStart, 'day')) &&
                (date.isSame(viewEnd, 'day') || date.isBefore(viewEnd, 'day'));

              return (
                <DateCell
                  key={colIdx}
                  $isToday={isToday}
                  $isOutsideMonth={isOutsideMonth}
                  $isInViewedWeek={isInViewedWeek}
                  onClick={() => handleSelect(date)}
                >
                  {date.date()}
                </DateCell>
              );
            })}
          </WeekRow>
        ))}
      </DatesGrid>
    </PickerContainer>
  );
};

const PickerContainer = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  z-index: 1100;
  background-color: ${({ theme }) => theme.colors.datepicker.bg};
  border: 1px solid ${({ theme }) => theme.colors.calendar.border};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  padding: 8px;
  width: 224px;
  user-select: none;
`;

const PickerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 0 6px;
  background-color: ${({ theme }) => theme.colors.datepicker.headerBg};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding-inline: 4px;
  margin-bottom: 4px;
`;

const MonthLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.datepicker.headerText};
  text-transform: capitalize;
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  background: transparent;
  color: ${({ theme }) => theme.colors.datepicker.headerButton};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.datepicker.headerButtonHover};
    background-color: ${({ theme }) => theme.colors.datepicker.dateHoverBg};
  }
`;

const DayNamesRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 2px;
`;

const DayName = styled.span`
  text-align: center;
  font-size: 0.625rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.datepicker.dayText};
  padding: 2px 0;
  text-transform: uppercase;
`;

const DatesGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const WeekRow = styled.div<{ $isViewedWeek: boolean }>`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background-color: ${({ $isViewedWeek, theme }) =>
    $isViewedWeek ? theme.colors.datepicker.dateHoverBg : 'transparent'};
`;

const DateCell = styled.button<{
  $isToday: boolean;
  $isOutsideMonth: boolean;
  $isInViewedWeek: boolean;
}>`
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  justify-self: center;
  font-size: 0.6875rem;
  font-weight: 500;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  cursor: pointer;
  background-color: ${({ $isToday, theme }) =>
    $isToday ? theme.colors.datepicker.dateSelectedBg : 'transparent'};
  color: ${({ $isToday, $isOutsideMonth, theme }) => {
    if ($isToday) return theme.colors.datepicker.dateSelectedText;
    if ($isOutsideMonth) return theme.colors.datepicker.dateOutsideMonthText;
    return theme.colors.datepicker.dateText;
  }};
  transition: background-color 0.15s ease, color 0.15s ease;

  &:hover {
    background-color: ${({ $isToday, theme }) =>
      $isToday ? theme.colors.datepicker.dateSelectedBg : theme.colors.datepicker.dateHoverBg};
    color: ${({ $isToday, theme }) =>
      $isToday ? theme.colors.datepicker.dateSelectedText : theme.colors.datepicker.dateHoverText};
  }
`;

export default CalendarDatePicker;
