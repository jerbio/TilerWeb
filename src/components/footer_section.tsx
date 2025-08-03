import React from 'react';
import styles from '../util/styles';
import styled from 'styled-components';
import { SvgWrapper } from './shared_styled_components';
import { TILER_LOGO } from '../util/constants';
import InstagramLogo from '../assets/image_assets/instagram_logo.png';
import FacebookLogo from '../assets/image_assets/facebook_logo.png';
import LinkedInLogo from '../assets/image_assets/linkedin_logo.png';
import XLogo from '../assets/image_assets/x_logo.png';
import FounderUniversity from '../assets/image_assets/founder_university.png';
import { useTranslation } from 'react-i18next';

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
	padding-block: ${styles.container.paddingInline.lg};
	margin-inline: ${styles.container.paddingInline.lg};
	color: ${styles.colors.gray[500]};

	@media (max-width: 768px) {
		flex-direction: column-reverse;
		align-items: center;
		text-align: center;
		padding-block: ${styles.container.paddingInline.default};
		margin-inline: ${styles.container.paddingInline.default};
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
	gap: 0.5rem;

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
	const { t } = useTranslation();

	return (
		<FooterContainer>
			<FooterSubContainer>
				<FooterColumn>
					<FooterRow>
						<SvgWrapper $alignitems="left" $justifycontent="left">
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
						{t('common.copyright', { year: new Date().getFullYear() })}
					</p>

					<FooterLinks>
						<FooterLink
							href="https://www.facebook.com/profile.php?id=100094419297775"
							target="_blank"
							rel="noopener noreferrer"
						>
							<SocialLogo src={FacebookLogo} alt={t('common.social.facebook')} />
						</FooterLink>
						<FooterLink
							href="https://www.linkedin.com/company/tilerapp"
							target="_blank"
							rel="noopener noreferrer"
						>
							<SocialLogo src={LinkedInLogo} alt={t('common.social.linkedin')} />
						</FooterLink>
						<FooterLink
							href="https://www.instagram.com/tiler.app/"
							target="_blank"
							rel="noopener noreferrer"
						>
							<SocialLogo src={InstagramLogo} alt={t('common.social.instagram')} />
						</FooterLink>
						<FooterLink
							href="https://x.com/Tiler_app"
							target="_blank"
							rel="noopener noreferrer"
						>
							<SocialLogo src={XLogo} alt={t('common.social.x')} />
						</FooterLink>
					</FooterLinks>
				</FooterColumn>

				<FooterColumn>
					<h3 style={{ color: styles.colors.white }}>{t('common.legal.title')}</h3>

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
							{t('common.legal.terms')}
						</FooterLink>

						<FooterLink
							href="https://tiler.app/privacy"
							target="_blank"
							rel="noopener noreferrer"
						>
							{t('common.legal.privacy')}
						</FooterLink>
					</ul>

					<FooterRow>
						<img
							src={FounderUniversity}
							alt={t('common.partners.founderUniversity')}
							style={{ width: '80px', height: 'auto' }}
						/>
						<span>{t('common.partners.title')}</span>
					</FooterRow>
				</FooterColumn>
			</FooterSubContainer>
		</FooterContainer>
	);
};

export default FooterSection;