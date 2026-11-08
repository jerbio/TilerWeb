import { ChevronLeft, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../button';
import { useCalendarDispatch } from '../calendar/CalendarRequestProvider';
import { CalendarRequestType } from '../calendar/calendarRequestContext';

export default function BackToChatButton({ onReturn }: { onReturn: () => void }) {
	const { t } = useTranslation();
	const dispatch = useCalendarDispatch();
	return (
		<Button
			type="button"
			variant="primary"
			height={44}
			onClick={() => {
				dispatch({ type: CalendarRequestType.ClearSelection });
				onReturn();
			}}
		>
			<ChevronLeft size={16} aria-hidden="true" />
			<MessageCircle size={18} aria-hidden="true" />
			{t('home.expanded.chat.backToChat', 'Back to chat')}
		</Button>
	);
}
