import React, { useEffect, useState } from 'react';
import SWE from '../../../assets/image_assets/swe.png';
import Engineer from '../../../assets/image_assets/engineer.png';
import Healthcare from '../../../assets/image_assets/healthcare.png';
import Custom from '../../../assets/image_assets/custom.png';
import { Swiper, SwiperClass, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import PersonaCard from './persona_card';
import { useTranslation } from 'react-i18next';

// @ts-expect-error
import 'swiper/css';
import Section from '../../layout/section';
import styled from 'styled-components';
import Button from '../../shared/button';

const FadeRightLeft = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  isolation: isolate;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: clamp(1.5rem, 4vw, 4rem);
    height: 100%;
    background: linear-gradient(
      to right,
      rgba(0, 0, 0, 1),
      rgba(0, 0, 0, 0)
    );
    z-index: 99;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: clamp(1.5rem, 4vw, 4rem);
    height: 100%;
    background: linear-gradient(
      to left,
      rgba(0, 0, 0, 1),
      rgba(0, 0, 0, 0)
    );
    z-index: 99;
  }
  
`;

const PersonaCarousel: React.FC = () => {
  const { t } = useTranslation();
  const personas = [
    {
      key: 0,
      occupation: t('home.persona.custom'),
      image: Custom,
      highlight: true,
    },
    {
      key: 1,
      occupation: t('home.persona.developer'),
      image: SWE,
    },
    {
      key: 2,
      occupation: t('home.persona.healthcare'),
      image: Healthcare,
    },
    {
      key: 3,
      occupation: t('home.persona.engineer'),
      image: Engineer,
    },
    {
      key: 4,
      occupation: t('home.persona.custom'),
      image: Custom,
      highlight: true,
    },
    {
      key: 5,
      occupation: t('home.persona.developer'),
      image: SWE,
    },
    {
      key: 6,
      occupation: t('home.persona.healthcare'),
      image: Healthcare,
    },
    {
      key: 7,
      occupation: t('home.persona.engineer'),
      image: Engineer,
    },
  ];

  const [selectedPersona, setSelectedPersona] = useState<number | null>(null);

  return (
    <Section>
      <FadeRightLeft>
        <Swiper
          modules={[Autoplay]}
          centeredSlides={true}
          slidesPerView={'auto'}
          loop={true}
          autoplay={{
            delay: 2500,
            disableOnInteraction: false,
          }}
          breakpoints={{
            0: {
              slidesPerView: 1,
              navigation: false,
              pagination: { clickable: true },
            },
            768: {
              slidesPerView: 2,
            },
            1100: {
              slidesPerView: 3,
            },
          }}
        >
          {personas.map((persona) => (
            <SwiperSlide key={persona.key} style={{ display: 'grid', placeItems: 'center' }}>
              <PersonaCard
                slideIndex={persona.key}
                occupation={persona.occupation}
                backgroundImage={persona.image}
                gradient={persona.highlight}
                selected={selectedPersona === persona.key}
                setSelected={setSelectedPersona}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </FadeRightLeft>
    </Section>
  );
};

export default PersonaCarousel;
