import React from 'react';
import styled from 'styled-components';
import styles from '../util/styles';
import { SvgWrapper } from './shared_styled_components';
import { TILER_LOGO } from '../util/constants';

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
						<p>&copy; 2023 Tiler. All rights reserved.</p>
					</FooterRow>
					<FooterRow>
						<FooterLink
							href="https://www.facebook.com/tiler"
							target="_blank"
							rel="noopener noreferrer"
						>
							Facebook
						</FooterLink>
						<FooterLink
							href="https://www.linkedin.com/company/tiler"
							target="_blank"
							rel="noopener noreferrer"
						>
							LinkedIn
						</FooterLink>
						<FooterLink
							href="https://www.instagram.com/tiler"
							target="_blank"
							rel="noopener noreferrer"
						>
							Instagram
						</FooterLink>
						<FooterLink
							href="https://www.twitter.com/tiler"
							target="_blank"
							rel="noopener noreferrer"
						>
							X
						</FooterLink>
					</FooterRow>
				</FooterColumn>
				<FooterColumn>
					<FooterRow>
						<FooterLink href="/legal">Legal</FooterLink>
					</FooterRow>
					<FooterRow>
						<FooterLink href="/terms-of-use">
							Terms of Use
						</FooterLink>
					</FooterRow>
					<FooterRow>
						<FooterLink href="/privacy">Privacy</FooterLink>
					</FooterRow>
				</FooterColumn>
			</FooterSubContainer>
		</FooterContainer>
	);
};

export default FooterSection;
