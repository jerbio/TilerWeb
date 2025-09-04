import React from 'react';
import palette from '../core/theme/palette';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import InstagramLogo from '@/assets/social/instagram_logo.png';
import FacebookLogo from '@/assets/social/facebook_logo.png';
import LinkedInLogo from '@/assets/social/linkedin_logo.png';
import XLogo from '@/assets/social/x_logo.png';
import FounderUniversity from '../assets/founder_university.png';
import Logo from '@/core/common/components/icons/logo';
import { NavLink } from 'react-router';

const FooterContainer = styled.div`
	border-top: 1px solid ${palette.colors.gray[800]};
	background: #111;
	display: flex;
	justify-content: center;
`;

const FooterSubContainer = styled.div`
	width: 100%;
	max-width: ${palette.container.sizes.xLarge};

	display: flex;
	justify-content: space-between;
	padding-block: ${palette.container.paddingInline.lg};
	margin-inline: ${palette.container.paddingInline.lg};
	color: ${palette.colors.gray[500]};

	@media (max-width: 768px) {
		flex-direction: column-reverse;
		align-items: center;
		text-align: center;
		padding-block: ${palette.container.paddingInline.default};
		margin-inline: ${palette.container.paddingInline.default};
	}
`;

const FooterColumn = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	text-align: left;
	font-size: ${palette.typography.fontSize.sm};

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
	color: ${palette.colors.text};

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
            <NavLink to="/" aria-label="Tiler Home">
              <Logo size={32} />
            </NavLink>
          </FooterRow>

          <p
            style={{
              fontSize: palette.typography.fontSize.sm,
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
          <h3 style={{ color: palette.colors.white }}>{t('common.legal.title')}</h3>

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
