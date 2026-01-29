import Logo from '@/core/common/components/icons/logo';
import { Moon, Sun, User } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import useAppStore from '@/global_state';
import ProfileSheet from '@/core/common/components/profile_sheet';
import { useTheme } from '@/core/theme/ThemeProvider';

const TimelineHeader: React.FC = () => {
  const [profileSheetOpen, setProfileSheetOpen] = React.useState(false);
  const authenticatedUser = useAppStore((state) => state.authenticatedUser);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        triggerRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setProfileSheetOpen(false);
      }
    };

    if (profileSheetOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileSheetOpen]);

  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <Header>
      <HeaderLeft>
        <Logo size={30} />
      </HeaderLeft>
      <HeaderRight>
        <ThemeToggle onClick={toggleTheme}>
          {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
        </ThemeToggle>
        <ProfileTrigger
          ref={triggerRef}
          onClick={() => setProfileSheetOpen(!profileSheetOpen)}
        >
          <ProfileContainer>
            <User size={18} />
          </ProfileContainer>
          <ProfileSheet open={profileSheetOpen} ref={menuRef} user={authenticatedUser} />
        </ProfileTrigger>
      </HeaderRight>
    </Header>
  );
};

const ThemeToggle = styled.button`
	height: 36px;
	width: 36px;
	overflow: hidden;
	background-color: ${({ theme }) => theme.colors.button.primary.bg};
	border-radius: ${props => props.theme.borderRadius.large};
	border: 1px solid ${props => props.theme.colors.border.default};
	display: flex;
	align-items: center;
	justify-content: center;
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
	background-color: ${(props) => props.theme.colors.background.header};
	border-radius: ${(props) => props.theme.borderRadius.large};
	border: 1px solid ${(props) => props.theme.colors.border.default};
	color: ${(props) => props.theme.colors.text.primary};
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
	background-color: ${(props) => props.theme.colors.background.header};
	border-bottom: 1px solid ${(props) => props.theme.colors.border.default};
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
