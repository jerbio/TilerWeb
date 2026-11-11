import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import Button from '@/core/common/components/button';

export default function ShareRefreshNotice({
	error,
	refreshing,
	refresh,
}: {
	error?: Error | null;
	refreshing?: boolean;
	refresh: () => Promise<void>;
}) {
	const { t } = useTranslation();
	if (!error) return null;
	return (
		<Notice role="status">
			<span>
				{t(
					'shareExperience.refreshFailed',
					'Couldn’t refresh. Saved changes are safe; the displayed information may be out of date.'
				)}
			</span>
			<Button
				variant="ghost"
				disabled={refreshing}
				onClick={() => void refresh().catch(() => undefined)}
			>
				{t('shareExperience.refresh', 'Refresh')}
			</Button>
		</Notice>
	);
}
const Notice = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 12px;
	padding: 12px 16px;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: 12px;
	background: ${({ theme }) => theme.colors.background.card};
	color: ${({ theme }) => theme.colors.text.secondary};
`;
