import React from 'react';
import styled, { keyframes } from 'styled-components';
import { Link } from 'react-router';
import palette from '@/core/theme/palette';
import { Highlight } from '@/core/common/types/tile';
import SectionHeaders from '../layout/section_headers';
import Section from '../layout/section';
import { useTranslation } from 'react-i18next';
import MountainBackground from '@/assets/highlights/mountain.jpg';
import FitnessBackground from '@/assets/highlights/fitness.jpg';
import TilesBackground from '@/assets/highlights/tiles.jpg';
import LocationBackground from '@/assets/highlights/location.jpg';

/* ─── Card shell ─────────────────────────────────────────────── */

const HighlightCardWrapper = styled.div`
	display: grid;
	place-items: center;
	gap: 1.5rem;
	width: fit-content;
	margin: 0 auto;

	@media (min-width: ${palette.screens.sm}) {
		grid-template-columns: repeat(2, 1fr);
	}

	@media (min-width: ${palette.screens.xl}) {
		grid-template-columns: repeat(4, 1fr);
	}
`;

const HighlightCard = styled.div<{ $bg: string }>`
	position: relative;
	overflow: hidden;
	background: ${(p) => p.$bg};
	cursor: pointer;
	color: white;
	width: 262px;
	height: 360px;
	border-radius: 16px;
	border: 1px solid ${palette.colors.borderRed};
	display: flex;
	flex-direction: column;
	transition: transform 0.2s ease, box-shadow 0.2s ease;

	&:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
	}
`;

/* Animation lives in top section — fixed height, clips overflow */
const AnimArea = styled.div`
	width: 100%;
	height: 110px;
	position: relative;
	overflow: hidden;
	flex-shrink: 0;
`;

/* Text lives below, takes remaining space */
const CardText = styled.div`
	flex: 1;
	padding: 0.85rem 1rem 1rem;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	border-top: 1px solid rgba(255,255,255,0.06);
	overflow: hidden;
`;

const MiniTitle = styled.p`
	color: ${palette.colors.brand['300']};
	font-weight: ${palette.typography.fontWeight.semibold};
	font-size: ${palette.typography.fontSize.xs};
	margin: 0;
`;

const Title = styled.h2`
	font-size: ${palette.typography.fontSize.displayXs};
	line-height: ${palette.typography.lineHeight.lg};
	font-family: ${palette.typography.fontFamily.urban};
	font-weight: 700;
	margin: 0 0 0.25rem;
`;

const Body = styled.p`
	font-size: ${palette.typography.fontSize.sm};
	color: #ffffffbf;
	margin: 0;
`;

/* ════════════════════════════════════════════════════════════════
   CARD 1 — Natural-Language Scheduling
   Scene 1: mic icon + live transcription waveform + text
   Scene 2: AI schedules the response
════════════════════════════════════════════════════════════════ */

const sceneA = keyframes`
	0%         { opacity: 1; }
	42%, 100%  { opacity: 0; }
`;

const sceneB = keyframes`
	0%, 44%    { opacity: 0; }
	50%, 90%   { opacity: 1; }
	100%       { opacity: 0; }
`;

const micPulse = keyframes`
	0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.5); }
	50%      { box-shadow: 0 0 0 7px rgba(220,38,38,0); }
`;

const barBounce = keyframes`
	0%, 100% { transform: scaleY(0.3); }
	50%      { transform: scaleY(1); }
`;

const typeIn = keyframes`
	0%   { width: 0; }
	100% { width: 100%; }
`;

const NLSScene = styled.div`
	position: absolute;
	inset: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 8px;
	padding: 8px 14px;
	overflow: hidden;
`;

/* Scene A — voice input */
const SceneVoice = styled.div`
	position: absolute;
	inset: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 8px;
	animation: ${sceneA} 8s ease-in-out infinite;
`;

const MicIcon = styled.div`
	width: 28px; height: 28px;
	border-radius: 50%;
	background: rgba(220,38,38,0.2);
	border: 1.5px solid rgba(220,38,38,0.6);
	display: flex; align-items: center; justify-content: center;
	font-size: 13px;
	animation: ${micPulse} 1.2s ease-in-out infinite;
`;

const WaveRow = styled.div`
	display: flex;
	align-items: center;
	gap: 3px;
	height: 20px;
`;

const Bar = styled.div<{ $h: number; $d: number }>`
	width: 3px;
	height: ${(p) => p.$h}px;
	border-radius: 2px;
	background: rgba(220,38,38,0.7);
	transform-origin: bottom;
	animation: ${barBounce} ${(p) => 0.5 + p.$d * 0.1}s ease-in-out infinite;
	animation-delay: ${(p) => p.$d * 0.08}s;
`;

const TranscriptLine = styled.div`
	font-size: 8.5px;
	color: rgba(255,255,255,0.6);
	background: rgba(255,255,255,0.06);
	border-radius: 6px;
	padding: 4px 8px;
	width: 90%;
	text-align: center;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
`;

/* Scene B — AI schedule response */
const SceneResponse = styled.div`
	position: absolute;
	inset: 0;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	justify-content: center;
	gap: 5px;
	padding: 8px 12px;
	animation: ${sceneB} 8s ease-in-out infinite;
`;

const ResponseRow = styled.div<{ $w: string; $accent?: boolean }>`
	height: 16px;
	width: ${(p) => p.$w};
	border-radius: 5px;
	background: ${(p) => p.$accent ? 'rgba(220,38,38,0.25)' : 'rgba(255,255,255,0.08)'};
	border: 1px solid ${(p) => p.$accent ? 'rgba(220,38,38,0.5)' : 'rgba(255,255,255,0.1)'};
	display: flex;
	align-items: center;
	padding: 0 6px;
	font-size: 8px;
	color: ${(p) => p.$accent ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)'};
`;

function NLSAnimation() {
	return (
		<AnimArea>
			<NLSScene>
				{/* Scene 1: Voice → Transcription */}
				<SceneVoice>
					<MicIcon>🎙</MicIcon>
					<WaveRow>
						{[6,10,14,18,14,10,16,12,8,14,10,6].map((h, i) => (
							<Bar key={i} $h={h} $d={i} />
						))}
					</WaveRow>
					<TranscriptLine>"Lunch with Sarah tomorrow at noon…"</TranscriptLine>
				</SceneVoice>

				{/* Scene 2: AI scheduled response */}
				<SceneResponse>
					<ResponseRow $w="88%" $accent>✓ Lunch with Sarah — Tomorrow 12:00 PM</ResponseRow>
					<ResponseRow $w="70%">+ 25 min travel block added</ResponseRow>
					<ResponseRow $w="55%">📍 Downtown · 1 hr</ResponseRow>
				</SceneResponse>
			</NLSScene>
		</AnimArea>
	);
}

/* ════════════════════════════════════════════════════════════════
   CARD 2 — Smart Travel & Location
   Straight horizontal route with 4 stops, dot travels across
════════════════════════════════════════════════════════════════ */

const drawRoute = keyframes`
	0%   { stroke-dashoffset: 210; }
	50%  { stroke-dashoffset: 0; }
	100% { stroke-dashoffset: 0; }
`;

const dotTravel = keyframes`
	0%        { offset-distance: 0%;   opacity: 0; }
	8%        { opacity: 1; }
	78%       { offset-distance: 100%; opacity: 1; }
	88%, 100% { offset-distance: 100%; opacity: 0; }
`;

const TravelSVG = styled.svg`
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	overflow: visible;
`;

const RoutePath = styled.line`
	stroke: rgba(96,165,250,0.6);
	stroke-width: 2;
	stroke-dasharray: 210;
	stroke-dashoffset: 210;
	animation: ${drawRoute} 5s ease-in-out infinite;
`;

const TravelDot = styled.circle`
	fill: #60a5fa;
	filter: drop-shadow(0 0 5px #60a5fa);
	offset-path: path('M 22 55 L 240 55');
	offset-rotate: 0deg;
	animation: ${dotTravel} 5s ease-in-out infinite;
	animation-delay: 0.6s;
`;

// stops: x position, label, time
const STOPS = [
	{ x: 22,  label: 'Home',   time: '8:00 AM', above: false },
	{ x: 88,  label: 'Office', time: '9:15 AM', above: true  },
	{ x: 155, label: 'Café',   time: '1:00 PM', above: false },
	{ x: 240, label: 'Gym',    time: '5:30 PM', above: true  },
];

function TravelAnimation() {
	return (
		<AnimArea>
			<TravelSVG viewBox="0 0 262 110" preserveAspectRatio="xMidYMid meet">
				{/* Straight route line */}
				<RoutePath x1="22" y1="55" x2="240" y2="55" />

				{/* Stops */}
				{STOPS.map((s) => (
					<g key={s.label}>
						<circle cx={s.x} cy={55} r={6} fill="rgba(96,165,250,0.15)" stroke="#60a5fa" strokeWidth="1.5"/>
						<circle cx={s.x} cy={55} r={2.5} fill="#60a5fa"/>
						{s.above ? (
							<>
								<text x={s.x} y={28} fontSize="7.5" fill="rgba(96,165,250,0.8)" textAnchor="middle" fontWeight="600">{s.time}</text>
								<text x={s.x} y={40} fontSize="8" fill="rgba(255,255,255,0.55)" textAnchor="middle">{s.label}</text>
							</>
						) : (
							<>
								<text x={s.x} y={74} fontSize="8" fill="rgba(255,255,255,0.55)" textAnchor="middle">{s.label}</text>
								<text x={s.x} y={84} fontSize="7.5" fill="rgba(96,165,250,0.8)" textAnchor="middle" fontWeight="600">{s.time}</text>
							</>
						)}
					</g>
				))}

				{/* Traveling dot */}
				<TravelDot cx="0" cy="0" r="4.5"/>
			</TravelSVG>
		</AnimArea>
	);
}

/* ════════════════════════════════════════════════════════════════
   CARD 1 — Schedule Undo
   Scene A: original tile · Scene B: preview with changed time
   Scene C: Undo / Accept buttons
════════════════════════════════════════════════════════════════ */

const undoSceneA = keyframes`
	0%, 28%   { opacity: 1; }
	33%, 100% { opacity: 0; }
`;

const undoSceneB = keyframes`
	0%, 33%   { opacity: 0; }
	38%, 61%  { opacity: 1; }
	66%, 100% { opacity: 0; }
`;

const undoSceneC = keyframes`
	0%, 66%   { opacity: 0; }
	71%, 95%  { opacity: 1; }
	100%      { opacity: 0; }
`;

const acceptPulse = keyframes`
	0%, 80%   { box-shadow: none; }
	90%       { box-shadow: 0 0 10px rgba(74,222,128,0.5); }
	100%      { box-shadow: none; }
`;

const UndoSceneBase = styled.div`
	position: absolute;
	inset: 0;
	display: flex;
	flex-direction: column;
	align-items: stretch;
	justify-content: center;
	gap: 8px;
	padding: 10px 16px;
`;

const UndoSceneA = styled(UndoSceneBase)`
	animation: ${undoSceneA} 7.5s ease-in-out infinite;
`;

const UndoSceneB = styled(UndoSceneBase)`
	animation: ${undoSceneB} 7.5s ease-in-out infinite;
`;

const UndoSceneC = styled(UndoSceneBase)`
	animation: ${undoSceneC} 7.5s ease-in-out infinite;
`;

const UndoTileCard = styled.div<{ $ghost?: boolean }>`
	width: 100%;
	border-radius: 8px;
	background: ${({ $ghost }) => $ghost ? 'rgba(74,222,128,0.05)' : 'rgba(255,255,255,0.07)'};
	border: ${({ $ghost }) => $ghost ? '1.5px dashed rgba(74,222,128,0.5)' : '1px solid rgba(255,255,255,0.1)'};
	padding: 6px 10px;
	display: flex;
	flex-direction: column;
	gap: 3px;
`;

const UndoTileName = styled.span`
	font-size: 9px;
	font-weight: 600;
	color: rgba(255,255,255,0.9);
`;

const UndoTileMeta = styled.span`
	font-size: 8px;
	color: rgba(255,255,255,0.45);
`;

const UndoPreviewBadge = styled.span`
	font-size: 7px;
	color: rgba(74,222,128,0.9);
	font-weight: 700;
	letter-spacing: 0.08em;
	margin-top: 1px;
`;

const UndoActionRow = styled.div`
	display: flex;
	gap: 8px;
	width: 100%;
`;

const UndoActionBtn = styled.button<{ $variant: 'undo' | 'accept' }>`
	flex: 1;
	border: none;
	border-radius: 6px;
	padding: 5px 0;
	font-size: 8px;
	font-weight: 700;
	letter-spacing: 0.05em;
	cursor: default;
	background: ${({ $variant }) =>
		$variant === 'accept' ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.12)'};
	color: ${({ $variant }) =>
		$variant === 'accept' ? 'rgba(74,222,128,0.9)' : 'rgba(239,68,68,0.8)'};
	border: 1px solid ${({ $variant }) =>
		$variant === 'accept' ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.25)'};
	animation: ${({ $variant }) => $variant === 'accept' ? acceptPulse : 'none'} 7.5s ease-in-out infinite;
`;

function ScheduleUndoAnimation() {
	return (
		<AnimArea>
			{/* Scene A — original tile */}
			<UndoSceneA>
				<UndoTileCard>
					<UndoTileName>Gym session</UndoTileName>
					<UndoTileMeta>@ Home · Tue · 10:00 AM</UndoTileMeta>
				</UndoTileCard>
			</UndoSceneA>

			{/* Scene B — preview with changed time */}
			<UndoSceneB>
				<UndoTileCard $ghost>
					<UndoTileName>Gym session</UndoTileName>
					<UndoTileMeta>@ Home · Wed · 2:00 PM</UndoTileMeta>
					<UndoPreviewBadge>PREVIEW</UndoPreviewBadge>
				</UndoTileCard>
			</UndoSceneB>

			{/* Scene C — Undo / Accept */}
			<UndoSceneC>
				<UndoTileCard $ghost>
					<UndoTileName>Gym session</UndoTileName>
					<UndoTileMeta>@ Home · Wed · 2:00 PM</UndoTileMeta>
					<UndoPreviewBadge>PREVIEW</UndoPreviewBadge>
				</UndoTileCard>
				<UndoActionRow>
					<UndoActionBtn $variant="undo">✕ Undo</UndoActionBtn>
					<UndoActionBtn $variant="accept">✓ Accept</UndoActionBtn>
				</UndoActionRow>
			</UndoSceneC>
		</AnimArea>
	);
}

/* ════════════════════════════════════════════════════════════════
   CARD 4 — Tileshare
   Named tile slides from one avatar to another
════════════════════════════════════════════════════════════════ */

const tileSlide = keyframes`
	0%, 15%   { opacity: 0; transform: translateX(0) scale(0.9); }
	25%       { opacity: 1; transform: translateX(0) scale(1); }
	60%       { opacity: 1; transform: translateX(110px) scale(1); }
	75%, 100% { opacity: 0; transform: translateX(110px) scale(0.9); }
`;

const senderPulse = keyframes`
	0%, 20%    { box-shadow: 0 0 0 0 rgba(244,114,182,0.5); }
	30%        { box-shadow: 0 0 0 6px rgba(244,114,182,0); }
	100%       { box-shadow: 0 0 0 0 rgba(244,114,182,0); }
`;

const receiverLight = keyframes`
	0%, 58%   { box-shadow: none; border-color: rgba(255,255,255,0.15); }
	65%       { box-shadow: 0 0 0 5px rgba(244,114,182,0.2); border-color: rgba(244,114,182,0.7); }
	80%, 100% { box-shadow: none; border-color: rgba(255,255,255,0.15); }
`;

const arcAppear = keyframes`
	0%, 20%  { stroke-dashoffset: 100; opacity: 0; }
	35%      { opacity: 0.7; }
	58%      { stroke-dashoffset: 0; opacity: 0.7; }
	65%      { opacity: 0; }
	100%     { opacity: 0; stroke-dashoffset: 0; }
`;

const checkPop = keyframes`
	0%, 62%  { opacity: 0; transform: scale(0.5); }
	70%      { opacity: 1; transform: scale(1.2); }
	80%      { transform: scale(1); opacity: 1; }
	95%      { opacity: 1; }
	100%     { opacity: 0; }
`;

const TileshareScene = styled.div`
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0;
	padding: 0 18px;
`;

const Avatar = styled.div<{ $receiver?: boolean }>`
	width: 34px;
	height: 34px;
	border-radius: 50%;
	background: rgba(244,114,182,0.12);
	border: 1.5px solid rgba(255,255,255,0.15);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 14px;
	flex-shrink: 0;
	animation: ${(p) => p.$receiver ? receiverLight : senderPulse} 5s ease-in-out infinite;
`;

const MiddleSpace = styled.div`
	flex: 1;
	position: relative;
	height: 34px;
	display: flex;
	align-items: center;
`;

const SharedTile = styled.div`
	position: absolute;
	left: 4px;
	width: 92px;
	height: 32px;
	border-radius: 7px;
	background: rgba(244,114,182,0.15);
	border: 1px solid rgba(244,114,182,0.5);
	display: flex;
	flex-direction: column;
	justify-content: center;
	padding: 0 7px;
	opacity: 0;
	animation: ${tileSlide} 5s ease-in-out infinite;
	box-shadow: 0 0 12px rgba(244,114,182,0.2);
`;

const TileName = styled.span`
	font-size: 7.5px;
	font-weight: 700;
	color: rgba(255,255,255,0.9);
	white-space: nowrap;
`;

const TileSub = styled.span`
	font-size: 7px;
	color: rgba(244,114,182,0.8);
	white-space: nowrap;
`;

const ArcSVG = styled.svg`
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	overflow: visible;
	pointer-events: none;
`;

const ArcLine = styled.path`
	fill: none;
	stroke: rgba(244,114,182,0.55);
	stroke-width: 1.5;
	stroke-dasharray: 100;
	stroke-dashoffset: 100;
	animation: ${arcAppear} 5s ease-in-out infinite;
`;

const CheckMark = styled.div`
	position: absolute;
	right: 2px;
	font-size: 13px;
	opacity: 0;
	animation: ${checkPop} 5s ease-in-out infinite;
`;

function TileshareAnimation() {
	return (
		<AnimArea>
			<TileshareScene>
				<Avatar>👤</Avatar>
				<MiddleSpace>
					<ArcSVG viewBox="0 0 120 34">
						<ArcLine d="M 10 17 Q 60 -10 110 17" />
					</ArcSVG>
					<SharedTile>
						<TileName>Gym session</TileName>
						<TileSub>From Alex · 1 hr</TileSub>
					</SharedTile>
					<CheckMark>✅</CheckMark>
				</MiddleSpace>
				<Avatar $receiver>👤</Avatar>
			</TileshareScene>
		</AnimArea>
	);
}

/* ─── Config map ─────────────────────────────────────────────── */

const CARD_CONFIGS = [
	{ bg: '#050d05', Animation: ScheduleUndoAnimation },
	{ bg: '#050810', Animation: TravelAnimation },
	{ bg: '#0d0505', Animation: NLSAnimation },
	{ bg: '#080508', Animation: TileshareAnimation },
];

/* ─── Main component ─────────────────────────────────────────── */

const FeatureHighlightsSection: React.FC = () => {
	const { t } = useTranslation();

	const highlights: Highlight[] = [
		{
			subHeader: t('home.features.adaptive.subtitle'),
			header: t('home.features.adaptive.title'),
			body: t('home.features.adaptive.description'),
			backgroundImage: FitnessBackground,
			slug: 'schedule-undo',
		},
		{
			subHeader: t('home.features.transit.subtitle'),
			header: t('home.features.transit.title'),
			body: t('home.features.transit.description'),
			backgroundImage: MountainBackground,
			slug: 'smart-travel-and-location',
		},
		{
			subHeader: t('home.features.conversation.subtitle'),
			header: t('home.features.conversation.title'),
			body: t('home.features.conversation.description'),
			backgroundImage: TilesBackground,
			slug: 'natural-language-scheduling',
		},
		{
			subHeader: t('home.features.location.subtitle'),
			header: t('home.features.location.title'),
			body: t('home.features.location.description'),
			backgroundImage: LocationBackground,
			slug: 'tileshare',
		},
	];

	return (
		<Section>
			<SectionHeaders
				headerText={t('home.featureHighlights.title')}
				subHeaderText={t('home.featureHighlights.subtitle')}
				align="center"
			/>
			<HighlightCardWrapper>
				{highlights.map((highlight, index) => {
					const { bg, Animation } = CARD_CONFIGS[index];
					return (
						<Link key={index} to={`/articles/${highlight.slug}`} style={{ textDecoration: 'none' }}>
							<HighlightCard $bg={bg}>
								<Animation />
								<CardText>
									<MiniTitle>{highlight.subHeader}</MiniTitle>
									<div>
										<Title>{highlight.header}</Title>
										<Body>{highlight.body}</Body>
									</div>
								</CardText>
							</HighlightCard>
						</Link>
					);
				})}
			</HighlightCardWrapper>
		</Section>
	);
};

export default FeatureHighlightsSection;
