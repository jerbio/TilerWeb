import styled from 'styled-components';
import styles from '../util/styles';
import Button from './shared/button';
import { SvgWrapper } from './shared_styled_components';
import { TILER_LOGO } from '../util/constants';

const NavigationContainer = styled.div`
	padding: 1.5rem;
  display: flex;
  justify-content: center;
  position: sticky;
  top: 0px;
  z-index: 999;
`;

const NavigationWrapper = styled.nav`
	display: flex;
	justify-content: space-between;
	width: 100%;
	padding: 14px 32px;
	max-width: 800px;
	border-radius: ${styles.borderRadius.xxLarge};
	background-color: #1A1A1Ad2;
	border: 1px solid #2a2a2a;
  backdrop-filter: blur(16px);
`;

const NavItems = styled.ul`
	display: flex;
	justify-content: space-evenly;
	align-items: center;
	list-style: none;
	padding: 0;
	margin: 0;
	width: 210px;
	font-size: ${styles.typography.fontSize.sm};
	font-family: ${styles.typography.fontFamily.inter};
	cursor: pointer;
`;

const ButtonsWrapper = styled.div`
	display: flex;
	justify-content: space-evenly;
	align-items: center;
	width: 210px;
	// border: 1px solid ${styles.colors.border};
`;

const NavItem = styled.li`
  list-style: none;
  margin: 0;
  padding: 0;
`;

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

const Navigation = () => {
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
					<NavItem>
						<NavLink href="/about">About</NavLink>
					</NavItem>
				</NavItems>
				<ButtonsWrapper>
					<Button
						primary={true}
						width="113px"
						onClick={() =>
							window.open('https://tiler.app/', '_blank')
						}
					>
						Try Tiler for free
					</Button>
					<Button
						width="65px"
						onClick={() =>
							window.open(
								'https://tiler.app/account/login',
								'_blank'
							)
						}
					>
						Sign Up
					</Button>
				</ButtonsWrapper>
			</NavigationWrapper>
		</NavigationContainer>
	);
};

export default Navigation;

