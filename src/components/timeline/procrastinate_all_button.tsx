import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import useAppStore from '@/global_state';
import { scheduleService } from '@/services';
import { useUiStore, notificationId, NotificationAction } from '@/core/ui';
import type { ScheduleProcrastinateAllParams } from '@/core/common/types/schedule';

const PROCRASTINATE_ALL_NOTIFICATION_ID = 'schedule-procrastinate-all';

interface ProcrastinateAllButtonProps {
	disabled?: boolean;
	onLoadingChange?: (loading: boolean) => void;
}

const ProcrastinateAllButton: React.FC<ProcrastinateAllButtonProps> = ({
	disabled,
	onLoadingChange,
}) => {
	const { t } = useTranslation();
	const [isLoading, setIsLoading] = useState(false);
	const [isPickerOpen, setIsPickerOpen] = useState(false);
	const [days, setDays] = useState(0);
	const [hours, setHours] = useState(0);
	const [minutes, setMinutes] = useState(0);
	const containerRef = useRef<HTMLDivElement>(null);
	const isDurationZero = days === 0 && hours === 0 && minutes === 0;
	const getActivePersonaSession = useAppStore((s) => s.getActivePersonaSession);
	const showNotification = useUiStore((s) => s.notification.show);
	const updateNotification = useUiStore((s) => s.notification.update);

	// Close picker on click outside
	useEffect(() => {
		if (!isPickerOpen) return;

		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setIsPickerOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [isPickerOpen]);

	const handleTogglePicker = useCallback(() => {
		if (isLoading || disabled) return;
		setIsPickerOpen((prev) => !prev);
	}, [isLoading, disabled]);

	const handleCancel = useCallback(() => {
		setIsPickerOpen(false);
		setDays(0);
		setHours(0);
		setMinutes(0);
	}, []);

	const handleConfirm = useCallback(async () => {
		if (isLoading) return;
		setIsPickerOpen(false);
		setIsLoading(true);
		onLoadingChange?.(true);

		const nId = notificationId(
			NotificationAction.ProcrastinateAll,
			PROCRASTINATE_ALL_NOTIFICATION_ID
		);
		showNotification(nId, t('timeline.procrastinateAll.deferring'), 'loading');

		try {
			const session = getActivePersonaSession();
			const userInfo = session?.userInfo;

			const totalMs = ((days * 24 + hours) * 60 + minutes) * 60 * 1000;

			const params: ScheduleProcrastinateAllParams = {
				Version: 'v2',
				TimeZone: userInfo?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
				DurationDays: days,
				DurationHours: hours,
				DurationMins: minutes,
				DurationInMs: totalMs,
			};

			await scheduleService.procrastinateAllSchedule(params);
			updateNotification(nId, t('timeline.procrastinateAll.success'), 'success');
		} catch (error) {
			console.error('ProcrastinateAll failed:', error);
			updateNotification(nId, t('timeline.procrastinateAll.error'), 'error');
		} finally {
			setIsLoading(false);
			onLoadingChange?.(false);
			setDays(0);
			setHours(0);
			setMinutes(0);
		}
	}, [
		isLoading,
		days,
		hours,
		minutes,
		getActivePersonaSession,
		showNotification,
		updateNotification,
		onLoadingChange,
		t,
	]);

	return (
		<Container ref={containerRef}>
			<ProcrastinateAllIconButton
				onClick={handleTogglePicker}
				disabled={isLoading || disabled}
				aria-label={t('timeline.procrastinateAll.ariaLabel')}
				title={t('timeline.procrastinateAll.tooltip')}
			>
				<svg
					width="20"
					height="20"
					viewBox="8 9 20 18"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M11.9165 15.5V20.5M15.2498 15.5H17.7498V12.1667L23.5832 18L17.7498 23.8333V20.5H15.2498V15.5Z"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			</ProcrastinateAllIconButton>

			{isPickerOpen && (
				<Overlay role="dialog" aria-label={t('timeline.procrastinateAll.pickerTitle')}>
					<DurationField>
						<DurationInput
							type="number"
							inputMode="numeric"
							min={0}
							max={365}
							value={days}
							onChange={(e) => setDays(Math.max(0, parseInt(e.target.value) || 0))}
							aria-label={t('timeline.procrastinateAll.days')}
						/>
						<UnitLabel>{t('timeline.procrastinateAll.daysShort')}</UnitLabel>
					</DurationField>
					<DurationField>
						<DurationInput
							type="number"
							inputMode="numeric"
							min={0}
							max={23}
							value={hours}
							onChange={(e) =>
								setHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))
							}
							aria-label={t('timeline.procrastinateAll.hours')}
						/>
						<UnitLabel>{t('timeline.procrastinateAll.hoursShort')}</UnitLabel>
					</DurationField>
					<DurationField>
						<DurationInput
							type="number"
							inputMode="numeric"
							min={0}
							max={59}
							value={minutes}
							onChange={(e) =>
								setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))
							}
							aria-label={t('timeline.procrastinateAll.minutes')}
						/>
						<UnitLabel>{t('timeline.procrastinateAll.minutesShort')}</UnitLabel>
					</DurationField>
					<OverlayIconButton
						onClick={handleConfirm}
						disabled={isDurationZero}
						aria-label={t('timeline.procrastinateAll.confirm')}
					>
						<Check size={16} />
					</OverlayIconButton>
					<OverlayIconButton
						onClick={handleCancel}
						aria-label={t('timeline.procrastinateAll.cancel')}
					>
						<X size={16} />
					</OverlayIconButton>
				</Overlay>
			)}
		</Container>
	);
};

/* ── Styled components ────────────────────────────────────────── */

const Container = styled.div`
	position: relative;
`;

const ProcrastinateAllIconButton = styled.button`
	height: 36px;
	width: 36px;
	overflow: hidden;
	color: ${({ theme }) => theme.colors.button.primary.text};
	background-color: ${({ theme }) => theme.colors.button.primary.bg};
	border-radius: ${({ theme }) => theme.borderRadius.large};
	border: 1px solid ${({ theme }) => theme.colors.border.default};
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

const Overlay = styled.div`
	position: absolute;
	right: 0;
	top: 50%;
	transform: translateY(-50%);
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 4px;
	background: ${({ theme }) => theme.colors.background.header};
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
	z-index: 50;
	white-space: nowrap;
`;

const DurationField = styled.div`
	display: flex;
	align-items: center;
	gap: 2px;
`;

const UnitLabel = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.xxs};
	color: ${({ theme }) => theme.colors.text.secondary};
	user-select: none;
	flex-shrink: 0;
	min-width: 10px;
`;

const DurationInput = styled.input`
	width: 40px;
	height: 28px;
	padding: 0 4px;
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	color: ${({ theme }) => theme.colors.text.primary};
	background: ${({ theme }) => theme.colors.background.card};
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.small};
	text-align: center;
	box-sizing: border-box;

	@media (max-width: 480px) {
		width: 48px;
		height: 32px;
	}

	/* Hide number spinners */
	-moz-appearance: textfield;
	&::-webkit-outer-spin-button,
	&::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	&:focus {
		outline: none;
		border-color: ${({ theme }) => theme.colors.brand[500]};
	}
`;

const OverlayIconButton = styled.button`
	height: 28px;
	width: 28px;
	display: flex;
	align-items: center;
	justify-content: center;
	color: ${({ theme }) => theme.colors.button.primary.text};
	background-color: ${({ theme }) => theme.colors.button.primary.bg};
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.small};
	cursor: pointer;
	padding: 0;
	flex-shrink: 0;

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	&:hover:not(:disabled) {
		opacity: 0.8;
	}
`;

export default ProcrastinateAllButton;
