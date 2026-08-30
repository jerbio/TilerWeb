/**
 * The CTA row, instrumented once for every arm.
 *
 * Centralised deliberately: if each arm wired its own tracking, one arm would
 * eventually ship with a missing or differently-named event and its conversion
 * rate would read as a genuine result rather than a bug.
 */

import React, { useRef } from 'react';
import styled from 'styled-components';
import Button from '@/core/common/components/button';
import palette from '@/core/theme/palette';
import { trackCtaClicked } from '@/core/analytics/funnel';
import type { HeroVariantKey } from '@/core/experiments';

export type CtaRole = 'primary' | 'secondary' | 'demo';

export const SIGNUP_DESTINATION = '/signin';

const Row = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: ${palette.space.small};
	margin-top: ${palette.space.small};

	@media (max-width: ${palette.screens.lg}) {
		justify-content: center;
	}
`;

export const trackHeroCta = (
	variant: HeroVariantKey,
	role: CtaRole,
	label: string,
	destination: string
): void => {
	trackCtaClicked({
		label,
		location: 'Hero Section',
		destination,
		ctaRole: role,
		variant,
	});
};

/** Scrolls to whatever follows the hero, so no arm depends on a section id existing. */
const scrollPastHero = (from: HTMLElement | null): void => {
	const hero = from?.closest('section');
	const next = hero?.nextElementSibling;

	if (next) {
		next.scrollIntoView({ behavior: 'smooth', block: 'start' });
		return;
	}
	window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
};

export type HeroCtasProps = {
	variant: HeroVariantKey;
	primaryLabel: string;
	secondaryLabel: string;
};

const HeroCtas: React.FC<HeroCtasProps> = ({ variant, primaryLabel, secondaryLabel }) => {
	const rowRef = useRef<HTMLDivElement>(null);

	const handlePrimary = () => {
		trackHeroCta(variant, 'primary', primaryLabel, SIGNUP_DESTINATION);
		window.location.href = SIGNUP_DESTINATION;
	};

	const handleSecondary = () => {
		trackHeroCta(variant, 'secondary', secondaryLabel, 'scroll');
		scrollPastHero(rowRef.current);
	};

	return (
		<Row ref={rowRef}>
			<Button variant="brand" size="large" onClick={handlePrimary}>
				{primaryLabel}
			</Button>
			<Button variant="secondary" size="large" onClick={handleSecondary}>
				{secondaryLabel}
			</Button>
		</Row>
	);
};

export default HeroCtas;
