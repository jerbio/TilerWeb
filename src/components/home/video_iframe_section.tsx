import React from 'react';
import styled from 'styled-components';

interface VideoIframeProps {
	src: string; // URL of the video
	title: string; // Title for accessibility
	width?: string; // Width of the iframe (default: "100%")
	height?: string; // Height of the iframe (default: "315px")
	allowFullScreen?: boolean; // Allow fullscreen mode (default: true)
	allow?: string; // Additional allow attributes for the iframe (default: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture")
	referrerPolicy?: React.HTMLAttributeReferrerPolicy; // Referrer policy for the iframe (default: "strict-origin-when-cross-origin")
}

const IframeDiv = styled.iframe`
margin: 0 auto;`

const VideoIframeSection: React.FC<VideoIframeProps> = ({
	src,
	title,
	width = '100%',
	height = '315px',
	allowFullScreen = true,
	allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
	referrerPolicy = 'strict-origin-when-cross-origin',
}) => {
	return (
		<div>
			<IframeDiv
				src={src}
				title={title}
				width={width}
				height={height}
				allowFullScreen={allowFullScreen}
				frameBorder="0"
				allow={allow}
				referrerPolicy={referrerPolicy}
			></IframeDiv>
		</div>
	);
};

export default VideoIframeSection;
