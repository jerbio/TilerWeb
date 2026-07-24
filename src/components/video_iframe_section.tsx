import React from 'react';

interface VideoIframeProps {
	src: string; // URL of the video
	title: string; // Title for accessibility
	width?: string; // Width of the iframe (default: "100%")
	height?: string; // Height of the iframe (default: "315px")
	allowFullScreen?: boolean; // Allow fullscreen mode (default: true)
	allow?: string; // Additional allow attributes for the iframe (default: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture")
	referrerPolicy?: React.HTMLAttributeReferrerPolicy; // Referrer policy for the iframe (default: "strict-origin-when-cross-origin")
}

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
		<div className="video-iframe-section">
			<iframe
				src={src}
				title={title}
				width={width}
				height={height}
				allowFullScreen={allowFullScreen}
				frameBorder="0"
				allow={allow}
				referrerPolicy={referrerPolicy}
			></iframe>
		</div>
	);
};

export default VideoIframeSection;
