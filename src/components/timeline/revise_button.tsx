import React, { useCallback, useState } from 'react';
import { RefreshCw } from 'lucide-react';
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
			<RefreshCw size={16} />
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
