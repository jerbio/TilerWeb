import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { keyframes } from 'styled-components';
import { Loader2 } from 'lucide-react';
import { CalendarEvent } from '@/core/common/types/schedule';
import { scheduleService, userService } from '@/services';
import EditCalendarEvent from './EditCalendarEvent';

interface EditCalendarEventLoaderProps {
	event: CalendarEvent;
	onClose: () => void;
}

interface LoadedData {
	event: CalendarEvent;
	workProfileId: string | null;
	personalProfileId: string | null;
	isLocationVerified: boolean;
}

const EditCalendarEventLoader: React.FC<EditCalendarEventLoaderProps> = ({ event, onClose }) => {
	const { t } = useTranslation();
	const [isLoading, setIsLoading] = useState(true);
	const [loadedData, setLoadedData] = useState<LoadedData | null>(null);

	useEffect(() => {
		let cancelled = false;
		const rootId = (event.id ?? '').split('_')[0] + '_7_0_0';

		Promise.all([
			scheduleService.lookupCalendarEventById(rootId),
			userService.getScheduleProfile().catch(() => null),
		])
			.then(async ([full, scheduleProfile]) => {
				if (cancelled) return;
				const workId = scheduleProfile?.workHoursRestrictionProfile?.id ?? null;
				const personalId = scheduleProfile?.personalHoursRestrictionProfile?.id ?? null;

				let enrichedEvent = full;
				let verified = false;

				if (full.locationId) {
					try {
						const location = await scheduleService.lookupLocationById(full.locationId);
						if (!cancelled) {
							enrichedEvent = {
								...full,
								address: location.address ?? full.address,
								addressDescription: location.description ?? full.addressDescription,
							};
							verified = location.isVerified ?? false;
						}
					} catch {
						// keep full event without location enrichment
					}
				}

				if (!cancelled) {
					setLoadedData({
						event: enrichedEvent,
						workProfileId: workId,
						personalProfileId: personalId,
						isLocationVerified: verified,
					});
					setIsLoading(false);
				}
			})
			.catch(() => {
				if (!cancelled) {
					setLoadedData({
						event,
						workProfileId: null,
						personalProfileId: null,
						isLocationVerified: false,
					});
					setIsLoading(false);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [event.id]); // eslint-disable-line react-hooks/exhaustive-deps

	if (isLoading) {
		return (
			<LoadingContainer data-testid="edit-event-loading">
				<Spinner size={24} />
				<LoadingText>{t('calendarEvent.edit.loading')}</LoadingText>
			</LoadingContainer>
		);
	}

	const data = loadedData!;
	return (
		<EditCalendarEvent
			event={data.event}
			workProfileId={data.workProfileId}
			personalProfileId={data.personalProfileId}
			isLocationVerified={data.isLocationVerified}
			onClose={onClose}
		/>
	);
};

export default EditCalendarEventLoader;

const spin = keyframes`
	from { transform: rotate(0deg); }
	to   { transform: rotate(360deg); }
`;

const LoadingContainer = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	flex: 1;
	height: 100%;
`;

const Spinner = styled(Loader2)`
	animation: ${spin} 1s linear infinite;
	color: ${({ theme }) => theme.colors.text.secondary};
`;

const LoadingText = styled.p`
	text-align: center;
	padding: 0.5rem 0 0;
	color: ${({ theme }) => theme.colors.text.secondary};
	font-size: 0.875rem;
`;
