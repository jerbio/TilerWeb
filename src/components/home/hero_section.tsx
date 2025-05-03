import React from 'react';
import styled from 'styled-components';
import SectionHeaders from './section_headers';
import Button from '../shared/button';
import styles from '../../util/styles';

const HeroSectionContainer = styled.div`
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
			/>
			<ButtonContainer>
				<Button
					primary={true}
					width="large"
					onClick={() =>
						window.open('https://tiler.app/account/login', '_blank')
					}
				>
					Get Started with Tiler
				</Button>
				<Button primary={styles.colors.backgroundRed} width="large">
					Learn More
				</Button>
			</ButtonContainer>
		</HeroSectionContainer>
	);
};

export default HeroSection;
