import React from 'react';
import styled from 'styled-components';
import Section from '@/components/layout/section';
import palette from '@/core/theme/palette';
import Logo from '@/core/common/components/icons/logo';
import WaitlistForm from '@/components/waitlist/WaitlistForm';
import WAITLIST_BG_IMAGE from '@/assets/waitlist/timeline-content.webp';
import { useTranslation } from 'react-i18next';
import SEO from '@/core/common/components/SEO';

const Waitlist: React.FC = () => {
	const { t } = useTranslation();

	const structuredData = {
		'@context': 'https://schema.org',
		'@type': 'WebPage',
		name: 'Join Tiler Waitlist - Early Access to Smart Calendar',
		description: 'Join the Tiler waitlist and be among the first to experience intelligent calendar and task management.',
		url: 'https://tiler.app/waitlist',
	};

  return (
    <>
			<SEO
				title="Waitlist - Join Tiler Early Access"
				description="Join the Tiler waitlist and be among the first to experience intelligent calendar and task management. Get early access to smart scheduling features."
				keywords="tiler waitlist, early access, beta signup, calendar app signup, task management beta"
				canonicalUrl="/waitlist"
				structuredData={structuredData}
			/>
      <Section paddingBlock={128}>
        <WaitlistContainer>
          <Logo size={48} />
          <WaitlistContent>
            <WaitlistTitle>
							{t('waitlist.title.part1')} <span>{t('waitlist.title.part2')}</span>
              <br /> {t('waitlist.title.part3')}.
            </WaitlistTitle>
            <WaitlistSubtitle>
							{t('waitlist.subtitle')}
            </WaitlistSubtitle>
          </WaitlistContent>
		  <WBGraphicContainer>
            <img src={WAITLIST_BG_IMAGE} alt="Background" width={602} height={548} />
          </WBGraphicContainer>
          <WaitlistForm />
        </WaitlistContainer>
      </Section>
    </>
  );
};

const WaitlistTitle = styled.h1`
	font-size: ${palette.typography.fontSize.displaySm};
	color: ${palette.colors.gray[200]};
	font-family: ${palette.typography.fontFamily.urban};
	font-weight: ${palette.typography.fontWeight.bold};
	line-height: 1.1;
	text-align: center;

	span {
		color: ${palette.colors.brand[400]};
	}

	@media (min-width: ${palette.screens.md}) {
		font-size: ${palette.typography.fontSize.displayLg};
	}
`;
const WaitlistSubtitle = styled.h2`
	color: ${palette.colors.gray[400]};
	font-size: ${palette.typography.fontSize.sm};
	text-align: center;
	max-width: 450px;

	@media (min-width: ${palette.screens.md}) {
		font-size: ${palette.typography.fontSize.base};
	}
`;

const WaitlistContent = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const WaitlistContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 2rem;
	min-height: calc(100vh - 256px);
`;

const WBGraphicContainer = styled.div`
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translateX(-50%) translateY(-50%);
	filter: blur(15px);
	opacity: 0.25;

	@media (min-width: ${palette.screens.lg}) {
		filter: blur(0px);
		opacity: 0.75;
		top: 0;
		transform: translateX(calc(-50% + 500px)) translateY(200px) skew(-11deg, 6deg);
	}
`;

export default Waitlist;
