import React from 'react';
import styled from 'styled-components';
import Section from '@/components/layout/section';
import palette from '@/core/theme/palette';
import Logo from '@/core/common/components/icons/logo';
import WaitlistForm from '@/components/waitlist/WaitlistForm';
import WAITLIST_BG_IMAGE from '@/assets/waitlist/timeline-content.webp';

const Waitlist: React.FC = () => {
  return (
    <>
      <Section>
        <WaitlistContainer>
          <Logo size={48} />
          <WaitlistContent>
            <WaitlistTitle>
              Join the <span>Tiler Chat</span>
              <br /> Waitlist Today.
            </WaitlistTitle>
            <WaitlistSubtitle>
              Stop managing your calendar, start talking to it. Get on the waitlist
              and be the first to vibe with time
            </WaitlistSubtitle>
          </WaitlistContent>
          <WaitlistForm />
        </WaitlistContainer>
      </Section>
      <WaitlistBackgroundContainer>
        <WaitlistBackground>
          <WBGraphicContainer>
            <img src={WAITLIST_BG_IMAGE} alt="Background" width={602} height={548} />
          </WBGraphicContainer>
          <WBRedCircle />
          <WBWhiteCircle />
        </WaitlistBackground>
      </WaitlistBackgroundContainer>
    </>
  );
};

const WaitlistTitle = styled.h1`
	font-size: ${palette.typography.fontSize.displaySm};
	color: ${palette.colors.gray[200]};
	font-family: ${palette.typography.fontFamily.urban};
	font-weight: ${palette.typography.fontWeight.bold};
	line-height: 1.1;
	text-align: center;

	span {
		color: ${palette.colors.brand[400]};
	}

	@media (min-width: ${palette.screens.md}) {
		font-size: ${palette.typography.fontSize.displayLg};
	}
`;
const WaitlistSubtitle = styled.h2`
	color: ${palette.colors.gray[400]};
	font-size: ${palette.typography.fontSize.sm};
	text-align: center;
	max-width: 450px;

	@media (min-width: ${palette.screens.md}) {
		font-size: ${palette.typography.fontSize.base};
	}
`;

const WaitlistContent = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const WaitlistContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 2rem;
	min-height: calc(100vh - 196px);
`;

const WaitlistBackgroundContainer = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	z-index: -1;
	background-color: #000;
`;
const WaitlistBackground = styled.div`
	position: relative;
	width: 100%;
	height: 100%;
	overflow: hidden;
`;

const WBGraphicContainer = styled.div`
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translateX(-50%) translateY(-50%);
	filter: blur(15px);
	opacity: 0.25;

	@media (min-width: ${palette.screens.lg}) {
		filter: blur(0px);
		opacity: 0.75;
		top: 0;
		transform: translateX(calc(-50% + 500px)) translateY(200px) skew(-11deg, 6deg);
	}
`;
const WBCircle = styled.div`
	position: absolute;
	top: 0;
	left: 50%;
	transform: translateX(-50%) translateY(-75%);
	width: 100%;
	aspect-ratio: 2 / 1;
	max-width: 1400px;
	border-radius: 50%;
	filter: blur(200px);
`;

const WBRedCircle = styled(WBCircle)`
	background: radial-gradient(
		circle,
		${palette.colors.brand[500] + '49'},
		${palette.colors.brand[500] + '0D'},
		transparent
	);
`;
const WBWhiteCircle = styled(WBCircle)`
	top: auto;
	bottom: 0;
	transform: translateX(-50%) translateY(75%);
	background: radial-gradient(
		circle,
		${palette.colors.gray[500] + '49'},
		${palette.colors.gray[500] + '0D'},
		transparent
	);
`;

export default Waitlist;
