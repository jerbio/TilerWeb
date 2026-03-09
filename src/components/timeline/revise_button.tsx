import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import useAppStore from '@/global_state';
import { scheduleService } from '@/services';
import locationService from '@/services/locationService';
import { useUiStore, notificationId, NotificationAction } from '@/core/ui';
import type { ScheduleReviseParams } from '@/core/common/types/schedule';

const REVISE_NOTIFICATION_ID = 'schedule-revise';

interface ReviseButtonProps {
	disabled?: boolean;
	onLoadingChange?: (loading: boolean) => void;
}

const ReviseButton: React.FC<ReviseButtonProps> = ({ disabled, onLoadingChange }) => {
	const { t } = useTranslation();
	const [isLoading, setIsLoading] = useState(false);
	const getActivePersonaSession = useAppStore((s) => s.getActivePersonaSession);
	const showNotification = useUiStore((s) => s.notification.show);
	const updateNotification = useUiStore((s) => s.notification.update);

	const handleRevise = useCallback(async () => {
		if (isLoading) return;
		setIsLoading(true);
		onLoadingChange?.(true);

		const nId = notificationId(NotificationAction.Revise, REVISE_NOTIFICATION_ID);
		showNotification(nId, t('timeline.revise.revising'), 'loading');

		try {
			const locationData = await locationService.getCurrentLocation();
			const locationApi = locationService.toApiFormat(locationData);
			const session = getActivePersonaSession();
			const userInfo = session?.userInfo;

			const params: ScheduleReviseParams = {
				UserLongitude: locationApi.userLongitude,
				UserLatitude: locationApi.userLatitude,
				UserLocationVerified: locationApi.userLocationVerified,
				MobileApp: true,
				SocketId: true,
				TimeZoneOffset: userInfo?.timeZoneDifference ?? 0,
				Version: 'v2',
				TimeZone: userInfo?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
				IsTimeZoneAdjusted: 'true',
			};

			await scheduleService.reviseSchedule(params);
			updateNotification(nId, t('timeline.revise.success'), 'success');
		} catch (error) {
			console.error('Revise failed:', error);
			updateNotification(nId, t('timeline.revise.error'), 'error');
		} finally {
			setIsLoading(false);
			onLoadingChange?.(false);
		}
	}, [isLoading, getActivePersonaSession, showNotification, updateNotification, onLoadingChange, t]);

	return (
		<ReviseIconButton
			onClick={handleRevise}
			disabled={isLoading || disabled}
			aria-label={t('timeline.revise.ariaLabel')}
			title={t('timeline.revise.tooltip')}
		>
			<svg width="20" height="20" viewBox="8 11 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M25.25 13H10.25M13.5833 18H10.25M13.5833 23H10.25M17.75 23C18.2747 23.6996 19.0062 24.2164 19.841 24.4771C20.6757 24.7379 21.5713 24.7294 22.4009 24.4528C23.2306 24.1763 23.9522 23.6457 24.4635 22.9363C24.9748 22.2269 25.25 21.3745 25.25 20.5C25.25 19.5054 24.8549 18.5516 24.1516 17.8483C23.4484 17.1451 22.4946 16.75 21.5 16.75C20.3917 16.75 19.3833 17.2 18.6583 17.925L16.9167 19.6667M16.9167 19.6667V16.3333M16.9167 19.6667H20.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
</svg>
		</ReviseIconButton>
	);
};

const ReviseIconButton = styled.button`
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
	cursor: pointer;
	transition: opacity 0.15s ease;

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	&:hover:not(:disabled) {
		opacity: 0.8;
	}
`;

export default ReviseButton;
