import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import AvatarCluster, { AvatarUser } from '@/core/common/components/AvatarCluster';
import TileshareCreateSelection from './TileshareCreateSelection';

type TileshareToolbarProps = {
	user: AvatarUser;
	onSelectSingle: () => void;
	onSelectMulti: () => void;
	className?: string;
};

const TileshareToolbar: React.FC<TileshareToolbarProps> = ({
	user,
	onSelectSingle,
	onSelectMulti,
	className,
}) => {
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState(false);
	const createButtonRef = useRef<HTMLButtonElement>(null);

	return (
		<Toolbar className={className}>
			<Welcome>
				<AvatarCluster users={[user]} />
				<Greeting>
					<GreetingLine>{t('tilesharedemo.dashboard.toolbar.welcome')}</GreetingLine>
					<UserName>{user.name}</UserName>
				</Greeting>
			</Welcome>
			<CreateButton
				ref={createButtonRef}
				type="button"
				onClick={() => setIsOpen((prev) => !prev)}
				aria-label={t('tilesharedemo.dashboard.toolbar.create')}
				aria-haspopup="menu"
				aria-expanded={isOpen}
			>
				<Plus size={16} />
			</CreateButton>
			<TileshareCreateSelection
				open={isOpen}
				anchorRef={createButtonRef}
				onClose={() => setIsOpen(false)}
				onSelectSingle={onSelectSingle}
				onSelectMulti={onSelectMulti}
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

const GreetingLine = styled.span`
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.secondary};
`;

const UserName = styled.span`
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.primary};
`;

const CreateButton = styled.button`
	height: 36px;
	width: 36px;
	overflow: hidden;
	color: ${({ theme }) => theme.colors.button.brand.text};
	background-color: ${({ theme }) => theme.colors.button.brand.bg};
	border-radius: ${({ theme }) => theme.borderRadius.large};
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover {
		background-color: ${({ theme }) => theme.colors.button.brand.bgHover};
	}
`;

export default TileshareToolbar;
