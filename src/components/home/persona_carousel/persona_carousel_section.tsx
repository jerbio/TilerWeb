import React, { useEffect, useState } from 'react';
import SWE from '../../../assets/image_assets/swe.png';
import Engineer from '../../../assets/image_assets/engineer.png';
import Healthcare from '../../../assets/image_assets/healthcare.png';
import Custom from '../../../assets/image_assets/custom.png';
import { Swiper, SwiperClass, SwiperRef, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import PersonaCard from './persona_card';
import { useTranslation } from 'react-i18next';

// @ts-expect-error
import 'swiper/css';
import Section from '../../layout/section';
import styled from 'styled-components';
import useIsMobile from '../../../hooks/useIsMobile';

const FadeRightLeft = styled.div<{ $visible: boolean }>`
	position: relative;
	width: 100%;
	height: 100%;
	isolation: isolate;

	&::before {
		opacity: ${(props) => (props.$visible ? 1 : 0)};
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 1.5rem;
		height: 100%;
		background: linear-gradient(
			to right,
			rgba(0, 0, 0, 1),
			rgba(0, 0, 0, 0)
		);
		z-index: 99;
	}

	&::after {
		opacity: ${(props) => (props.$visible ? 1 : 0)};
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
	];

	const [selectedPersona, setSelectedPersona] = useState<number | null>(null);
	const isMobile = useIsMobile();
	const isTablet = useIsMobile(1100);
	const [slidesPerView, setSlidesPerView] = useState(1);
	const swiperRef = React.useRef<SwiperRef | null>(null);

	function handleUpdateSlides() {
		if (isMobile) {
			setSlidesPerView(1);
			console.log('Mobile view: 1 slide per view');
		} else if (isTablet) {
			setSlidesPerView(2);
			console.log('Tablet view: 2 slides per view');
		} else {
			setSlidesPerView(3);
			console.log('Desktop view: 3 slides per view');
		}
		setTimeout(() => {
			if (swiperRef.current) {
				swiperRef.current.swiper.autoplay.pause();
				swiperRef.current.swiper.autoplay.resume();
				console.log('Swiper updated:', slidesPerView);
			}
		}, 0);
	}
	useEffect(() => {
		handleUpdateSlides();
	}, [isMobile, isTablet]);

	return (
		<Section paddingBlock={0}>
			<FadeRightLeft $visible={selectedPersona === null}>
				<Swiper
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
				>
					{personas.map((persona) => (
						<SwiperSlide
							key={persona.key}
							style={{
								position: 'relative',
								height: 'calc(100svh - 100px)',
								maxHeight: '680px',
								minHeight: '500px',
							}}
						>
							<div
								style={{
									position: 'absolute',
									top: 0,
									height: '100%',
									transform: 'translateX(-50%)',
									left: '50%',
								}}
							>
								<PersonaCard
									slideIndex={persona.key}
									occupation={persona.occupation}
									backgroundImage={persona.image}
									gradient={persona.highlight}
									notCurrentSelected={
										selectedPersona !== null &&
										selectedPersona !== persona.key
									}
									selected={selectedPersona === persona.key}
									setSelected={setSelectedPersona}
								/>
							</div>
						</SwiperSlide>
					))}
				</Swiper>
			</FadeRightLeft>
		</Section>
	);
};

export default PersonaCarousel;

