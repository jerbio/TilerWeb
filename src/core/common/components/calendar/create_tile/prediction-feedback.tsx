import styled, { keyframes } from 'styled-components';
import type { TilePredictionAutofillFeedback } from './useTilePredictionAutofill';

export type { TilePredictionAutofillFeedback } from './useTilePredictionAutofill';

export const EMPTY_PREDICTION_FEEDBACK: TilePredictionAutofillFeedback = {
	isPredicting: false,
	highlightedFields: {
		duration: false,
		location: false,
	},
};

const sweep = keyframes`
	0%   { transform: translateX(-100%); }
	100% { transform: translateX(400%); }
`;

export const PredictionLoadingBar = styled.div.attrs<{ 'data-testid'?: string }>({
	'data-testid': 'prediction-loading-bar',
})`
	position: relative;
	height: 2px;
	border-radius: 999px;
	background: ${({ theme }) => theme.colors.border.default};
	overflow: hidden;
	margin-top: 0.375rem;

	&::after {
		content: '';
		position: absolute;
		inset: 0 auto 0 0;
		width: 25%;
		border-radius: inherit;
		background: ${({ theme }) => theme.colors.datepicker.dateSelectedBg};
		animation: ${sweep} 1.4s ease-in-out infinite;
	}
`;
