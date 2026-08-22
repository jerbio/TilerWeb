import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import Logo from '@/core/common/components/icons/logo';
import Button from '@/core/common/components/button';
import Input from '@/core/common/components/input';
import palette from '@/core/theme/palette';
import { Env } from '@/config/config_getter';
import { authService } from '@/services';
import { hashEmail, trackConversion } from '@/core/analytics';
import VerificationCodePopup from '@/components/auth/VerificationCodePopup';
import SEO from '@/core/common/components/SEO';
import timelineCreative from '@/assets/waitlist/timeline-content.webp';
import scheduleDemoVideo from '@/assets/Sigin Up video.mp4';
import scheduleDemoPoster from '@/assets/sign-up-video-poster.jpg';

const creatives = [
	{
		src: timelineCreative,
		width: 1200,
		height: 1080,
		translationKey: 'first',
	},
	{
		src: scheduleDemoVideo,
		poster: scheduleDemoPoster,
		width: 3840,
		height: 2160,
		type: 'video',
		translationKey: 'second',
	},
] as const;

const UserAuthentication: React.FC = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	// Determine mode from URL path or query parameter
	const pathname = window.location.pathname;
	const queryMode = searchParams.get('mode');
	const mode = queryMode || (pathname.includes('signin') ? 'signin' : 'signup');
	const isSignUp = mode === 'signup';

	const baseUrl = Env.get('BASE_URL');
	const [email, setEmail] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [showVerificationPopup, setShowVerificationPopup] = useState(false);
	const requestedCreative = searchParams.get('creative');
	const initialCreative = requestedCreative === '2' || requestedCreative === 'mobile' ? 1 : 0;
	const [selectedCreative, setSelectedCreative] = useState(initialCreative);
	const [canLoadVideo, setCanLoadVideo] = useState(initialCreative === 1);
	const [isCreativeCollapsed, setIsCreativeCollapsed] = useState(false);
	const touchStartX = useRef<number | null>(null);
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const hasUserSelectedCreative = useRef(false);
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(
		() => window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);

	useEffect(() => {
		const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
		const updateMotionPreference = () => setPrefersReducedMotion(motionPreference.matches);

		updateMotionPreference();
		motionPreference.addEventListener('change', updateMotionPreference);
		return () => motionPreference.removeEventListener('change', updateMotionPreference);
	}, []);

	useEffect(() => {
		if (selectedCreative !== 1 || prefersReducedMotion) {
			videoRef.current?.pause();
			return;
		}

		void videoRef.current?.play().catch(() => undefined);
	}, [prefersReducedMotion, selectedCreative]);

	const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!email) {
			toast.error(t('auth.signup.emailPlaceholder'));
			return;
		}

		setIsLoading(true);
		try {
			await authService.signUp(email);
			toast.success(t('auth.signup.verificationSent'));

			// Attribution is attached here rather than at verification: the code may be
			// opened on a different device, where this device's first touch is gone.
			if (isSignUp) {
				trackConversion('signup_started', {
					emailSha256: await hashEmail(email),
				});
			}

			// Show verification popup
			setShowVerificationPopup(true);
		} catch (error) {
			toast.error(t('auth.signup.createAccountError'));
			console.error('Sign up error:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleResendCode = async () => {
		try {
			await authService.signUp(email);
			toast.success(t('auth.verification.resendSuccess'));
		} catch (error) {
			toast.error(t('auth.verification.resendError'));
			throw error;
		}
	};

	const selectCreative = (index: number) => {
		hasUserSelectedCreative.current = true;
		setIsCreativeCollapsed(false);
		const nextCreative = (index + creatives.length) % creatives.length;
		if (nextCreative === 1) setCanLoadVideo(true);
		setSelectedCreative(nextCreative);
	};

	const handleVideoCanPlay = () => {
		if (requestedCreative || prefersReducedMotion || hasUserSelectedCreative.current) return;
		setSelectedCreative(1);
	};

	const handleVideoEnded = () => {
		if (!window.matchMedia('(min-width: 1040px)').matches) {
			setIsCreativeCollapsed(true);
			return;
		}

		if (videoRef.current) videoRef.current.currentTime = 0;
		setSelectedCreative(0);
	};

	const handleTouchEnd = (event: React.TouchEvent) => {
		if (touchStartX.current === null) return;

		const distance = event.changedTouches[0].clientX - touchStartX.current;
		touchStartX.current = null;
		if (Math.abs(distance) < 50) return;

		selectCreative(selectedCreative + (distance < 0 ? 1 : -1));
	};

	return (
		<Container>
			<SEO
				title={t(isSignUp ? 'auth.seo.signupTitle' : 'auth.seo.signinTitle')}
				description={t('auth.seo.description')}
				canonicalUrl={isSignUp ? '/signup' : '/signin'}
				noindex
			/>
			<BackButton onClick={() => navigate(-1)} aria-label={t('auth.goBack')}>
				<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
					<path
						d="M12.5 15L7.5 10L12.5 5"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
				{t('auth.goBack')}
			</BackButton>

			<PageLayout $creativeCollapsed={isCreativeCollapsed}>
				<CreativeRegion
					$collapsed={isCreativeCollapsed}
					aria-label={t('auth.creative.regionLabel')}
				>
					<CreativeFrame
						$showingVideo={selectedCreative === 1}
						onTouchStart={(event) => {
							touchStartX.current = event.touches[0].clientX;
						}}
						onTouchEnd={handleTouchEnd}
					>
						<CreativeTrack $selectedCreative={selectedCreative}>
							<CreativeImage
								src={creatives[0].src}
								width={creatives[0].width}
								height={creatives[0].height}
								alt={t('auth.creative.slides.first.alt')}
								loading="eager"
								decoding="async"
								onLoad={() => setCanLoadVideo(true)}
							/>
							<CreativeVideo
								ref={videoRef}
								src={canLoadVideo ? creatives[1].src : undefined}
								poster={creatives[1].poster}
								width={creatives[1].width}
								height={creatives[1].height}
								aria-label={t('auth.creative.slides.second.alt')}
								onCanPlay={handleVideoCanPlay}
								onEnded={handleVideoEnded}
								onError={() => {
									if (selectedCreative === 1) setIsCreativeCollapsed(true);
								}}
								muted
								playsInline
								preload="auto"
							/>
						</CreativeTrack>
					</CreativeFrame>

					<SlideStatus aria-live="polite">
						<CreativeCaption>
							{t(
								`auth.creative.slides.${creatives[selectedCreative].translationKey}.caption`
							)}
						</CreativeCaption>
						{selectedCreative === 0 && (
							<CreativeDescription>
								{t('auth.creative.slides.first.description')}
							</CreativeDescription>
						)}
						<Pagination aria-label={t('auth.creative.paginationLabel')}>
							{creatives.map((creative, index) => (
								<PaginationDot
									key={creative.src}
									type="button"
									$active={selectedCreative === index}
									onClick={() => selectCreative(index)}
									aria-label={t('auth.creative.showSlide', {
										number: index + 1,
									})}
									aria-current={selectedCreative === index ? 'true' : undefined}
								/>
							))}
						</Pagination>
					</SlideStatus>
				</CreativeRegion>

				<Content>
					<Logo size={48} />

					<Title>{t(isSignUp ? 'auth.signup.title' : 'auth.signin.title')}</Title>
					<Subtitle>
						{t(isSignUp ? 'auth.signup.subtitle' : 'auth.signin.subtitle')}
					</Subtitle>

					<SocialLoginForm
						id="SocialLogin"
						action={`${baseUrl}Account/ExternalLogin`}
						method="post"
					>
						<input
							name="__RequestVerificationToken"
							type="hidden"
							value="E6PHbDLl86PTMhuBBti-2XuPdDm_WMFryLW4Jp-ZDvXCJcv7talXKZvZCipwiQSaKcgeWxMLgnTruLQT3cn55A7GcBDMRuoRzS98CzSrq481"
						/>
						<GoogleButton type="submit" name="provider" value="Google">
							<span>
								{t(
									isSignUp
										? 'auth.signup.googleButton'
										: 'auth.signin.googleButton'
								)}
							</span>
							<GoogleIcon>
								<svg width="24" height="24" viewBox="0 0 24 24">
									<path
										fill="#4285F4"
										d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
									/>
									<path
										fill="#34A853"
										d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
									/>
									<path
										fill="#FBBC05"
										d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
									/>
									<path
										fill="#EA4335"
										d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
									/>
								</svg>
							</GoogleIcon>
						</GoogleButton>
					</SocialLoginForm>

					<Divider>
						<DividerLine />
						<DividerText>{t('auth.or')}</DividerText>
						<DividerLine />
					</Divider>

					<Form onSubmit={handleSubmit}>
						<Input
							type="email"
							placeholder={t('auth.signup.emailPlaceholder')}
							label={t('auth.signup.emailLabel')}
							sized="large"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>

						<StyledButton
							variant="brand"
							size="large"
							type="submit"
							disabled={isLoading || !isValidEmail}
						>
							{isLoading
								? t(isSignUp ? 'auth.signup.submitting' : 'auth.signin.submitting')
								: t(
										isSignUp
											? 'auth.signup.submitButton'
											: 'auth.signin.submitButton'
									)}
						</StyledButton>
					</Form>

					<AppleLoginForm
						id="AppleLogin"
						action={`${baseUrl}Account/AppleLogin`}
						method="get"
					>
						<AppleButton type="submit">
							<span>
								{t(
									isSignUp ? 'auth.signup.appleButton' : 'auth.signin.appleButton'
								)}
							</span>
							<AppleIcon>
								<svg width="20" height="24" viewBox="0 0 20 24" fill="none">
									<path
										fill="currentColor"
										d="M16.53 12.72c-.03-2.7 2.2-3.99 2.3-4.06-1.25-1.84-3.2-2.09-3.9-2.12-1.66-.17-3.24.97-4.08.97-.84 0-2.14-.95-3.52-.92-1.81.03-3.48 1.05-4.41 2.67-1.88 3.27-.48 8.11 1.35 10.76.89 1.3 1.96 2.75 3.36 2.7 1.35-.05 1.86-.87 3.49-.87 1.63 0 2.09.87 3.52.84 1.45-.03 2.37-1.32 3.26-2.62 1.03-1.51 1.45-2.97 1.47-3.05-.03-.01-2.82-1.08-2.85-4.29zM13.87 4.7c.74-.9 1.24-2.15 1.1-3.4-1.07.04-2.36.71-3.13 1.61-.69.79-1.29 2.06-1.13 3.28 1.19.09 2.42-.6 3.16-1.49z"
									/>
								</svg>
							</AppleIcon>
						</AppleButton>
					</AppleLoginForm>

					<MicrosoftLoginForm
						id="MicrosoftLogin"
						action={`${baseUrl}Account/ExternalLogin`}
						method="post"
					>
						<input
							name="__RequestVerificationToken"
							type="hidden"
							value="E6PHbDLl86PTMhuBBti-2XuPdDm_WMFryLW4Jp-ZDvXCJcv7talXKZvZCipwiQSaKcgeWxMLgnTruLQT3cn55A7GcBDMRuoRzS98CzSrq481"
						/>
						{/* The web Microsoft OIDC middleware registers with authentication type
					    "OpenIdConnect" (see Startup.Auth.cs); challenging that provider begins
					    the existing Microsoft sign-in + calendar-connect flow via /signin-microsoft. */}
						<MicrosoftButton type="submit" name="provider" value="OpenIdConnect">
							<span>
								{t(
									isSignUp
										? 'auth.signup.microsoftButton'
										: 'auth.signin.microsoftButton'
								)}
							</span>
							<MicrosoftIcon>
								<svg width="20" height="20" viewBox="0 0 21 21">
									<rect x="1" y="1" width="9" height="9" fill="#F25022" />
									<rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
									<rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
									<rect x="11" y="11" width="9" height="9" fill="#FFB900" />
								</svg>
							</MicrosoftIcon>
						</MicrosoftButton>
					</MicrosoftLoginForm>
				</Content>
			</PageLayout>

			<VerificationCodePopup
				isOpen={showVerificationPopup}
				email={email}
				isSignUp={isSignUp}
				onClose={() => setShowVerificationPopup(false)}
				onResendCode={handleResendCode}
			/>
		</Container>
	);
};

const Container = styled.div`
	min-height: 100vh;
	background-color: ${palette.colors.black};
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 1.5rem clamp(1.5rem, 4vw, 4rem) 3rem;
	overflow-x: hidden;

	@media (max-width: 1039px) {
		padding: 1.25rem 1.5rem 2.5rem;
	}

	@media (max-width: 600px) {
		padding-inline: 1rem;
	}
`;

const BackButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	background: transparent;
	border: none;
	color: ${palette.colors.gray[400]};
	font-size: ${palette.typography.fontSize.base};
	cursor: pointer;
	align-self: center;
	width: 100%;
	max-width: 1600px;
	margin-bottom: 1rem;
	transition: color 0.2s;

	&:hover {
		color: ${palette.colors.gray[300]};
	}
`;

const PageLayout = styled.main<{ $creativeCollapsed: boolean }>`
	display: grid;
	grid-template-columns: minmax(440px, 54fr) minmax(480px, 46fr);
	align-items: center;
	gap: clamp(2rem, 3.5vw, 3rem);
	max-width: 1600px;
	width: 100%;
	margin: auto 0;

	@media (min-width: 1600px) {
		grid-template-columns: minmax(680px, 56fr) minmax(560px, 44fr);
		gap: clamp(3rem, 4vw, 4.5rem);
		margin: clamp(8rem, 18vh, 15rem) 0 auto;
	}

	@media (max-width: 1279px) {
		grid-template-columns: minmax(440px, 1fr) minmax(480px, 1fr);
		gap: 1.5rem;
	}

	@media (max-width: 1039px) {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: ${({ $creativeCollapsed }) => ($creativeCollapsed ? '0' : '1.5rem')};
	}
`;

const CreativeRegion = styled.section<{ $collapsed: boolean }>`
	min-width: 0;
	width: 100%;
	position: sticky;
	top: 2rem;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.75rem;

	@media (max-width: 1039px) {
		display: ${({ $collapsed }) => ($collapsed ? 'none' : 'flex')};
		position: static;
		max-width: 680px;
	}
`;

const CreativeFrame = styled.div<{ $showingVideo: boolean }>`
	width: 100%;
	height: ${({ $showingVideo }) => ($showingVideo ? 'auto' : 'min(68vh, 680px)')};
	min-height: ${({ $showingVideo }) => ($showingVideo ? '0' : '420px')};
	aspect-ratio: ${({ $showingVideo }) => ($showingVideo ? '16 / 9' : 'auto')};
	display: flex;
	align-items: center;
	justify-content: flex-start;
	background: ${palette.colors.gray[900]};
	border: 1px solid ${palette.colors.gray[800]};
	border-radius: ${palette.borderRadius.little};
	overflow: hidden;
	touch-action: pan-y;

	@media (max-width: 1039px) {
		height: ${({ $showingVideo }) => ($showingVideo ? 'auto' : 'clamp(180px, 30vh, 280px)')};
		min-height: ${({ $showingVideo }) => ($showingVideo ? '0' : '180px')};
	}
`;

const CreativeTrack = styled.div<{ $selectedCreative: number }>`
	display: grid;
	grid-template-columns: repeat(2, 50%);
	grid-template-rows: minmax(0, 1fr);
	width: 200%;
	min-width: 200%;
	flex-shrink: 0;
	height: 100%;
	transform: translateX(${({ $selectedCreative }) => ($selectedCreative === 1 ? '-50%' : '0')});
	transition: transform 400ms ease-in-out;

	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`;

const CreativeImage = styled.img`
	display: block;
	min-width: 0;
	min-height: 0;
	width: 100%;
	height: 100%;
	object-fit: contain;
`;

const CreativeVideo = styled.video`
	display: block;
	min-width: 0;
	min-height: 0;
	width: 100%;
	height: 100%;
	object-fit: contain;
`;

const SlideStatus = styled.div`
	min-width: 0;
	width: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.5rem;
`;

const CreativeCaption = styled.p`
	color: ${palette.colors.gray[300]};
	font-family: ${palette.typography.fontFamily.urban};
	font-size: ${palette.typography.fontSize.lg};
	font-weight: ${palette.typography.fontWeight.semibold};
	text-align: center;
	margin: 0;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	max-width: 100%;

	@media (max-width: 520px), (max-height: 700px) {
		display: none;
	}
`;

const CreativeDescription = styled.p`
	color: ${palette.colors.gray[400]};
	font-family: ${palette.typography.fontFamily.urban};
	font-size: ${palette.typography.fontSize.base};
	line-height: 1.5;
	text-align: center;
	margin: -0.125rem 0 0;
	max-width: 560px;

	@media (max-width: 600px) {
		font-size: ${palette.typography.fontSize.sm};
		max-width: 36ch;
	}

	@media (max-height: 700px) {
		display: none;
	}
`;

const Pagination = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
`;

const PaginationDot = styled.button<{ $active: boolean }>`
	width: 10px;
	height: 10px;
	padding: 0;
	border: 0;
	border-radius: 50%;
	background: ${({ $active }) =>
		$active ? palette.colors.brand[400] : palette.colors.gray[600]};
	cursor: pointer;

	&:focus-visible {
		outline: 2px solid ${palette.colors.white};
		outline-offset: 3px;
	}
`;

const Content = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	max-width: 560px;
	width: 100%;
	gap: 1.5rem;
	justify-self: center;

	@media (max-width: 1039px) {
		gap: 1.25rem;
	}

	@media (max-width: 600px) {
		gap: 1rem;
	}
`;

const Title = styled.h1`
	font-size: ${palette.typography.fontSize.displaySm};
	color: ${palette.colors.white};
	font-family: ${palette.typography.fontFamily.urban};
	font-weight: ${palette.typography.fontWeight.bold};
	text-align: center;
	margin: 0;
	margin-top: 1rem;

	@media (min-width: 1600px) {
		font-size: ${palette.typography.fontSize.displayBase};
	}
`;

const Subtitle = styled.p`
	color: ${palette.colors.gray[400]};
	font-size: ${palette.typography.fontSize.lg};
	line-height: 1.5;
	text-align: center;
	margin: 0;
	max-width: 400px;
`;

const SocialLoginForm = styled.form`
	width: 100%;
`;

const GoogleButton = styled.button`
	width: 100%;
	height: 48px;
	background-color: ${palette.colors.gray[900]};
	border: 1px solid ${palette.colors.gray[800]};
	border-radius: ${palette.borderRadius.little};
	color: ${palette.colors.white};
	font-size: ${palette.typography.fontSize.base};
	font-weight: ${palette.typography.fontWeight.medium};
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.75rem;
	cursor: pointer;
	transition: background-color 0.2s;
	position: relative;

	&:hover {
		background-color: ${palette.colors.gray[800]};
	}
`;

const GoogleIcon = styled.div`
	position: absolute;
	right: 1rem;
	display: flex;
	align-items: center;
	justify-content: center;
`;

const AppleLoginForm = styled.form`
	width: 100%;
	margin-top: 0.75rem;
`;

const AppleButton = styled.button`
	width: 100%;
	height: 48px;
	background-color: ${palette.colors.black};
	border: 1px solid ${palette.colors.gray[800]};
	border-radius: ${palette.borderRadius.little};
	color: ${palette.colors.white};
	font-size: ${palette.typography.fontSize.base};
	font-weight: ${palette.typography.fontWeight.medium};
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.75rem;
	cursor: pointer;
	transition: background-color 0.2s;
	position: relative;

	&:hover {
		background-color: ${palette.colors.gray[900]};
	}
`;

const AppleIcon = styled.div`
	position: absolute;
	right: 1rem;
	display: flex;
	align-items: center;
	justify-content: center;
`;

const MicrosoftLoginForm = styled.form`
	width: 100%;
	margin-top: 0.75rem;
`;

const MicrosoftButton = styled.button`
	width: 100%;
	height: 48px;
	background-color: ${palette.colors.gray[900]};
	border: 1px solid ${palette.colors.gray[800]};
	border-radius: ${palette.borderRadius.little};
	color: ${palette.colors.white};
	font-size: ${palette.typography.fontSize.base};
	font-weight: ${palette.typography.fontWeight.medium};
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.75rem;
	cursor: pointer;
	transition: background-color 0.2s;
	position: relative;

	&:hover {
		background-color: ${palette.colors.gray[800]};
	}
`;

const MicrosoftIcon = styled.div`
	position: absolute;
	right: 1rem;
	display: flex;
	align-items: center;
	justify-content: center;
`;

const Divider = styled.div`
	width: 100%;
	display: flex;
	align-items: center;
	gap: 1rem;
	margin: 0.5rem 0;
`;

const DividerLine = styled.div`
	flex: 1;
	height: 1px;
	background-color: ${palette.colors.gray[800]};
`;

const DividerText = styled.span`
	color: ${palette.colors.gray[600]};
	font-size: ${palette.typography.fontSize.sm};
	font-weight: ${palette.typography.fontWeight.medium};
`;

const Form = styled.form`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
`;

const StyledButton = styled(Button)`
	width: 100%;
`;

export default UserAuthentication;
