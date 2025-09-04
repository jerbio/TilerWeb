import React, { useEffect, useState } from 'react';
import { Swiper, SwiperRef, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import PersonaCard from './persona_card';
import PersonaCardTemplate from './persona_card_template';

// @ts-expect-error Swiper styles are not typed
import 'swiper/css';
import Section from '../../layout/section';
import styled from 'styled-components';
import useIsMobile from '../../../core/common/hooks/useIsMobile';
import { Persona } from '../../../core/common/types/persona';
import usePersonaUsers from '../../../core/common/hooks/usePersonaUsers';
import { personaService } from '@/services';

const EdgeFadeSwiper = styled(Swiper) <{ $visible: boolean }>`
	position: relative;
	width: 100%;
	height: 100%;
	isolation: isolate;

	&::before,
	&::after {
		content: '';
		position: absolute;
		top: 0;
		width: ${({ $visible }) => ($visible ? '1.5rem' : '.5rem')};
		height: 100%;
		z-index: 10;
		transition: width 0.3s ease-in-out;
	}

	&::before {
		background: linear-gradient(to right, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
		left: 0;
	}

	&::after {
		background: linear-gradient(to left, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
		right: 0;
	}
`;

const PersonaCarousel: React.FC = () => {
  const [personas, setPersonas] = useState<Array<Persona & { key: number }>>([]);
  const { personaUsers, setPersonaUser } = usePersonaUsers();

  async function getPersonas() {
    try {
      const data = await personaService.getPersonas();
      const personasWithKeys = data.personas.map((persona, index) => ({
        ...persona,
        key: index,
      }));
      setPersonas(personasWithKeys);
    } catch (error) {
      console.error("Couldn't populate carousel: ", error);
    }
  }

  useEffect(() => {
    getPersonas();
  }, []);

  const [selectedPersona, setSelectedPersona] = useState<number | null>(null);
  const isMobile = useIsMobile();
  const isTablet = useIsMobile(1100);
  const [slidesPerView, setSlidesPerView] = useState(1);
  const swiperRef = React.useRef<SwiperRef | null>(null);

  function updateSelectedPersona(personaKey: number | null, persona?: Partial<Persona>) {
    if (persona?.id) {
      setPersonas((prev) => {
        return prev.map((prevPersona) => {
          if (prevPersona.id === persona.id) {
            return { ...prevPersona, ...persona };
          }
          return prevPersona;
        });
      });
    }
    requestAnimationFrame(() => {
      setSelectedPersona(personaKey);
    });
  }

  function handleUpdateSlides() {
    if (isMobile) {
      setSlidesPerView(1);
    } else if (isTablet) {
      setSlidesPerView(2);
    } else {
      setSlidesPerView(3);
    }
    setTimeout(() => {
      if (swiperRef.current) {
        swiperRef.current.swiper.autoplay.pause();
        swiperRef.current.swiper.autoplay.resume();
      }
    }, 0);
  }
  useEffect(() => {
    handleUpdateSlides();
  }, [isMobile, isTablet]);

  const swiperStyles: React.CSSProperties = {
    position: 'relative',
    height: 'calc(100svh - 100px)',
    maxHeight: '680px',
    minHeight: '500px',
  };

  const slideContentStyles: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    height: '100%',
    transform: 'translateX(-50%)',
    left: '50%',
  };

  return (
    <Section paddingBlock={0} width={1400}>
      <EdgeFadeSwiper
        ref={swiperRef}
        modules={[Autoplay]}
        centeredSlides={true}
        slidesPerView={slidesPerView}
        loop={true}
        autoplay={{
          delay: 3500,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        $visible={selectedPersona === null}
      >
        {personas.length
          ? personas.map((persona) => (
            <SwiperSlide key={persona.key} style={swiperStyles}>
              <div style={slideContentStyles}>
                <PersonaCard
                  persona={persona}
                  isCustom={['custom-persona'].includes(persona.id)}
                  selectedPersona={selectedPersona}
                  setSelectedPersona={updateSelectedPersona}
                  personaUsers={personaUsers}
                  setPersonaUser={setPersonaUser}
                />
              </div>
            </SwiperSlide>
          ))
          : Array.from({ length: 8 }).map((_, index) => (
            <SwiperSlide key={index} style={swiperStyles}>
              <div style={slideContentStyles}>
                <PersonaCardTemplate />
              </div>
            </SwiperSlide>
          ))}
      </EdgeFadeSwiper>
    </Section>
  );
};

export default PersonaCarousel;
