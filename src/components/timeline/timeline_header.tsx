import Logo from '@/core/common/components/icons/logo';
import { Calendar as CalendarIcon, Moon, Plus, Sun, User } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import dayjs from 'dayjs';
import useAppStore from '@/global_state';
import ProfileSheet from '@/core/common/components/profile_sheet';
import { useTheme } from '@/core/theme/ThemeProvider';
import { Env } from '@/config/config_getter';
import SearchBar from './search_bar';
import ShuffleButton from './shuffle_button';
import ReviseButton from './revise_button';
import ProcrastinateAllButton from './procrastinate_all_button';
import { useCalendarUI } from '@/core/common/components/calendar/calendar-ui.provider';
import { useCalendarDispatch } from '@/core/common/components/calendar/CalendarRequestProvider';
import { CalendarRequestType } from '@/core/common/components/calendar/calendarRequestContext';
import CalendarDatePicker from '@/core/common/components/calendar/calendar_date_picker';

const TimelineHeader: React.FC = () => {
	const [profileSheetOpen, setProfileSheetOpen] = React.useState(false);
	const [isScheduleActionLoading, setIsScheduleActionLoading] = React.useState(false);
	const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
	const authenticatedUser = useAppStore((state) => state.authenticatedUser);
	const menuRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const openCreateTile = useCalendarUI((state) => state.createTile.actions.open);
	const viewInfo = useCalendarUI((state) => state.viewInfo);
	const dispatch = useCalendarDispatch();

	// Close menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				menuRef.current &&
				triggerRef.current &&
				!menuRef.current.contains(event.target as Node) &&
				!triggerRef.current.contains(event.target as Node)
			) {
				setProfileSheetOpen(false);
			}
		};

		if (profileSheetOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [profileSheetOpen]);

	const { isDarkMode, toggleTheme } = useTheme();

	return (
		<Header>
			<HeaderLeft>
				<Logo size={30} />
			</HeaderLeft>
			<SearchBar />
			<HeaderRight>
				<DateNavGroup>
					<TodayButton onClick={() => dispatch({ type: CalendarRequestType.GoToToday })}>
						<span>{dayjs().format('MMM')}</span>
						<span>{dayjs().format('DD')}</span>
					</TodayButton>
					<DatePickerTrigger onClick={() => setIsDatePickerOpen((prev) => !prev)}>
						<CalendarIcon size={14} />
					</DatePickerTrigger>
					<CalendarDatePicker
						isOpen={isDatePickerOpen}
						onClose={() => setIsDatePickerOpen(false)}
						onDateSelect={(date) =>
							dispatch({
								type: CalendarRequestType.NavigateToDate,
								date: date.toISOString(),
							})
						}
						startDay={viewInfo.startDay}
						daysInView={viewInfo.daysInView}
					/>
				</DateNavGroup>
				<ShuffleButton
					disabled={isScheduleActionLoading}
					onLoadingChange={setIsScheduleActionLoading}
				/>
				<ReviseButton
					disabled={isScheduleActionLoading}
					onLoadingChange={setIsScheduleActionLoading}
				/>
				<ProcrastinateAllButton
					disabled={isScheduleActionLoading}
					onLoadingChange={setIsScheduleActionLoading}
				/>
				<CreateEventButton onClick={openCreateTile}>
					<Plus size={16} />
				</CreateEventButton>
				{Env.isDevelopment() && (
					<ThemeToggle onClick={toggleTheme}>
						{isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
					</ThemeToggle>
				)}
				<ProfileTrigger
					ref={triggerRef}
					onClick={() => setProfileSheetOpen(!profileSheetOpen)}
				>
					<ProfileContainer>
						<User size={18} />
					</ProfileContainer>
					<ProfileSheet open={profileSheetOpen} ref={menuRef} user={authenticatedUser} />
				</ProfileTrigger>
			</HeaderRight>
		</Header>
	);
};

const CreateEventButton = styled.button`
	height: 36px;
	width: 36px;
	overflow: hidden;
	color: ${(props) => props.theme.colors.button.brand.text};
	background-color: ${({ theme }) => theme.colors.button.brand.bg};
	border-radius: ${(props) => props.theme.borderRadius.large};
	display: flex;
	align-items: center;
	justify-content: center;
`;

const ThemeToggle = styled.button`
	height: 36px;
	width: 36px;
	overflow: hidden;
	color: ${(props) => props.theme.colors.button.primary.text};
	background-color: ${({ theme }) => theme.colors.button.primary.bg};
	border-radius: ${(props) => props.theme.borderRadius.large};
	border: 1px solid ${(props) => props.theme.colors.border.default};
	display: flex;
	align-items: center;
	justify-content: center;
`;

const ProfileTrigger = styled.div`
	position: relative;
	background: none;
	border: none;
	cursor: pointer;
	padding: 0;
`;

const ProfileContainer = styled.div`
	height: 36px;
	width: 36px;
	overflow: hidden;
	background-color: ${(props) => props.theme.colors.button.primary.bg};
	border-radius: ${(props) => props.theme.borderRadius.large};
	border: 1px solid ${(props) => props.theme.colors.border.default};
	color: ${(props) => props.theme.colors.button.primary.text};
	display: flex;
	align-items: center;
	justify-content: center;
`;

const Header = styled.header`
	height: 64px;
	display: flex;
	gap: 1rem;
	justify-content: space-between;
	align-items: center;
	background-color: ${(props) => props.theme.colors.background.header};
	border-bottom: 1px solid ${(props) => props.theme.colors.border.default};
	padding-inline: 2rem;
`;

const HeaderLeft = styled.div`
	display: flex;
	gap: 1rem;
	align-items: center;
`;

const HeaderRight = styled.div`
	display: flex;
	gap: 1rem;
	align-items: center;
`;

const DateNavGroup = styled.div`
	display: flex;
	align-items: center;
	position: relative;
`;

const TodayButton = styled.button`
	height: 36px;
	padding-inline: 0.5rem;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	font-size: 0.625rem;
	font-weight: 600;
	line-height: 1.1;
	color: ${({ theme }) => theme.colors.button.primary.text};
	background-color: ${({ theme }) => theme.colors.button.primary.bg};
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.large} 0 0
		${({ theme }) => theme.borderRadius.large};
	cursor: pointer;
	white-space: nowrap;
	transition: background-color 0.2s ease;
	text-transform: uppercase;

	&:hover {
		background-color: ${({ theme }) => theme.colors.button.primary.bgHover};
	}
`;

const DatePickerTrigger = styled.button`
	height: 36px;
	width: 36px;
	display: flex;
	align-items: center;
	justify-content: center;
	color: ${({ theme }) => theme.colors.button.primary.text};
	background-color: ${({ theme }) => theme.colors.button.primary.bg};
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-left: none;
	border-radius: 0 ${({ theme }) => theme.borderRadius.large}
		${({ theme }) => theme.borderRadius.large} 0;
	cursor: pointer;
	transition: background-color 0.2s ease;

	&:hover {
		background-color: ${({ theme }) => theme.colors.button.primary.bgHover};
	}
`;

export default TimelineHeader;
