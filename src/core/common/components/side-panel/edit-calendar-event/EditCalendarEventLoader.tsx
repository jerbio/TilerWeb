import React, { useState, useEffect } from 'react';
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
		return <div data-testid="edit-event-loading" />;
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
