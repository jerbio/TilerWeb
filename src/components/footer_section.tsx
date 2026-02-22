import React from 'react';
import palette from '@/core/theme/palette';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import Logo from '@/core/common/components/icons/logo';
import FounderUniversity from '@/assets/founder_university.png';
import { NavLink } from 'react-router';
import apps from '@/core/common/data/apps';
import socials from '@/core/common/data/socials.ts';
import TimeUtil from '@/core/util/time';
import { useConsent } from '@/core/common/components/consent';

const FooterSection: React.FC = () => {
  const { t } = useTranslation();
  const { openSettings } = useConsent();

  return (
    <StyledFooterSection>
      <FooterContainer>
        <FlexSpace>
          <NavLink to="/">
            <Logo size={36} />
          </NavLink>
          <CTALinks>
            {apps.map((app) => (
              <a
                key={app.i18Platform}
                href={app.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src={app.icons.cta} alt={app.i18CTA} height={40} />
              </a>
            ))}
          </CTALinks>
        </FlexSpace>
        <FooterDivider />
        <FlexSpace>
          <FooterLinksBlock
            title="Legal"
            links={[
              {
                href: '/TOS',
                label: t('common.legal.terms'),
              },
              {
                href: '/privacy',
                label: t('common.legal.privacy'),
              },
            ]}
          />
          <FooterLinksBlock
            title={t('common.legal.privacy')}
            links={[
              {
                href: '#',
                label: t('common.consent.footer.cookieSettings'),
                onClick: (e: React.MouseEvent) => {
                  e.preventDefault();
                  openSettings();
                },
              },
            ]}
          />
          <FooterSocialsSection>
            <SocialsContainer>
              {socials.map((social, index) => (
                <React.Fragment key={social.link}>
                  {index !== 0 && <SocialDivider />}
                  <a href={social.link} rel="noopener noreferrer" target="_blank">
                    <SocialLogo src={social.logo} />
                  </a>
                </React.Fragment>
              ))}
            </SocialsContainer>
            <PartnerContainer>
              <span>{t('common.partners.title')}</span>
              <img
                src={FounderUniversity}
                alt={t('common.partners.founderUniversity')}
                width={80}
              />
            </PartnerContainer>
            <FooterCopyright>
              {t('common.copyright', { year: TimeUtil.currentYear() })}
            </FooterCopyright>
          </FooterSocialsSection>
        </FlexSpace>
      </FooterContainer>
    </StyledFooterSection>
  );
};

type FooterLink = {
  href: string;
  label: string;
  onClick?: (e: React.MouseEvent) => void;
};
const FooterLinksBlock: React.FC<{ title: string; links: FooterLink[] }> = ({ title, links }) => {
  return (
    <FooterLinksContainer>
      <FooterLinksTitle>{title}</FooterLinksTitle>
      <FooterLinks>
        {links.map((link) => (
          <li key={link.href}>
            <a 
              href={link.href} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={link.onClick}
            >
              {link.label}
            </a>
          </li>
        ))}
      </FooterLinks>
    </FooterLinksContainer>
  );
};

const StyledFooterSection = styled.div`
	border-top: 1px solid ${palette.colors.gray[800]};
	background-color: #111;
	display: grid;
	place-items: center;
`;

const FooterContainer = styled.div`
	width: 100%;
	max-width: ${palette.container.sizes.xxLarge};

	display: flex;
	gap: 1rem;
	flex-direction: column;
	padding-block: 2rem;
	padding-inline: 1.5rem;

	@media (max-width: ${palette.screens.md}) {
		gap: 2rem;
	}
`;

const PartnerContainer = styled.div`
	display: flex;
	gap: 0.5rem;

	span {
		color: ${palette.colors.gray[500]};
		font-size: ${palette.typography.fontSize.sm};
	}
`;

const FlexSpace = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;

	@media (max-width: ${palette.screens.md}) {
		flex-direction: column;
		gap: 2rem;
	}
`;

const CTALinks = styled.div`
	display: flex;
	gap: 1rem;

	img {
		height: 40px;
	}

	@media (max-width: ${palette.screens.md}) {
		justify-content: center;
	}
`;

const FooterDivider = styled.hr`
	border: none;
	border-top: 1px solid ${palette.colors.border};
	margin: 0;

	@media (max-width: ${palette.screens.md}) {
		display: none;
	}
`;

const FooterLinksContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;

	@media (max-width: ${palette.screens.md}) {
		align-items: center;
	}
`;

const FooterLinksTitle = styled.h4`
	font-size: ${palette.typography.fontSize.sm};
	color: ${palette.colors.white};
	font-weight: ${palette.typography.fontWeight.medium};
	line-height: 1;
`;

const FooterLinks = styled.ul`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;

	li {
		font-size: ${palette.typography.fontSize.xs};
		line-height: 1.2;
		color: ${palette.colors.gray[500]};
		transition: color 0.35s ease;

		&:has(a:hover) {
			color: ${palette.colors.gray[400]};
		}
	}

	@media (max-width: ${palette.screens.md}) {
		align-items: center;
	}
`;

const FooterSocialsSection = styled.div`
	align-items: flex-end;
	display: flex;
	flex-direction: column;
	gap: 1rem;

	@media (max-width: ${palette.screens.md}) {
		align-items: center;
	}
`;

const SocialsContainer = styled.div`
	display: flex;
	gap: 0.5rem;
`;

const SocialDivider = styled.div`
	height: 16px;
	width: 1px;
	background-color: ${palette.colors.gray[800]};
`;

const SocialLogo = styled.img<{ src: string }>`
	width: auto;
	height: 16px;
`;

const FooterCopyright = styled.p`
	color: ${palette.colors.gray[500]};
	font-size: ${palette.typography.fontSize.xs};
`;

export default FooterSection;
