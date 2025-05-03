import React from 'react';
import styled from 'styled-components';
import styles from '../util/styles';
import { SvgWrapper } from './shared_styled_components';
import { TILER_LOGO } from '../util/constants';
import InstagramLogo from '../assets/image_assets/instagram_logo.png';
import FacebookLogo from '../assets/image_assets/facebook_logo.png';
import LinkedInLogo from '../assets/image_assets/linkedin_logo.png';
import XLogo from '../assets/image_assets/x_logo.png';

const FooterContainer = styled.div`
	background: #1a1a1a80;
	width: 100%;
`;

const FooterSubContainer = styled.div`
	display: flex;
	justify-content: space-between;
	padding: 20px;
	color: ${styles.colors.text};
	width: 1200px;
	margin: 0 auto;
`;

const FooterColumn = styled.div`
	display: flex;
	flex-direction: column;
	text-align: left;
`;

const FooterRow = styled.div`
	margin-bottom: 10px;
`;

const TilerLogo = styled.img`
	width: 100px;
`;

const SocialLogo = styled.img<{ src: string }>`
	width: auto;
	height: 16px;
`;

const FooterLinks = styled.div`
	display: flex;
	gap: 0.5rem;
`;

const FooterLink = styled.a`
	margin-right: 10px;
	text-decoration: none;
	color: ${styles.colors.text};

	&:hover {
		text-decoration: underline;
	}
`;

const FooterSection: React.FC = () => {
	return (
		<FooterContainer>
			<FooterSubContainer>
				<FooterColumn>
					<FooterRow>
						<SvgWrapper align_items="left" justify_content="left">
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
					</FooterRow>
					<FooterRow>
						<p>
							&copy; {new Date().getFullYear()} Tiler. All rights
							reserved.
						</p>
					</FooterRow>
					<FooterLinks>
						<FooterLink
							href="https://www.facebook.com/profile.php?id=100094419297775"
							target="_blank"
							rel="noopener noreferrer"
						>
							<SocialLogo
								src={FacebookLogo}
								alt="Facebook Logo"
							/>
						</FooterLink>
						<FooterLink
							href="https://www.linkedin.com/company/tilerapp"
							target="_blank"
							rel="noopener noreferrer"
						>
							<SocialLogo
								src={LinkedInLogo}
								alt="LinkedIn Logo"
							/>
						</FooterLink>
						<FooterLink
							href="https://www.instagram.com/tiler.app/"
							target="_blank"
							rel="noopener noreferrer"
						>
							<SocialLogo
								src={InstagramLogo}
								alt="Instagram Logo"
							/>
						</FooterLink>
						<FooterLink
							href="https://x.com/Tiler_app"
							target="_blank"
							rel="noopener noreferrer"
						>
							<SocialLogo src={XLogo} alt="X Logo" />
						</FooterLink>
					</FooterLinks>
				</FooterColumn>
				<FooterColumn>
					<FooterRow>Legal</FooterRow>
					<FooterRow>
						<FooterLink
							href="https://tiler.app/tos"
							target="_blank"
							rel="noopener noreferrer"
						>
							Terms of Use
						</FooterLink>
					</FooterRow>
					<FooterRow>
						<FooterLink
							href="https://tiler.app/privacy"
							target="_blank"
							rel="noopener noreferrer"
						>
							Privacy
						</FooterLink>
					</FooterRow>
				</FooterColumn>
			</FooterSubContainer>
		</FooterContainer>
	);
};

export default FooterSection;

