import React, { useEffect } from 'react';
import styled from 'styled-components';
import pallette from '../../core/theme/pallete';
import Section from '../layout/section';
import { useTranslation } from 'react-i18next';

interface VideoIframeProps {
	src: string; // URL of the video
	title: string; // Title for accessibility
	width?: number;
	allowFullScreen?: boolean; // Allow fullscreen mode (default: true)
	allow?: string; // Additional allow attributes for the iframe (default: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share")
	referrerPolicy?: React.HTMLAttributeReferrerPolicy; // Referrer policy for the iframe (default: "strict-origin-when-cross-origin")
	waitlistSignUp?: boolean; // If true, scroll to the section after mount
}

const Iframe = styled.iframe`
	width: 100%;
	aspect-ratio: 16 / 9;
	height: 100%;
	margin: 0 auto;
	border-radius: ${pallette.borderRadius.large};
	border: 0.25rem solid ${pallette.colors.gray[900]};
`;

const VideoIframeSection: React.FC<VideoIframeProps> = ({
	src,
	title,
	width = 1024,
	allowFullScreen = true,
	allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
	referrerPolicy = 'strict-origin-when-cross-origin',
	waitlistSignUp = false,
}) => {
	useTranslation();

	useEffect(() => {
		if (waitlistSignUp) {
			const el = document.getElementById('tiler-video-player');
			if (el) {
				el.scrollIntoView({ behavior: 'smooth' });
			}
		}
	}, [waitlistSignUp]);

	return (
		<Section width={width}>
			<Iframe
				src={src}
				id="tiler-video-player"
				title={title}
				width={width}
				height={width * 0.5625}
				allowFullScreen={allowFullScreen}
				frameBorder="0"
				allow={allow}
				referrerPolicy={referrerPolicy}
			></Iframe>
		</Section>
	);
};

export default VideoIframeSection;
