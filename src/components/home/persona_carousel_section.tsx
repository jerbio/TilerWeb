import React from 'react';
import styled from 'styled-components';
import SWE from '../../util/image_assets/swe.png';
import Engineer from '../../util/image_assets/engineer.png';
import Healthcare from '../../util/image_assets/healthcare.png';
import Custom from '../../util/image_assets/custom.png';
import PersonaCard from './persona_card';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';

const Container = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	width: 90%;
	margin: 3rem auto;
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
	return (
		<Container>
			<Swiper
				spaceBetween={5}
				centeredSlides={true}
				slidesPerView={3}
				loop={true}
				autoplay={{
					delay: 2500,
					disableOnInteraction: false,
				}}
				modules={[Autoplay]}
				style={{ marginLeft: '5rem' }}
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
