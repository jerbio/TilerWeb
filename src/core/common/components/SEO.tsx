import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
	title?: string;
	description?: string;
	keywords?: string;
	ogImage?: string;
	ogType?: string;
	canonicalUrl?: string;
	twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
	structuredData?: object;
	/** ISO 8601 timestamp — emits article:published_time. */
	publishedTime?: string;
	/** ISO 8601 timestamp — emits article:modified_time. */
	modifiedTime?: string;
	/** Author name(s) — emits one article:author tag per author. */
	authors?: string[];
	/** Article tags / keywords — emits one article:tag per tag. */
	articleTags?: string[];
	/** Article section / category — emits article:section. */
	articleSection?: string;
}

const SEO: React.FC<SEOProps> = ({
	title = 'Tiler - Smart Calendar & Task Management App',
	description = 'Tiler is your intelligent calendar assistant that helps you schedule tasks, manage time, and boost productivity. Integrate with Google Calendar, track locations, and never miss a deadline.',
	keywords = 'calendar app, task management, scheduling, productivity, time management, google calendar integration, smart scheduling, task organizer, tiler app',
	ogImage = 'https://tiler.app/og-image.png',
	ogType = 'website',
	canonicalUrl,
	twitterCard = 'summary_large_image',
	structuredData,
	publishedTime,
	modifiedTime,
	authors,
	articleTags,
	articleSection,
}) => {
	const siteUrl = 'https://tiler.app';
	const fullCanonicalUrl = canonicalUrl ? `${siteUrl}${canonicalUrl}` : siteUrl;

	return (
		<Helmet>
			{/* Primary Meta Tags */}
			<title>{title}</title>
			<meta name="title" content={title} />
			<meta name="description" content={description} />
			<meta name="keywords" content={keywords} />
			<link rel="canonical" href={fullCanonicalUrl} />

			{/* Open Graph / Facebook */}
			<meta property="og:type" content={ogType} />
			<meta property="og:url" content={fullCanonicalUrl} />
			<meta property="og:title" content={title} />
			<meta property="og:description" content={description} />
			<meta property="og:image" content={ogImage} />
			<meta property="og:site_name" content="Tiler" />

			{/* Article-specific Open Graph */}
			{publishedTime && <meta property="article:published_time" content={publishedTime} />}
			{modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
			{articleSection && <meta property="article:section" content={articleSection} />}
			{authors?.map((author) => (
				<meta key={`author-${author}`} property="article:author" content={author} />
			))}
			{articleTags?.map((tag) => (
				<meta key={`tag-${tag}`} property="article:tag" content={tag} />
			))}

			{/* Twitter */}
			<meta property="twitter:card" content={twitterCard} />
			<meta property="twitter:url" content={fullCanonicalUrl} />
			<meta property="twitter:title" content={title} />
			<meta property="twitter:description" content={description} />
			<meta property="twitter:image" content={ogImage} />

			{/* Structured Data */}
			{structuredData && (
				<script type="application/ld+json">{JSON.stringify(structuredData)}</script>
			)}
		</Helmet>
	);
};

export default SEO;
