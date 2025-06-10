import React from 'react';
import styled from 'styled-components';
import styles from '../util/styles';
import { SvgWrapper } from './shared_styled_components';
import { TILER_LOGO } from '../util/constants';
import InstagramLogo from '../assets/image_assets/instagram_logo.png';
import FacebookLogo from '../assets/image_assets/facebook_logo.png';
import LinkedInLogo from '../assets/image_assets/linkedin_logo.png';
import XLogo from '../assets/image_assets/x_logo.png';
import FounderUniversity from '../assets/image_assets/founder_university.png';

const FooterContainer = styled.div`
  border-top: 1px solid ${styles.colors.gray[800]};
	background: #111;
  display: flex;
  justify-content: center;
`;

const FooterSubContainer = styled.div`
  width: 100%;
	max-width: ${styles.container.sizes.xLarge};

	display: flex;
	justify-content: space-between;
	padding-block: ${styles.container.padding.lg};
	margin-inline: ${styles.container.padding.lg};
	color: ${styles.colors.gray[500]};

	@media (max-width: 768px) {
		flex-direction: column-reverse;
		align-items: center;
		text-align: center;
		padding-block: ${styles.container.padding.default};
		margin-inline: ${styles.container.padding.default};
	}
`;

const FooterColumn = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	text-align: left;
	font-size: ${styles.typography.fontSize.sm};

	@media (max-width: 768px) {
		margin: 1rem;
		text-align: center;
	}
`;

const FooterRow = styled.div`
	display: flex;
  gap: .5rem;

	@media (max-width: 768px) {
		justify-content: center;
	}
`;

const SocialLogo = styled.img<{ src: string }>`
	width: auto;
	height: 16px;
`;

const FooterLinks = styled.div`
	display: flex;
	gap: 0.5rem;

	@media (max-width: 768px) {
		display: flex;
		justify-content: center;
	}
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

					<p
						style={{
							fontSize: styles.typography.fontSize.sm,
							margin: 'auto 0 0',
						}}
					>
						&copy; {new Date().getFullYear()} Tiler. All rights
						reserved.
					</p>

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
					<h3 style={{ color: styles.colors.white }}>Legal</h3>

					<ul
						style={{
							display: 'flex',
							flexDirection: 'column',
							gap: '0.25rem',
							margin: '0 0 auto',
						}}
					>
						<FooterLink
							href="https://tiler.app/tos"
							target="_blank"
							rel="noopener noreferrer"
						>
							Terms of Use
						</FooterLink>

						<FooterLink
							href="https://tiler.app/privacy"
							target="_blank"
							rel="noopener noreferrer"
						>
							Privacy
						</FooterLink>
					</ul>

					<FooterRow>
						<img
							src={FounderUniversity}
							alt="Founder University Logo"
							style={{ width: '80px', height: 'auto' }}
						/>
						<span>Partners</span>
					</FooterRow>
				</FooterColumn>
			</FooterSubContainer>
		</FooterContainer>
	);
};

export default FooterSection;

