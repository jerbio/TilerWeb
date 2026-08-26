/**
 * The signup nudge that closes every demo.
 *
 * The demo is a conversion surface, not decoration: it earns the ask by showing
 * the outcome first, then offers to make it real. The scenario payload rides
 * along to signup so the visitor does not have to re-type what they just watched.
 */

import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import Button from '@/core/common/components/button';
import palette from '@/core/theme/palette';
import type { HeroVariantKey } from '@/core/experiments';
import { trackHeroCta } from '../hero_ctas';

export const NUDGE_DESTINATION = '/signin';

const Wrapper = styled.div<{ $visible: boolean }>`
	display: flex;
	flex-direction: column;
	gap: 8px;
	align-items: flex-start;
	opacity: ${({ $visible }) => ($visible ? 1 : 0)};
	transform: translateY(${({ $visible }) => ($visible ? '0' : '6px')});
	transition:
		opacity 260ms ease,
		transform 260ms ease;
	pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};

	@media (prefers-reduced-motion: reduce) {
		transition: none;
		transform: none;
	}
`;

const Caption = styled.p`
	margin: 0;
	color: ${palette.colors.gray[400]};
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.sm};
	line-height: ${palette.typography.lineHeight.sm};
`;

export type SignupNudgeProps = {
	variant: HeroVariantKey;
	visible: boolean;
	/** What the visitor just watched, carried into signup. */
	scenario: string;
};

const SignupNudge: React.FC<SignupNudgeProps> = ({ variant, visible, scenario }) => {
	const { t } = useTranslation();
	const label = t(`home.heroExperiment.${variant}.nudgeCta`);
	const caption = t(`home.heroExperiment.${variant}.nudgeCaption`);

	const handleClick = () => {
		trackHeroCta(variant, 'demo', label, NUDGE_DESTINATION);

		const target = new URL(NUDGE_DESTINATION, window.location.origin);
		target.searchParams.set('scenario', scenario);
		window.location.href = `${target.pathname}${target.search}`;
	};

	return (
		<Wrapper $visible={visible} aria-hidden={!visible} data-nudge={variant}>
			<Caption>{caption}</Caption>
			<Button
				variant="brand"
				size="medium"
				onClick={handleClick}
				tabIndex={visible ? 0 : -1}
				data-testid={`nudge-${variant}`}
			>
				{label}
			</Button>
		</Wrapper>
	);
};

export default SignupNudge;
