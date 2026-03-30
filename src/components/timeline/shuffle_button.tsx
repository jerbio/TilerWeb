import React, { useCallback, useState } from 'react';
import { Shuffle } from 'lucide-react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import useAppStore from '@/global_state';
import { scheduleService } from '@/services';
import { useUiStore, notificationId, NotificationAction } from '@/core/ui';
import type { ScheduleShuffleParams } from '@/core/common/types/schedule';

const SHUFFLE_NOTIFICATION_ID = 'schedule-shuffle';

interface ShuffleButtonProps {
	disabled?: boolean;
	onLoadingChange?: (loading: boolean) => void;
}

const ShuffleButton: React.FC<ShuffleButtonProps> = ({ disabled, onLoadingChange }) => {
	const { t } = useTranslation();
	const [isLoading, setIsLoading] = useState(false);
	const getActivePersonaSession = useAppStore((s) => s.getActivePersonaSession);
	const showNotification = useUiStore((s) => s.notification.show);
	const updateNotification = useUiStore((s) => s.notification.update);

	const handleShuffle = useCallback(async () => {
		if (isLoading) return;
		setIsLoading(true);
		onLoadingChange?.(true);

		const nId = notificationId(NotificationAction.Shuffle, SHUFFLE_NOTIFICATION_ID);
		showNotification(nId, t('timeline.shuffle.shuffling'), 'loading');

		try {
			const session = getActivePersonaSession();
			const userInfo = session?.userInfo;

			const params: ScheduleShuffleParams = {
				MobileApp: true,
				SocketId: true,
				TimeZoneOffset: userInfo?.timeZoneDifference ?? 0,
				Version: 'v2',
				TimeZone: userInfo?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
				IsTimeZoneAdjusted: 'true',
			};

			await scheduleService.shuffleSchedule(params);
			updateNotification(nId, t('timeline.shuffle.success'), 'success');
		} catch (error) {
			console.error('Shuffle failed:', error);
			updateNotification(nId, t('timeline.shuffle.error'), 'error');
		} finally {
			setIsLoading(false);
			onLoadingChange?.(false);
		}
	}, [
		isLoading,
		getActivePersonaSession,
		showNotification,
		updateNotification,
		onLoadingChange,
		t,
	]);

	return (
		<ShuffleIconButton
			onClick={handleShuffle}
			disabled={isLoading || disabled}
			aria-label={t('timeline.shuffle.ariaLabel')}
			title={t('timeline.shuffle.tooltip')}
		>
			<Shuffle size={16} />
		</ShuffleIconButton>
	);
};

const ShuffleIconButton = styled.button`
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

export default ShuffleButton;
