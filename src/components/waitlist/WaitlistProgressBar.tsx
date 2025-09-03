import palette from '@/core/theme/palette';
import React from 'react';
import styled from 'styled-components';

const WaitlistProgressBar: React.FC<{
  steps: Array<{ id: number; name: string; icon: () => JSX.Element }>;
  currentStep: number;
}> = ({ steps, currentStep }) => {
  const STEP_CIRCLE_DIAMETER = 34;
  const STEP_CONNECTOR_WIDTH = 60;
  const progressWidth =
    STEP_CIRCLE_DIAMETER * currentStep + STEP_CONNECTOR_WIDTH * (currentStep - 1) + 22;

  return (
    <ProgressBarContainer>
      <ProgressBarIcons>
        {steps.map((step, index) => (
          <ProgressBarIcon $istouched={currentStep > index} key={step.id}>
            <span>{step.icon()}</span>
          </ProgressBarIcon>
        ))}
      </ProgressBarIcons>
      <svg
        width="360"
        height="38"
        viewBox="0 0 360 38"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <mask
          id="mask0_1996_3978"
          style={{ maskType: 'alpha' }}
          maskUnits="userSpaceOnUse"
          x="21"
          y="0"
          width="318"
          height="38"
        >
          <path
            d="M57.1073 13.3862C54.7487 6.19406 47.9809 1 40 1C30.0589 1 22 9.05887 22 19C22 28.9411 30.0589 37 40 37C47.9809 37 54.7487 31.5784 57.1073 24.3862"
            stroke="#2A2A2A"
          />
          <mask id="path-2-inside-1_1996_3978" fill="white">
            <path d="M56.6074 13H116.607V25H56.6074V13Z" />
          </mask>
          <path
            d="M56.6074 13V14H116.607V13V12H56.6074V13ZM116.607 25V24H56.6074V25V26H116.607V25Z"
            fill="#2A2A2A"
            mask="url(#path-2-inside-1_1996_3978)"
          />
          <path
            d="M150.395 13.3862C148.036 6.19406 141.269 1 133.288 1C125.307 1 118.539 6.19406 116.18 13.3862M150.395 24.3862C148.036 31.5784 141.269 37 133.288 37C125.223 37 118.397 31.6961 116.107 24.3862"
            stroke="#2A2A2A"
          />
          <mask id="path-5-inside-2_1996_3978" fill="white">
            <path d="M149.895 13H209.895V25H149.895V13Z" />
          </mask>
          <path
            d="M149.895 13V14H209.895V13V12H149.895V13ZM209.895 25V24H149.895V25V26H209.895V25Z"
            fill="#2A2A2A"
            mask="url(#path-5-inside-2_1996_3978)"
          />
          <path
            d="M243.683 13.3862C241.324 6.19406 234.556 1 226.575 1C218.594 1 211.827 6.19406 209.468 13.3862M243.683 24.3862C241.324 31.5784 234.556 37 226.575 37C218.51 37 211.684 31.6961 209.395 24.3862"
            stroke="#2A2A2A"
          />
          <mask id="path-8-inside-3_1996_3978" fill="white">
            <path d="M243.183 13H303.183V25H243.183V13Z" />
          </mask>
          <path
            d="M243.183 13V14H303.183V13V12H243.183V13ZM303.183 25V24H243.183V25V26H303.183V25Z"
            fill="#2A2A2A"
            mask="url(#path-8-inside-3_1996_3978)"
          />
          <path
            d="M302.683 24.6138C305.041 31.8059 311.809 37 319.79 37C329.731 37 337.79 28.9411 337.79 19C337.79 9.05887 329.731 1 319.79 1C311.809 1 305.041 6.4216 302.683 13.6138"
            stroke="#2A2A2A"
          />
        </mask>
        <g mask="url(#mask0_1996_3978)">
          <rect x="5.5" width="348" height="38" fill="#2A2A2A" />
          <rect x="0.5" width={progressWidth} height="38" fill="#ED123B" />
        </g>
      </svg>
    </ProgressBarContainer>
  );
};

const ProgressBarIcon = styled.li<{ $istouched: boolean }>`
	height: 36px;
	width: 36px;
	display: flex;
	justify-content: center;
	align-items: center;
	color: ${(props) => (props.$istouched ? palette.colors.white : palette.colors.gray[600])};
transition: color 0.3s ease;

	span {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 28px;
		height: 28px;
		background-color: ${(props) => (props.$istouched ? palette.colors.brand[500] : 'transparent')};
		border-radius: 50%;
transition: background-color 0.3s ease;
	}
}
`;

const ProgressBarIcons = styled.ul`
	position: absolute;
	top: 0;
	left: 22px;
	width: calc(100% - 44px);
	height: 100%;

	display: flex;
	justify-content: space-between;
	align-items: center;
`;

const ProgressBarContainer = styled.div`
	width: 360px;
	margin: 0 auto;
	position: relative;

	@media and screen(min-width: ${palette.screens.md}) {
		transform: scale(1.25);
	}
`;

export default WaitlistProgressBar;
