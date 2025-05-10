import React from 'react';
import styled from 'styled-components';
import SWE from '../../assets/image_assets/swe.png';
import Engineer from '../../assets/image_assets/engineer.png';
import Healthcare from '../../assets/image_assets/healthcare.png';
import Custom from '../../assets/image_assets/custom.png';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import PersonaCard from './persona_card';
import 'swiper/css';

const Container = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	width: 90%;
	margin: 3rem auto;

	@media (max-width: 640px) {
		width: 100%;
		margin: 3rem 0;
	}
`;

const personas = [
	{
		occupation: 'Custom Profile',
		image: Custom,
	},
	{
		occupation: 'Developer',
		image: SWE,
	},
	{
		occupation: 'Healtcare Worker',
		image: Healthcare,
	},
	{
		occupation: 'Engineer',
		image: Engineer,
	},
];

const PersonaCarousel: React.FC = () => {

	const handleSwiperStyle = () => {
		const screenWidth = window.innerWidth;
		// Image width is 315px, so we need to set the margin to center the image in the screen
		// (screenWidth - 315px) / 2 should be the margin. This is for mobile devices.
		if (screenWidth < 640) {
			let centerMargin = (screenWidth - 315) / 2;
			return { marginLeft: `${centerMargin}px` };
		} else {
			return { marginLeft: '5rem' }
		}

		console.log(`Screen width: ${screenWidth}px`);
	}
	return (
		<Container>
			<Swiper
				spaceBetween={5}
				centeredSlides={true}
				slidesPerView={'auto'}
				loop={true}
				autoplay={{
					delay: 2500,
					disableOnInteraction: false,
				}}
				modules={[Autoplay]}
				style={handleSwiperStyle()}
				breakpoints={{
					0: {
						slidesPerView: 1,
						spaceBetween: 10,
						navigation: false,
						pagination: { clickable: true },
					},
					640: {
						slidesPerView: 1,
						spaceBetween: 15,
					},
					1024: {
						slidesPerView: 3,
						spaceBetween: 20,
					},
				}}
			>
				{personas.map((persona, index) => (
					<SwiperSlide key={index}>
						<PersonaCard
							occupation={persona.occupation}
							backgroundImage={persona.image}
						/>
					</SwiperSlide>
				))}
			</Swiper>
		</Container>
	);
};

export default PersonaCarousel;
