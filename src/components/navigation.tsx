import { useState } from 'react';
import styled from 'styled-components';
import styles from '../util/styles';
import Button from './shared/button';
import { SvgWrapper } from './shared_styled_components';
import { TILER_LOGO } from '../util/constants';
import { Menu, X } from 'lucide-react';

const NavigationContainer = styled.div`
	padding: 1.5rem;
	display: flex;
	justify-content: center;
	position: sticky;
	top: 0px;
	z-index: 999;
	background: transparent;
`;

const NavigationWrapper = styled.nav`
	display: flex;
	justify-content: space-between;
	align-items: center;
	width: 100%;
	padding: 14px 32px;
	max-width: 800px;
	background-color: #1a1a1ad2;
	border: 1px solid #2a2a2a;
	backdrop-filter: blur(16px);
	position: relative;
	border-radius: ${styles.borderRadius.xxLarge};
`;

const NavItems = styled.ul`
	display: flex;
	justify-content: space-evenly;
	align-items: center;
	list-style: none;
	padding: 0;
	margin: 0;
	width: 210px;

	@media (max-width: 768px) {
		display: none;
	}
`;

const NavItem = styled.li``;

const NavLink = styled.a`
	color: ${styles.colors.text};
	text-decoration: none;
	font-size: ${styles.typography.fontSize.sm};
	font-family: ${styles.typography.fontFamily.inter};
	cursor: pointer;
	&:hover {
		color: ${styles.colors.brand[500]};
	}
`;

const ButtonsWrapper = styled.div`
	display: flex;
	justify-content: space-evenly;
	align-items: center;
	width: 210px;

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

const MobileNav = styled.div<{ isOpen: boolean }>`
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	background-color: #1a1a1ad2;
	position: absolute;
	top: 100%;
	left: 0;
	width: 100%;
	padding: ${({ isOpen }) => (isOpen ? '16px' : '0 16px')};
	max-height: ${({ isOpen }) => (isOpen ? '300px' : '0')};
	overflow: hidden;
	transition: all 0.3s ease-in-out;
	z-index: 998;

	a {
		padding: 12px 0;
		color: ${styles.colors.text};
		text-decoration: none;
		font-size: ${styles.typography.fontSize.sm};
		&:hover {
			color: ${styles.colors.brand[500]};
		}
	}
`;

const Navigation = () => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<NavigationContainer>
			<NavigationWrapper>
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
						<NavLink href="/">Home</NavLink>
					</NavItem>
					<NavItem>
						<NavLink href="/features">Features</NavLink>
					</NavItem>
				</NavItems>

				<ButtonsWrapper>
					<Button
						primary={true}
						width="113px"
						onClick={() =>
							window.open('https://launch.tiler.app/', '_blank')
						}
					>
						Try Tiler for free
					</Button>
					<Button
						width="65px"
						onClick={() =>
							window.open(
								'https://tiler.app/?waitlistSignUp=true',
								'_blank'
							)
						}
					>
						Sign Up
					</Button>
				</ButtonsWrapper>

				<MobileMenuToggle onClick={() => setIsOpen(!isOpen)}>
					{isOpen ? (
						<X size={24} color="white" />
					) : (
						<Menu size={24} color="white" />
					)}
				</MobileMenuToggle>
			</NavigationWrapper>

			<MobileNav isOpen={isOpen}>
				<NavLink href="/">Home</NavLink>
				<NavLink href="/features">Features</NavLink>
				<Button
					primary={true}
					width="120px"
					onClick={() => window.open('https://tiler.app/', '_blank')}
				>
					Try Tiler for free
				</Button>
				<Button
					width="120px"
					onClick={() =>
						window.open('https://tiler.app/?waitlistSignUp=true', '_blank')
					}
				>
					Sign Up
				</Button>
			</MobileNav>
		</NavigationContainer>
	);
};

export default Navigation;
