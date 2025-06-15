import React from 'react'
import Section from '../layout/section';
import Collapse from '../shared/collapse';
import { useTranslation } from 'react-i18next';

const FAQ = () => {
  const { t } = useTranslation();
  
  const FAQItems = [
    {
      title: t('home.faq.items.whatIsTiler.question'),
      content: t('home.faq.items.whatIsTiler.answer')
    },
    {
      title: t('home.faq.items.calendarIntegration.question'),
      content: t('home.faq.items.calendarIntegration.answer')
    },
    {
      title: t('home.faq.items.multipleCalendars.question'),
      content: t('home.faq.items.multipleCalendars.answer')
    },
    {
      title: t('home.faq.items.tileVsBlock.question'),
      content: t('home.faq.items.tileVsBlock.answer')
    },
    {
      title: t('home.faq.items.tileShare.question'),
      content: t('home.faq.items.tileShare.answer')
    },
    {
      title: t('home.faq.items.missedTask.question'),
      content: t('home.faq.items.missedTask.answer')
    },
    {
      title: t('home.faq.items.habitTracking.question'),
      content: t('home.faq.items.habitTracking.answer')
    },
    {
      title: t('home.faq.items.transitFeature.question'),
      content: t('home.faq.items.transitFeature.answer')
    }
  ];

  return (
    <Section>
      <Collapse items={FAQItems} />
    </Section>
  )
}

export default FAQ