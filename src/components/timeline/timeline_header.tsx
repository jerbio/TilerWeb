import Logo from '@/core/common/components/icons/logo';
import Input from '@/core/common/components/input';
import palette from '@/core/theme/palette';
import { LogOut, Search, User } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useSpring, animated } from '@react-spring/web';
import useAppStore from '@/global_state';
import { useNavigate } from 'react-router';
import Button from '@/core/common/components/button';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const TimelineHeader: React.FC = () => {
  const [profileOpen, setProfileOpen] = React.useState(false);
  const authenticatedUser = useAppStore((state) => state.authenticatedUser);
  const logout = useAppStore((state) => state.logout);
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { t } = useTranslation();
  const spring = useSpring({
    opacity: profileOpen ? 1 : 0,
    scale: profileOpen ? 1 : 0.9,
    config: { tension: 300, friction: 25 },
  });

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        triggerRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    };

    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileOpen]);

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
    <Header>
      <HeaderLeft>
        <Logo size={30} />
        <Input 
          height={36} 
          placeholder={t('timeline.searchPlaceholder')} 
          append={<Search size={18} />} 
        />
      </HeaderLeft>
      <HeaderRight>
        <ProfileTrigger ref={triggerRef} onClick={() => setProfileOpen(!profileOpen)}>
          <ProfileContainer>
            <User size={18} />
          </ProfileContainer>
          <AnimatedProfileMenu
            ref={menuRef}
            style={{
              opacity: spring.opacity,
              transform: spring.scale.to((s) => `scale(${s})`),
              pointerEvents: profileOpen ? 'all' : 'none',
            }}
          >
              <ProfileHeader>
                <ProfileAvatar>
                  <User size={24} />
                </ProfileAvatar>
                <ProfileInfo>
                  <ProfileName>
                    {authenticatedUser?.fullName || authenticatedUser?.firstName || authenticatedUser?.username || t('timeline.userMenu.defaultUsername')}
                  </ProfileName>
                  {authenticatedUser?.email && (
                    <ProfileEmail>{authenticatedUser.email}</ProfileEmail>
                  )}
                </ProfileInfo>
              </ProfileHeader>

              <ProfileDivider />

              <LogoutButton variant="ghost" onClick={handleLogout}>
                <LogOut size={16} color={palette.colors.error[400]} />
                {t('timeline.userMenu.logout')}
              </LogoutButton>
            </AnimatedProfileMenu>
        </ProfileTrigger>
      </HeaderRight>
    </Header>
  );
};

const AnimatedProfileMenu = styled(animated.div)`
  padding: ${palette.space.small} 0;
	position: absolute;
	right: 0;
	top: calc(100% + 1rem);
	background-color: ${palette.colors.gray[900]};
	border-radius: ${palette.borderRadius.large};
	border: 1px solid ${palette.colors.gray[800]};
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
`;

const ProfileAvatar = styled.div`
	height: 48px;
	width: 48px;
	border-radius: ${palette.borderRadius.large};
	background-color: ${palette.colors.gray[800]};
	border: 1px solid ${palette.colors.gray[700]};
	display: flex;
	align-items: center;
	justify-content: center;
	color: ${palette.colors.gray[400]};
	flex-shrink: 0;
`;

const ProfileInfo = styled.div`
	flex: 1;
	min-width: 0;
`;

const ProfileName = styled.div`
	font-size: ${palette.typography.fontSize.base};
	font-weight: ${palette.typography.fontWeight.semibold};
	color: ${palette.colors.white};
	margin-bottom: 0.25rem;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

const ProfileEmail = styled.div`
	font-size: ${palette.typography.fontSize.sm};
	color: ${palette.colors.gray[400]};
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

const ProfileDivider = styled.div`
	height: 1px;
	background-color: ${palette.colors.gray[800]};
	margin: ${palette.space.small} 0;
`;

const LogoutButton = styled(Button)`
`;

const ProfileTrigger = styled.button`
	position: relative;
	background: none;
	border: none;
	cursor: pointer;
	padding: 0;
`;

const ProfileContainer = styled.div`
	height: 36px;
	width: 36px;
	overflow: hidden;
	background-color: ${palette.colors.gray[800]};
	border-radius: ${palette.borderRadius.large};
	border: 1px solid ${palette.colors.gray[700]};
	display: flex;
	align-items: center;
	justify-content: center;
`;

const Header = styled.header`
	height: 64px;
	display: flex;
  gap: 1rem;
	justify-content: space-between;
	align-items: center;
	background-color: ${palette.colors.gray[900]};
	border-bottom: 1px solid ${palette.colors.gray[800]};
	padding-inline: 2rem;
`;

const HeaderLeft = styled.div`
	display: flex;
	gap: 1rem;
	align-items: center;
`;

const HeaderRight = styled.div`
	display: flex;
	gap: 1rem;
	align-items: center;
`;

export default TimelineHeader;
