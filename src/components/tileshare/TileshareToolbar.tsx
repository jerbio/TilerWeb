import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import AvatarCluster, { AvatarUser } from '@/core/common/components/AvatarCluster';
import TileshareCreateSelection from './TileshareCreateSelection';
import { TileshareMode } from '@/core/common/types/tileshare';

type TileshareToolbarProps = {
	user: AvatarUser;
	onSelectMode: (mode: TileshareMode) => void;
	className?: string;
};

const TileshareToolbar: React.FC<TileshareToolbarProps> = ({ user, onSelectMode, className }) => {
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState(false);
	const createButtonRef = useRef<HTMLButtonElement>(null);

	return (
		<Toolbar className={className}>
			<Welcome>
				<Greeting>
					<PageTitle>{t('tileshareList.title', 'TileShares')}</PageTitle>
					<GreetingMeta>
						<GreetingLine>{t('tilesharedemo.dashboard.toolbar.welcome')}</GreetingLine>
						<UserName>{user.name}</UserName>
					</GreetingMeta>
				</Greeting>
			</Welcome>
			<RightActions>
				<AvatarCluster users={[user]} />
				<CreateButton
					ref={createButtonRef}
					type="button"
					onClick={() => setIsOpen((prev) => !prev)}
					aria-label={t('tilesharedemo.dashboard.toolbar.create')}
					aria-haspopup="menu"
					aria-expanded={isOpen}
				>
					<Plus size={16} />
					{t('tilesharedemo.dashboard.toolbar.create')}
				</CreateButton>
			</RightActions>
			<TileshareCreateSelection
				open={isOpen}
				anchorRef={createButtonRef}
				onClose={() => setIsOpen(false)}
				onSelectMode={onSelectMode}
			/>
		</Toolbar>
	);
};

const Toolbar = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const Welcome = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const Greeting = styled.div`
	display: flex;
	flex-direction: column;
`;

const PageTitle = styled.h1`
	font-size: 28px;
	font-weight: 650;
	letter-spacing: -0.8px;
	line-height: 1.25;
	margin: 0 0 8px;
`;
const RightActions = styled.div`
	display: flex;
	align-items: center;
	gap: 16px;
	@media (max-width: 600px) {
		& > :first-child {
			display: none;
		}
	}
`;

const GreetingLine = styled.span`
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.secondary};
`;
const GreetingMeta = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	column-gap: 6px;
`;

const UserName = styled.span`
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.primary};
`;

const CreateButton = styled.button`
	height: 42px;
	padding: 0 16px;
	gap: 8px;
	overflow: hidden;
	color: ${({ theme }) => theme.colors.button.brand.text};
	background-color: ${({ theme }) => theme.colors.button.brand.bg};
	border-radius: 10px;
	font-size: 14px;
	font-weight: 600;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover {
		background-color: ${({ theme }) => theme.colors.button.brand.bgHover};
	}
`;

export default TileshareToolbar;
