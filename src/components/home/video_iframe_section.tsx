import React from 'react';
import styled from 'styled-components';
import styles from '../../util/styles';

interface VideoIframeProps {
	src: string; // URL of the video
	title: string; // Title for accessibility
	width?: string; // Width of the iframe (default: "100%")
	allowFullScreen?: boolean; // Allow fullscreen mode (default: true)
	allow?: string; // Additional allow attributes for the iframe (default: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture")
	referrerPolicy?: React.HTMLAttributeReferrerPolicy; // Referrer policy for the iframe (default: "strict-origin-when-cross-origin")
}

const IframeContainer = styled.div`
	display: flex;
	justify-content: center;
  margin: 0 ${styles.container.padding.default};
`;

const Iframe = styled.iframe<{ $width: string }>`
	width: 100%;
  aspect-ratio: 16 / 9; // Maintain a 16:9 aspect ratio
	max-width: ${(props) => props.$width}px;
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
		<IframeContainer>
			<Iframe
				src={src}
				title={title}
				$width={width} // spelled this way to avoid conflict with the native width prop
				allowFullScreen={allowFullScreen}
				frameBorder="0"
				allow={allow}
				referrerPolicy={referrerPolicy}
			></Iframe>
		</IframeContainer>
	);
};

export default VideoIframeSection;

