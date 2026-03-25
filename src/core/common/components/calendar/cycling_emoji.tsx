import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';

/** Split an emoji string into individual grapheme clusters (emoji characters). */
const splitEmojis = (str: string): string[] => {
	if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
		type SegmentData = { segment: string };
		const Seg = (Intl as Record<string, unknown>).Segmenter as new (
			locale: string,
			opts: { granularity: string }
		) => { segment(input: string): Iterable<SegmentData> };
		return [...new Seg('en', { granularity: 'grapheme' }).segment(str)].map(
			(s) => s.segment
		);
	}
	// Fallback: split on unicode extended grapheme clusters via regex
	return [...str.match(/\p{Extended_Pictographic}(\u200d\p{Extended_Pictographic})*/gu) ?? str];
};

const EMOJI_CYCLE_MS = 2000;

/** Cycles through individual emojis with a fade transition. */
const CyclingEmoji: React.FC<{ emojis: string }> = ({ emojis }) => {
	const parts = useMemo(() => splitEmojis(emojis), [emojis]);
	const [index, setIndex] = useState(0);

	useEffect(() => {
		if (parts.length <= 1) return;
		const id = setInterval(() => {
			setIndex((prev) => (prev + 1) % parts.length);
		}, EMOJI_CYCLE_MS);
		return () => clearInterval(id);
	}, [parts]);

	if (parts.length <= 1) {
		return <span className="emoji">{emojis}</span>;
	}

	return (
		<EmojiCycleWrapper>
			{parts.map((emoji, i) => (
				<span key={i} className={`emoji ${i === index ? 'active' : ''}`}>
					{emoji}
				</span>
			))}
		</EmojiCycleWrapper>
	);
};

const EmojiCycleWrapper = styled.span`
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 1em;
	height: 1em;

	.emoji {
		position: absolute;
		opacity: 0;
		transition: opacity 0.4s ease, transform 0.4s ease;
		transform: scale(0.7);

		&.active {
			opacity: 1;
			transform: scale(1);
		}
	}
`;

export default CyclingEmoji;
