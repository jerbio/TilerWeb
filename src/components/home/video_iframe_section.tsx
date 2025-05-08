import React from 'react';
import styled from 'styled-components';

interface VideoIframeProps {
	src: string; // URL of the video
	title: string; // Title for accessibility
	width?: string; // Width of the iframe (default: "100%")
	allowFullScreen?: boolean; // Allow fullscreen mode (default: true)
	allow?: string; // Additional allow attributes for the iframe (default: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture")
	referrerPolicy?: React.HTMLAttributeReferrerPolicy; // Referrer policy for the iframe (default: "strict-origin-when-cross-origin")
}

const IframeDiv = styled.iframe<{ $width: string }>`
	margin: 0 auto;
	aspect-ratio: 16 / 9; // Maintain 16:9 aspect ratio

	@media (max-width: 768px) {
		width: 70%;
	}

	@media (min-width: 769px) and (max-width: 1024px) {
		width: 90%;
	}

	@media (min-width: 1025px) {
		width: ${(props) => props.width || '80%'};
	}
`;

const VideoIframeSection: React.FC<VideoIframeProps> = ({
	src,
	title,
	width = '100%',
	allowFullScreen = true,
	allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
	referrerPolicy = 'strict-origin-when-cross-origin',
}) => {
	return (
		<div>
			<IframeDiv
				src={src}
				title={title}
				$width={width} // spelled this way to avoid conflict with the native width prop
				allowFullScreen={allowFullScreen}
				frameBorder="0"
				allow={allow}
				referrerPolicy={referrerPolicy}
			></IframeDiv>
		</div>
	);
};

export default VideoIframeSection;
