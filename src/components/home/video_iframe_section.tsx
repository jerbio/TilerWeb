import React, { useEffect } from 'react';
import styled from 'styled-components';
import styles from '../../util/styles';
import Section from '../layout/section';

interface VideoIframeProps {
	src: string; // URL of the video
	title: string; // Title for accessibility
	width?: number;
	allowFullScreen?: boolean; // Allow fullscreen mode (default: true)
	allow?: string; // Additional allow attributes for the iframe (default: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture")
	referrerPolicy?: React.HTMLAttributeReferrerPolicy; // Referrer policy for the iframe (default: "strict-origin-when-cross-origin")
	waitlistSignUp?: boolean; // If true, scroll to the section after mount
}

const Iframe = styled.iframe`
	width: 100%;
  aspect-ratio: 16 / 9; // Maintain a 16:9 aspect ratio
  margin: 0 auto;
  border-radius: ${styles.borderRadius.large};
  border: .25rem solid ${styles.colors.gray[900]};
`;

const VideoIframeSection: React.FC<VideoIframeProps> = ({
	src,
	title,
	width,
	allowFullScreen = true,
	allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
	referrerPolicy = 'strict-origin-when-cross-origin',
	waitlistSignUp = false,
}) => {
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
				title={title}
				allowFullScreen={allowFullScreen}
				frameBorder="0"
				allow={allow}
				referrerPolicy={referrerPolicy}
			></Iframe>
		</Section>
	);
};

export default VideoIframeSection;

