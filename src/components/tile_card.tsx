import React from 'react';
import styled from 'styled-components';
import styles from '../util/styles';
import { TileCardProps } from '../util/interface';

const TileWrapper = styled.div<{ background_color: string, index?: number }>`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	border-radius: 0.5rem;
	width: 300px;
	height: 101px;
	border-radius: ${styles.borderRadius.xLarge};
	border: 1px solid #2a2a2a;
	color: ${styles.colors.text};
	background: ${(props) =>
		`linear-gradient(102.27deg, rgba(26, 26, 26, 0.1) 41.07%, ${props.background_color}80 124.88%)`}; /* Added opacity */
	margin-right: 20px;

	h2 {
		font-size: ${styles.typography.textMd};
		font-weight: 600;
		margin: 0 0.75rem;
		margin-top: 1rem;
		padding: 3px 5px 0 5px;
		line-height: 19.36px;
	}

	span {
		display: flex;
		align-items: center;
		margin: 0 0.75rem;
		margin-top: 0.1rem;
		padding: 3px 5px 0 5px;
		svg {
			margin: 0;
		}
	}

	p {
		font-size: ${styles.typography.textSm};
		margin: 0 0.25rem;
		padding: 0;
	}
`;

const TileCard: React.FC<TileCardProps> = ({
	heading,
	location,
	startTime,
	endTime,
	background_color,
	index,
}) => {
	return (
		<TileWrapper background_color={background_color} index={index}>
			<h2>{heading}</h2>
			<span>
				<svg
					width="13"
					height="16"
					viewBox="0 0 13 16"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M6.40017 0C4.70332 0.00190574 3.07652 0.676819 1.87667 1.87667C0.676819 3.07652 0.00190574 4.70332 0 6.40017C0 9.00423 1.89045 11.1667 3.8929 13.4556C4.52652 14.1804 5.18254 14.93 5.76655 15.6884C5.84129 15.7854 5.93727 15.8639 6.04712 15.9179C6.15697 15.9719 6.27775 16 6.40017 16C6.52258 16 6.64336 15.9719 6.75321 15.9179C6.86306 15.8639 6.95905 15.7854 7.03378 15.6884C7.6178 14.93 8.27382 14.1804 8.90743 13.4556C10.9099 11.1667 12.8003 9.00423 12.8003 6.40017C12.7984 4.70332 12.1235 3.07652 10.9237 1.87667C9.72381 0.676819 8.09701 0.00190574 6.40017 0ZM6.40017 8.80023C5.92548 8.80023 5.46145 8.65947 5.06676 8.39575C4.67208 8.13202 4.36445 7.75718 4.1828 7.31863C4.00114 6.88008 3.95361 6.3975 4.04622 5.93194C4.13883 5.46637 4.36741 5.03872 4.70307 4.70307C5.03872 4.36741 5.46637 4.13883 5.93194 4.04622C6.3975 3.95361 6.88008 4.00114 7.31863 4.1828C7.75719 4.36445 8.13202 4.67207 8.39575 5.06676C8.65947 5.46145 8.80023 5.92548 8.80023 6.40017C8.80023 7.0367 8.54737 7.64717 8.09727 8.09727C7.64717 8.54737 7.0367 8.80023 6.40017 8.80023Z"
						fill="#ED123B"
					/>
				</svg>
				<p>{location}</p>
			</span>
			<span>
				<svg
					width="16"
					height="17"
					viewBox="0 0 16 17"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M8 3.7C7.89494 3.69997 7.79089 3.72065 7.69382 3.76084C7.59675 3.80103 7.50855 3.85996 7.43425 3.93425C7.35996 4.00855 7.30104 4.09675 7.26084 4.19382C7.22065 4.29089 7.19997 4.39493 7.2 4.5V7.11406L6.32187 6.60703C6.13809 6.50107 5.91976 6.47243 5.71487 6.52741C5.50998 6.58239 5.33531 6.71648 5.22926 6.9002C5.12321 7.08393 5.09446 7.30225 5.14933 7.50716C5.2042 7.71208 5.3382 7.88682 5.52187 7.99297L7.6 9.19297C7.72163 9.26319 7.8596 9.30015 8.00004 9.30015C8.14048 9.30014 8.27845 9.26316 8.40006 9.19293C8.52168 9.1227 8.62267 9.02169 8.69288 8.90005C8.76308 8.77841 8.80003 8.64044 8.8 8.5V4.5C8.80003 4.39493 8.77935 4.29089 8.73916 4.19382C8.69897 4.09675 8.64004 4.00855 8.56575 3.93425C8.49145 3.85996 8.40325 3.80103 8.30618 3.76084C8.20911 3.72065 8.10507 3.69997 8 3.7ZM8 0.5C6.41775 0.5 4.87103 0.969192 3.55544 1.84824C2.23985 2.72729 1.21447 3.97672 0.608967 5.43853C0.00346631 6.90034 -0.15496 8.50887 0.153721 10.0607C0.462403 11.6126 1.22433 13.038 2.34315 14.1569C3.46197 15.2757 4.88743 16.0376 6.43928 16.3463C7.99113 16.655 9.59966 16.4965 11.0615 15.891C12.5233 15.2855 13.7727 14.2602 14.6518 12.9446C15.5308 11.629 16 10.0822 16 8.5C15.9976 6.37901 15.1539 4.34559 13.6542 2.84582C12.1544 1.34606 10.121 0.502426 8 0.5ZM8 14.9C6.7342 14.9 5.49683 14.5246 4.44435 13.8214C3.39188 13.1182 2.57157 12.1186 2.08717 10.9492C1.60277 9.77972 1.47603 8.4929 1.72298 7.25142C1.96992 6.00994 2.57946 4.86957 3.47452 3.97452C4.36957 3.07946 5.50994 2.46992 6.75142 2.22297C7.9929 1.97603 9.27973 2.10277 10.4492 2.58717C11.6186 3.07157 12.6182 3.89187 13.3214 4.94435C14.0246 5.99682 14.4 7.2342 14.4 8.5C14.3981 10.1968 13.7231 11.8235 12.5233 13.0233C11.3235 14.2231 9.69679 14.8981 8 14.9Z"
						fill="#ED123B"
					/>
				</svg>
				<p>
					{startTime} - {endTime}
				</p>
			</span>
		</TileWrapper>
	);
};

export default TileCard;
