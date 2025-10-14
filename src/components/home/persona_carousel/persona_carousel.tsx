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
	const [personasLoaded, setPersonasLoaded] = useState(false);
  const [personas, setPersonas] = useState<Array<Persona & { key: number }>>([]);
  const { personaUsers, setPersonaUser } = usePersonaUsers();
  const [selectedPersona, setSelectedPersona] = useState<number | null>(null);

  async function getPersonas() {
    try {
      const data = await personaService.getPersonas();
			const preceeding = ['healthcare-persona', 'custom-persona'];
			data.personas.sort((a, b) => {
				const aIndex = preceeding.indexOf(a.id);
				const bIndex = preceeding.indexOf(b.id);
				if (aIndex !== -1 && bIndex !== -1) {
					return aIndex - bIndex;
				} else if (aIndex !== -1) {
					return -1;
				} else if (bIndex !== -1) {
					return 1;
				}
				return 0;
			});

      const personasWithKeys = data.personas.map((persona, index) => ({
        ...persona,
        key: index,
      }));
      setPersonas(personasWithKeys);
			setPersonasLoaded(true);
    } catch (error) {
      console.error("Couldn't populate carousel: ", error);
    }
  }

	useEffect(() => {
		// Update persona names when personaUsers change
		if (personasLoaded) {
			setPersonas((prevPersonas) =>
				prevPersonas.map((persona) => {
					const userInfo = personaUsers[persona.id]?.personaInfo;
					if (userInfo?.name && userInfo.name !== persona.name) {
						return { ...persona, name: userInfo.name };
					}
					return persona;
				})
			);
		}
	}, [personaUsers, personasLoaded]);

  useEffect(() => {
    getPersonas();
  }, []);

  // Listen for custom persona creation event from navigation
  useEffect(() => {
    function handleCreateCustomPersona(event: CustomEvent<{ persona: Partial<Persona> }>) {
      const { persona } = event.detail;
      const customPersona = personas.find((p) => p.id === 'custom-persona');
      if (customPersona) {
        // Update the custom persona with the provided data
        updateSelectedPersona(customPersona.key, {
          id: customPersona.id,
          ...persona,
        });
      }
    }

    window.addEventListener('createCustomPersona', handleCreateCustomPersona as EventListener);
    return () => {
      window.removeEventListener('createCustomPersona', handleCreateCustomPersona as EventListener);
    };
  }, [personas]);

  // Check URL params for custom persona creation on mount
  useEffect(() => {
    if (personasLoaded) {
      const params = new URLSearchParams(window.location.search);
      const isCustomPersona = params.get('customPersona') === 'true';
      const description = params.get('description');
      
      if (isCustomPersona && description) {
        const customPersona = personas.find((p) => p.id === 'custom-persona');
        if (customPersona) {
          // Clear the URL params
          window.history.replaceState({}, '', window.location.pathname);
          // Update the custom persona with the provided data
          updateSelectedPersona(customPersona.key, {
            id: customPersona.id,
            name: description,
            description: description,
          });
        }
      }
    }
  }, [personasLoaded, personas]);

  // Listen for focus custom persona event (when modal opens)
  useEffect(() => {
    function handleFocusCustomPersona() {
      if (swiperRef.current && personas.length) {
        const customPersona = personas.find((p) => p.id === 'custom-persona');
        if (customPersona) {
          // Slide to the custom persona card
          // Since loop is true, we need to use slideToLoop
          swiperRef.current.swiper.slideToLoop(customPersona.key, 500);
          // Pause autoplay when manually navigating
          swiperRef.current.swiper.autoplay.pause();
        }
      }
    }

    window.addEventListener('focusCustomPersona', handleFocusCustomPersona);
    return () => {
      window.removeEventListener('focusCustomPersona', handleFocusCustomPersona);
    };
  }, [personas]);

	// Restart swiper autoplay when personas change
	useEffect(() => {
		if (swiperRef.current && personas.length) {
			swiperRef.current.swiper.autoplay.pause();
			swiperRef.current.swiper.autoplay.resume();
		}
	}, [personas]);

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
      // Note: Persona session is now set in PersonaCardExpanded when a card is expanded
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
    <Section paddingBlock={0} width={2000}>
      <EdgeFadeSwiper
        ref={swiperRef}
        modules={[Autoplay]}
        centeredSlides={true}
        slidesPerView={slidesPerView}
        loop={true}
        autoplay={{
          delay: 2000,
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
