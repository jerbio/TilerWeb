import React from 'react';
import styled from 'styled-components';
import SectionHeaders from './section_headers';
import Button from '../shared/button';
import ArrowRight from '../../assets/image_assets/icons/arrow_right.svg';
import styles from '../../util/styles';

const HeroSectionContainer = styled.div`
	margin: 4rem auto;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 20px;
`;

const ButtonContainer = styled.div`
	display: flex;
	gap: 10px;
	margin-top: 20px;
`;

const HeroSection: React.FC = () => {
	return (
		<HeroSectionContainer>
			<SectionHeaders
				headerText="Visualize Your Schedule, Simplify Your Life."
				subHeaderText="The ultimate tool for creating personalized and interactive timelines."
				align="center"
				size="large"
			/>
			<ButtonContainer>
				<Button
					onClick={() =>
						window.open('https://tiler.app/account/login', '_blank')
					}
					borderGradient={[
						'#FC278780',
						'#2C90FC80',
						'#B8FD3380',
						'#FEC83780',
					]}
				>
					<span>Get Started with Tiler</span>
					<img src={ArrowRight} alt="Arrow Right" />
				</Button>
				<Button variant="brand">Learn More</Button>
			</ButtonContainer>
		</HeroSectionContainer>
	);
};

export default HeroSection;

