import React from 'react';
import { useTranslation } from 'react-i18next';
import SEO from '@/core/common/components/SEO';
import Section from '../components/layout/section';
import {
  PageWrapper,
  Hero,
  Badge,
  HeroTitle,
  HeroSubtitle,
  BackgroundBlur,
} from '../components/discover/shared';
import HowToUseTilerSection from '../components/discover/HowToUseTilerSection';

const Newsletter: React.FC = () => {
  const { t } = useTranslation();

  return (
    <>
      <SEO
        title={t('discover.seo.title')}
        description={t('discover.seo.description')}
        canonicalUrl="/newsletter"
      />
      <Section>
        <BackgroundBlur />
        <PageWrapper>
          <Hero>
            <Badge>{t('discover.hero.badge')}</Badge>
            <HeroTitle>{t('discover.hero.title')}</HeroTitle>
            <HeroSubtitle>{t('discover.hero.subtitle')}</HeroSubtitle>
          </Hero>

          <HowToUseTilerSection />
        </PageWrapper>
      </Section>
    </>
  );
};

export default Newsletter;
