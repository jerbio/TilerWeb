import React from 'react';
import { UserInfo } from '@/global_state';
import { animated, useSpring } from '@react-spring/web';
import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import useAppStore from '@/global_state';
import styled, { useTheme } from 'styled-components';
import { useTranslation } from 'react-i18next';
import Button from './button';

type ProfileSheetProps = {
  user: UserInfo | null;
  open: boolean;
  ref: React.RefObject<HTMLDivElement>;
};

const ProfileSheet: React.FC<ProfileSheetProps> = ({ open, ref, user }) => {
  const logout = useAppStore((state) => state.logout);
  const navigate = useNavigate();
  const { t } = useTranslation();
	const theme = useTheme();

  const openSheetSpring = useSpring({
    opacity: open ? 1 : 0,
    scale: open ? 1 : 0.9,
    config: { tension: 300, friction: 25 },
  });

  const handleLogout = async () => {
    try {
      await logout();
      toast.success(t('timeline.userMenu.signOutSuccess'));
      navigate('/signin');
    } catch (error) {
      toast.error(t('timeline.userMenu.signOutError'));
      console.error('Logout failed:', error);
    }
  };

  return (
    <AnimatedProfileMenu
      ref={ref}
      style={{
        opacity: openSheetSpring.opacity,
        transform: openSheetSpring.scale.to((s) => `scale(${s})`),
        pointerEvents: open ? 'all' : 'none',
      }}
    >
      <ProfileHeader onClick={() => navigate('/settings')}>
        <ProfileAvatar>
          <User size={24} />
        </ProfileAvatar>
        <ProfileInfo>
          <ProfileName>
            {user?.fullName ||
              user?.firstName ||
              user?.username ||
              t('timeline.userMenu.defaultUsername')}
          </ProfileName>
          {user?.email && <ProfileEmail>{user.email}</ProfileEmail>}
        </ProfileInfo>
      </ProfileHeader>

      <ProfileDivider />

      <LogoutButton variant="ghost" onClick={handleLogout}>
        <LogOut size={16} color={theme.colors.error[400]} />
        {t('timeline.userMenu.logout')}
      </LogoutButton>
    </AnimatedProfileMenu>
  );
};

const AnimatedProfileMenu = styled(animated.div)`
	padding: ${props => props.theme.space.small} 0;
	position: absolute;
	right: 0;
	top: calc(100% + 1rem);
	background-color: ${props => props.theme.colors.background.card};
	border-radius: ${props => props.theme.borderRadius.large};
	border: 1px solid ${props => props.theme.colors.border.default};
	min-width: 280px;
	box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
	transform-origin: top right;
	z-index: 1000;
`;

const ProfileHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 1.25rem;
	cursor: pointer;
	transition: background-color 0.2s ease;

	&:hover {
		background-color: ${props => props.theme.colors.background.card2};
	}
`;

const ProfileAvatar = styled.div`
	height: 48px;
	width: 48px;
	border-radius: ${props => props.theme.borderRadius.large};
	background-color: ${props => props.theme.colors.background.card};
	border: 1px solid ${props => props.theme.colors.border.default};
	display: flex;
	align-items: center;
	justify-content: center;
	color: ${props => props.theme.colors.text.secondary};
	flex-shrink: 0;
`;

const ProfileInfo = styled.div`
	flex: 1;
	min-width: 0;
`;

const ProfileName = styled.div`
	font-size: ${props => props.theme.typography.fontSize.base};
	font-weight: ${props => props.theme.typography.fontWeight.semibold};
	color: ${props => props.theme.colors.text.primary};
	margin-bottom: 0.25rem;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

const ProfileEmail = styled.div`
	font-size: ${props => props.theme.typography.fontSize.sm};
	color: ${props => props.theme.colors.text.secondary};
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

const ProfileDivider = styled.div`
	height: 1px;
	background-color: ${props => props.theme.colors.border.default};
	margin: ${props => props.theme.space.small} 0;
`;

const LogoutButton = styled(Button)``;

export default ProfileSheet;
