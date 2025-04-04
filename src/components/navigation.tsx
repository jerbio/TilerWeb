import styled from 'styled-components';
import styles from '../util/styles';
import Button from './button';
import { SvgWrapper } from './shared_styled_components';
import { TILER_LOGO } from '../util/constants';

const NavigationWrapper = styled.nav`
	display: flex;
	justify-content: space-around;
	width: 800px;
	height: 60px;
	border-radius: ${styles.borderRadius.xxLarge};
	background: #1a1a1a80;
	border: 1px solid #2a2a2a;
	margin: 0 auto;
`;

const NavItems = styled.ul`
	display: flex;
	justify-content: space-evenly;
	align-items: center;
	list-style: none;
	padding: 0;
	margin: 0;
	width: 210px;
	font-size: ${styles.typography.textSm};
	font-family: ${styles.typography.fontFamily};
	cursor: pointer;
`;
const ButtonsWrapper = styled.div`
	display: flex;
	justify-content: space-evenly;
	align-items: center;
	width: 210px;
	// border: 1px solid ${styles.colors.border};
`;
const Navigation = () => {
	return (
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
				<li className="nav-item">
					<a href="#about" style={{ color: 'inherit', textDecoration: 'none' }}>About Tiler</a>
				</li>
				<li className="nav-item">
					<a href="#contact" style={{ color: 'inherit', textDecoration: 'none' }}>Contact</a>
				</li>
				<li className="nav-item">
					<a href="#download" style={{ color: 'inherit', textDecoration: 'none' }}>Download</a>
				</li>
			</NavItems>
			<ButtonsWrapper>
				<Button primary={true} width="113px" onClick={() => window.open('https://tiler.app/', '_blank')}>
					Try Tiler for free
				</Button>
				<Button width="65px" onClick={() => window.open('https://tiler.app/account/login', '_blank')}>Sign Up</Button>
			</ButtonsWrapper>
		</NavigationWrapper>
	);
};

export default Navigation;
