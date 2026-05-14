import { Env } from '@/config/config_getter';
import Logo from '@/core/common/components/icons/logo';
import ProfileSheet from '@/core/common/components/profile_sheet';
import appRoutes from '@/core/common/data/appRoutes';
import appLayoutConfig from '@/core/constants/app_layout_config';
import { useTheme } from '@/core/theme/ThemeProvider';
import useAppStore from '@/global_state';
import { Moon, Sun, User } from 'lucide-react';
import React, { useRef, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import styled from 'styled-components';

const AppLayout: React.FC = () => {
	const [profileSheetOpen, setProfileSheetOpen] = React.useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLDivElement>(null);
	const { isDarkMode, toggleTheme } = useTheme();

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

	const authenticatedUser = useAppStore((state) => state.authenticatedUser);
	const { pathname } = useLocation();

	return (
		<Container>
			<Header>
				<HeaderLeft>
					<Logo size={30} />
				</HeaderLeft>
				<HeaderRight>
					<Navigation>
						{appRoutes.map((route, index) => (
							<React.Fragment key={route.name}>
								<Link to={route.path} style={{ textDecoration: 'none' }}>
									<NavigationLink active={pathname.startsWith(route.path)}>
										{route.name}
										{route.icon}
									</NavigationLink>
								</Link>
								{index === appRoutes.length - 1 ? null : <Separator />}
							</React.Fragment>
						))}
					</Navigation>
					{Env.isDevelopment() && (
						<ThemeToggle onClick={toggleTheme}>
							{isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
						</ThemeToggle>
					)}
					<ProfileTrigger
						ref={triggerRef}
						onClick={() => setProfileSheetOpen(!profileSheetOpen)}
					>
						<ProfileContainer>
							<User size={18} />
						</ProfileContainer>
						<ProfileSheet
							open={profileSheetOpen}
							ref={menuRef}
							user={authenticatedUser}
						/>
					</ProfileTrigger>
				</HeaderRight>
			</Header>
			<Outlet />
		</Container>
	);
};

const Navigation = styled.div`
	display: flex;
	align-items: center;
	border-radius: ${(props) => props.theme.borderRadius.large};
	height: 44px;
	border: 1px solid ${(props) => props.theme.colors.border.default};
	padding: 0 0.25rem;
	background-color: ${(props) => props.theme.colors.plain};
`;

const Separator = styled.div`
	width: 1px;
	height: 60%;
	background-color: ${(props) => props.theme.colors.border.default};
	margin-inline: 0.25rem;
`;

const NavigationLink = styled.button<{ active: boolean }>`
	font-family: ${(props) => props.theme.typography.fontFamily.urban};
	font-weight: ${(props) => props.theme.typography.fontWeight.semibold};
	font-size: ${(props) => props.theme.typography.fontSize.sm};
	cursor: pointer;
	color: ${(props) =>
		props.active ? props.theme.colors.text.primary : props.theme.colors.text.secondary};
	display: flex;
	gap: 8px;
	align-items: center;
	background-color: ${(props) =>
		props.active ? props.theme.colors.background.card2 : 'transparent'};
	height: 36px;
	padding: 0 12px;
	border-radius: ${(props) => props.theme.borderRadius.medium};
	border: 1px solid
		${(props) => (props.active ? props.theme.colors.border.default : 'transparent')};
`;

const Container = styled.div`
	height: 100vh;
	position: relative;
	isolation: isolate;
	display: flex;
	flex-direction: column;
`;

const ThemeToggle = styled.button`
	height: 44px;
	width: 44px;
	overflow: hidden;
	color: ${(props) => props.theme.colors.button.primary.text};
	background-color: ${({ theme }) => theme.colors.button.primary.bg};
	border-radius: ${(props) => props.theme.borderRadius.large};
	border: 1px solid ${(props) => props.theme.colors.border.default};
	display: flex;
	align-items: center;
	justify-content: center;
`;

const ProfileTrigger = styled.div`
	position: relative;
	background: none;
	border: none;
	cursor: pointer;
	padding: 0;
`;

const ProfileContainer = styled.div`
	height: 44px;
	width: 44px;
	overflow: hidden;
	background-color: ${(props) => props.theme.colors.button.primary.bg};
	border-radius: ${(props) => props.theme.borderRadius.large};
	border: 1px solid ${(props) => props.theme.colors.border.default};
	color: ${(props) => props.theme.colors.button.primary.text};
	display: flex;
	align-items: center;
	justify-content: center;
`;

const Header = styled.header`
	z-index: 2;
	height: ${appLayoutConfig.NAV_HEIGHT}px;
	width: 100%;
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

export default AppLayout;
