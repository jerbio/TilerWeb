import React from 'react';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import palette from '../core/theme/palette';
import Button from '../core/common/components/button';
import { SvgWrapper } from './shared_styled_components';
import { TILER_LOGO } from '../core/constants/tiler_logo';
import { Menu, X } from 'lucide-react';
import { a } from '@react-spring/web';
import { useTranslation } from 'react-i18next';

const NavigationContainerSticky = styled.div`
	display: flex;
	justify-content: center;
	position: sticky;
	top: 0px;
	z-index: 999;
`;

const NavigationContainer = styled.div`
	width: 100%;
	height: 100px;
	position: relative;
	isolation: isolate;
`;

const NavigationWrapper = styled(a.nav)<{ $shrink: boolean }>`
	display: grid;
	place-items: center;
	padding: 14px 1.5rem;
	backdrop-filter: blur(16px);
	border-radius: ${palette.borderRadius.xxLarge};

	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: calc(100% - 64px);

	border: ${(props) =>
		props.$shrink ? `1px solid ${palette.colors.gray[800]}` : '1px solid transparent'};
	background-color: ${(props) => (props.$shrink ? palette.colors.glass : 'transparent')};
	border-radius: ${(props) => (props.$shrink ? palette.borderRadius.xxLarge : 0)};
	height: ${(props) => (props.$shrink ? '60px' : '80px')};
	max-width: ${(props) => (props.$shrink ? '800px' : '100%')};
	transition: all 0.5s ease-in-out;
`;

const NavigationItemsWrapper = styled.div`
	width: 100%;
	max-width: ${palette.screens.lg};

	display: flex;
	justify-content: space-between;
	align-items: center;
`;

const NavItems = styled.ul`
	display: flex;
	align-items: center;
	gap: 1.5rem;
	list-style: none;
	padding: 0;
	margin: 0;

	@media (max-width: 768px) {
		display: none;
	}
`;

const NavItem = styled.li``;

const NavLink = styled.a`
	color: ${palette.colors.gray[500]};
	text-decoration: none;
	font-size: ${palette.typography.fontSize.sm};
	font-family: ${palette.typography.fontFamily.inter};
	font-weight: ${palette.typography.fontWeight.medium};
	cursor: pointer;
	&:hover {
		color: ${palette.colors.gray[400]};
	}
	transition: color 0.3s ease;
`;

const ButtonsWrapper = styled.div`
	display: flex;
	justify-content: space-evenly;
	align-items: center;
	gap: 1rem;

	@media (max-width: 768px) {
		display: none;
	}
`;

const MobileMenuToggle = styled.div`
	display: none;
	cursor: pointer;

	@media (max-width: 768px) {
		display: block;
	}
`;

const MobileNav = styled.div<{ $isopen: boolean; $shrink: boolean }>`
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	gap: 16px;
	backdrop-filter: blur(16px);
	background-color: ${(props) => (props.$shrink ? palette.colors.glass : '#000000')};

	position: absolute;
	top: 50%;
	left: 50%;
	transform: translateX(-50%);
	z-index: -1;
	width: ${(props) => (props.$shrink ? 'calc(100% - 64px)' : '100%')};
	border-radius: ${(props) =>
		props.$shrink ? `0 0 ${palette.borderRadius.xxLarge} ${palette.borderRadius.xxLarge}` : 0};

	padding: ${({ $isopen: isOpen }) => (isOpen ? '56px 16px 16px' : '0 16px')};
	max-height: ${({ $isopen: isOpen }) => (isOpen ? '300px' : '0')};
	overflow: hidden;
	transition: all 0.5s ease-in-out;

	a {
		padding: 12px 0;
		color: ${palette.colors.text};
		text-decoration: none;
		font-size: ${palette.typography.fontSize.sm};
		&:hover {
			color: ${palette.colors.brand[500]};
		}
	}
`;

const Navigation: React.FC = () => {
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState(false);
	const [isAtTop, setIsAtTop] = useState(true);

	function handleScroll() {
		if (window.scrollY === 0) {
			setIsAtTop(true);
		} else {
			setIsAtTop(false);
		}
	}
	useEffect(() => {
		window.addEventListener('scroll', handleScroll);
		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	}, []);

	return (
		<NavigationContainerSticky>
			<NavigationContainer>
				<NavigationWrapper $shrink={!isAtTop}>
					<NavigationItemsWrapper>
						<SvgWrapper>
							<svg
								width="40"
								height="32"
								viewBox="0 0 40 32"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								xmlnsXlink="http://www.w3.org/1999/xlink"
							>
								<rect
									x="0.100098"
									width="40"
									height="32"
									fill="url(#pattern0_3_11777)"
								/>
								<defs>
									<pattern
										id="pattern0_3_11777"
										patternContentUnits="objectBoundingBox"
										width="1"
										height="1"
									>
										<use
											xlinkHref="#image0_3_11777"
											transform="matrix(0.0074864 0 0 0.0100769 -1.41349 -1.81108)"
										/>
									</pattern>
									<image
										id="image0_3_11777"
										width="512"
										height="512"
										xlinkHref={TILER_LOGO}
									/>
								</defs>
							</svg>
						</SvgWrapper>
						<NavItems>
							<NavItem>
								<NavLink href="/">{t('common.navigation.home')}</NavLink>
							</NavItem>
							<NavItem>
								<NavLink href="/features">
									{t('common.navigation.features')}
								</NavLink>
							</NavItem>
						</NavItems>
						<ButtonsWrapper>
							<Button
								size="small"
								onClick={() => window.open('https://launch.tiler.app/', '_blank')}
								bordergradient={[palette.colors.brand[400]]}
							>
								{t('common.buttons.tryFree')}
							</Button>
							{/* <Button
								size="small"
								variant="secondary"
								onClick={() => window.open('https://tiler.app/?waitlistSignUp=true', '_blank')}
							>
								{t('common.buttons.signUp')}
							</Button> */}
						</ButtonsWrapper>
						<MobileMenuToggle onClick={() => setIsOpen(!isOpen)}>
							{isOpen ? (
								<X size={24} color="white" />
							) : (
								<Menu size={24} color="white" />
							)}
						</MobileMenuToggle>
					</NavigationItemsWrapper>
				</NavigationWrapper>
				<MobileNav $isopen={isOpen} $shrink={!isAtTop}>
					<NavLink href="/">{t('common.navigation.home')}</NavLink>
					<NavLink href="/features">{t('common.navigation.features')}</NavLink>
					<Button
						onClick={() => window.open('https://tiler.app/', '_blank')}
						bordergradient={[palette.colors.brand[500]]}
					>
						{t('common.buttons.tryFree')}
					</Button>
					<Button
						variant="secondary"
						onClick={() =>
							window.open('https://tiler.app/?waitlistSignUp=true', '_blank')
						}
					>
						{t('common.buttons.signUp')}
					</Button>
				</MobileNav>
			</NavigationContainer>
		</NavigationContainerSticky>
	);
};

export default Navigation;
