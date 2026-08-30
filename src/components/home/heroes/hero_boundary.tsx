/**
 * Falls back to the control hero when an arm throws.
 *
 * A blank landing page is far worse than a lost data point, so a broken challenger
 * degrades to the hero that already ships rather than taking the page down. The
 * failure is reported so the arm's data can be treated as suspect for that period.
 */

import React from 'react';
import analytics from '@/core/util/analytics';
import type { HeroVariantKey } from '@/core/experiments';

type Props = {
	variant: HeroVariantKey;
	fallback: React.ReactNode;
	children: React.ReactNode;
};

type State = { failed: boolean };

class HeroBoundary extends React.Component<Props, State> {
	state: State = { failed: false };

	static getDerivedStateFromError(): State {
		return { failed: true };
	}

	componentDidCatch(error: Error) {
		analytics.trackError('hero_variant_render_failed', {
			variant: this.props.variant,
			message: error.message,
		});
	}

	render() {
		return this.state.failed ? this.props.fallback : this.props.children;
	}
}

export default HeroBoundary;
