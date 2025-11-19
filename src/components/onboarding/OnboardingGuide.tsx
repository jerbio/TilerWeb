import React, { useState, useEffect, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import palette from '@/core/theme/palette';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { isDemoMode, ONBOARDING_DEMO_DATA_EVENT } from '@/config/demo_config';

const fadeIn = keyframes`
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
`;

const pulse = keyframes`
	0%, 100% {
		transform: scale(1);
		opacity: 0.6;
	}
	50% {
		transform: scale(1.01);
		opacity: 0.8;
	}
`;

const OverlayContainer = styled.div<{ $visible: boolean }>`
	position: fixed;
	inset: 0;
	z-index: 10001;
	opacity: ${({ $visible }) => ($visible ? 1 : 0)};
	pointer-events: ${({ $visible }) => ($visible ? 'all' : 'none')};
	transition: opacity 0.3s ease-in-out;
	animation: ${fadeIn} 0.3s ease-out;
`;

const SpotlightRectangle = styled.div<{ $x: number; $y: number; $width: number; $height: number }>`
	position: fixed;
	left: ${({ $x }) => $x}px;
	top: ${({ $y }) => $y}px;
	width: ${({ $width }) => $width}px;
	height: ${({ $height }) => $height}px;
	border-radius: ${palette.borderRadius.medium};
	border: 3px solid ${palette.colors.brand[400]};
	box-shadow: 
		0 0 0 4px ${palette.colors.brand[400]}40,
		0 0 0 8px ${palette.colors.brand[400]}20,
		0 0 40px ${palette.colors.brand[400]}60,
		inset 0 0 20px ${palette.colors.brand[400]}10;
	animation: ${pulse} 2s ease-in-out infinite;
	pointer-events: none;
	z-index: 10002;
`;

const TooltipCard = styled.div<{ $x: number; $y: number; $position: 'top' | 'bottom' | 'left' | 'right' }>`
	position: fixed;
	left: ${({ $x }) => $x}px;
	top: ${({ $y }) => $y}px;
	max-width: 320px;
	background: ${palette.colors.gray[900]};
	border: 1px solid ${palette.colors.brand[500]}60;
	border-radius: ${palette.borderRadius.xLarge};
	padding: 1.25rem;
	box-shadow: 
		0 0 0 1px ${palette.colors.brand[400]}20,
		0 10px 40px rgba(0, 0, 0, 0.6);
	animation: ${fadeIn} 0.3s ease-out;
	z-index: 10002;

	@media (max-width: ${palette.screens.sm}) {
		max-width: 280px;
		padding: 1rem;
	}

	/* Arrow pointing to spotlight */
	&::before {
		content: '';
		position: absolute;
		width: 0;
		height: 0;
		border: 8px solid transparent;
		
		${({ $position }) => {
			switch ($position) {
				case 'top':
					return `
						bottom: -16px;
						left: 50%;
						transform: translateX(-50%);
						border-top-color: ${palette.colors.gray[900]};
						border-bottom: none;
					`;
				case 'bottom':
					return `
						top: -16px;
						left: 50%;
						transform: translateX(-50%);
						border-bottom-color: ${palette.colors.gray[900]};
						border-top: none;
					`;
				case 'left':
					return `
						right: -16px;
						top: 50%;
						transform: translateY(-50%);
						border-left-color: ${palette.colors.gray[900]};
						border-right: none;
					`;
				case 'right':
					return `
						left: -16px;
						top: 50%;
						transform: translateY(-50%);
						border-right-color: ${palette.colors.gray[900]};
						border-left: none;
					`;
			}
		}}
	}
`;

const TooltipTitle = styled.h3`
	font-size: ${palette.typography.fontSize.lg};
	font-weight: ${palette.typography.fontWeight.semibold};
	color: ${palette.colors.white};
	margin: 0 0 0.5rem 0;
	font-family: ${palette.typography.fontFamily.inter};
`;

const TooltipDescription = styled.p`
	font-size: ${palette.typography.fontSize.sm};
	color: ${palette.colors.gray[300]};
	margin: 0 0 1rem 0;
	line-height: 1.5;
	font-family: ${palette.typography.fontFamily.inter};
`;

const ButtonGroup = styled.div`
	display: flex;
	gap: 0.5rem;
	align-items: center;
	justify-content: space-between;
`;

const SkipButton = styled.button`
	background: transparent;
	border: none;
	color: ${palette.colors.gray[400]};
	font-size: ${palette.typography.fontSize.sm};
	padding: 0.5rem 0.75rem;
	cursor: pointer;
	transition: color 0.2s ease;
	font-family: ${palette.typography.fontFamily.inter};

	&:hover {
		color: ${palette.colors.gray[200]};
	}
`;

const NavButtons = styled.div`
	display: flex;
	gap: 0.5rem;
`;

const NavButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
	padding: 0.5rem 1rem;
	border-radius: ${palette.borderRadius.medium};
	font-size: ${palette.typography.fontSize.sm};
	font-weight: ${palette.typography.fontWeight.medium};
	font-family: ${palette.typography.fontFamily.inter};
	cursor: pointer;
	transition: all 0.2s ease;
	border: none;

	${({ $variant }) =>
		$variant === 'primary'
			? `
		background: linear-gradient(135deg, ${palette.colors.brand[500]}, ${palette.colors.brand[600]});
		color: ${palette.colors.white};
		
		&:hover {
			background: linear-gradient(135deg, ${palette.colors.brand[600]}, ${palette.colors.brand[700]});
			transform: translateY(-1px);
			box-shadow: 0 4px 12px ${palette.colors.brand[500]}40;
		}
	`
			: `
		background: ${palette.colors.gray[800]};
		color: ${palette.colors.gray[200]};
		
		&:hover {
			background: ${palette.colors.gray[700]};
		}
	`}

	&:active {
		transform: translateY(0);
	}
`;

const StepIndicator = styled.div`
	display: flex;
	gap: 0.375rem;
	justify-content: center;
	margin-bottom: 1rem;
`;

const StepDot = styled.div<{ $active: boolean }>`
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: ${({ $active }) => ($active ? palette.colors.brand[500] : palette.colors.gray[700])};
	transition: all 0.3s ease;
	
	${({ $active }) =>
		$active &&
		`
		width: 24px;
		border-radius: 4px;
	`}
`;

const CloseButton = styled.button`
	position: absolute;
	top: 1rem;
	right: 1rem;
	background: transparent;
	border: none;
	color: ${palette.colors.gray[400]};
	cursor: pointer;
	padding: 0.25rem;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: color 0.2s ease;

	&:hover {
		color: ${palette.colors.white};
	}
`;

interface StepConfig {
	id: string;
	targetSelector: string;
	spotlightSize: number;
	tooltipOffset: { x: number; y: number };
	tooltipPosition: 'top' | 'bottom' | 'left' | 'right';
	optional?: boolean; // If true, skip this step if element not found
}

interface OnboardingGuideProps {
	isVisible: boolean;
	onComplete: () => void;
	onSkip: () => void;
}

const LOCALSTORAGE_KEY = 'tiler_onboarding_completed';

const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ isVisible, onComplete, onSkip }) => {
	const { t } = useTranslation();
	const [currentStep, setCurrentStep] = useState(0);
	const [isReady, setIsReady] = useState(false);
	const [forceUpdateCounter, setForceUpdate] = useState(0); // For triggering re-calcs

	// Define step configurations based on viewport
	const stepConfigs = useMemo((): StepConfig[] => {
		const isMobile = window.innerWidth < 768;
		
		// Mobile-specific steps
		if (isMobile) {
			return [
				{
					id: 'mobile-open-chat',
					targetSelector: '[data-onboarding-mobile-chat-input]',
					spotlightSize: 180,
					tooltipOffset: { x: 0, y: -200 },
					tooltipPosition: 'top',
				},
				{
					id: 'chat',
					targetSelector: '[data-onboarding-chat-input]',
					spotlightSize: 180,
					tooltipOffset: { x: 0, y: -200 },
					tooltipPosition: 'top',
				},
				{
					id: 'ai',
					targetSelector: '[data-onboarding-chat-messages]',
					spotlightSize: 200,
					tooltipOffset: { x: 0, y: 60 },
					tooltipPosition: 'bottom',
					optional: true,
				},
				{
					id: 'confirm',
					targetSelector: '[data-onboarding-accept-button]',
					spotlightSize: 140,
					tooltipOffset: { x: 0, y: -160 },
					tooltipPosition: 'top',
					optional: true,
				},
				{
					id: 'calendar',
					targetSelector: '[data-onboarding-calendar-view]',
					spotlightSize: 300,
					tooltipOffset: { x: 0, y: -270 },
					tooltipPosition: 'top',
				},
			];
		}
		
		// Desktop steps
		return [
			{
				id: 'chat',
				targetSelector: '[data-onboarding-chat-input]',
				spotlightSize: 200,
				tooltipOffset: { x: 0, y: -180 },
				tooltipPosition: 'top',
			},
			{
				id: 'ai',
				targetSelector: '[data-onboarding-chat-messages]',
				spotlightSize: 240,
				tooltipOffset: { x: 140, y: 0 },
				tooltipPosition: 'right',
				optional: true,
			},
			{
				id: 'confirm',
				targetSelector: '[data-onboarding-accept-button]',
				spotlightSize: 160,
				tooltipOffset: { x: 110, y: 0 },
				tooltipPosition: 'right',
				optional: true,
			},
			{
				id: 'calendar',
				targetSelector: '[data-onboarding-calendar-view]',
				spotlightSize: 350,
				tooltipOffset: { x: 0, y: -220 },
				tooltipPosition: 'top',
			},
		];
	}, []);

	// Filter out optional steps whose elements don't exist
	const availableSteps = useMemo(() => {
		if (!isReady) return stepConfigs;
		
		return stepConfigs.filter(config => {
			if (!config.optional) return true;
			const element = document.querySelector(config.targetSelector);
			return !!element;
		});
	}, [stepConfigs, isReady]);

	// Get current step config
	const currentStepConfig = availableSteps[currentStep];

	// Calculate positions for current step on-demand
	const currentPositions = useMemo(() => {
		if (!currentStepConfig || !isReady) return null;

		const element = document.querySelector(currentStepConfig.targetSelector) as HTMLElement;
		if (!element) return null;

		const rect = element.getBoundingClientRect();
		
		// Tooltip dimensions (estimate based on max-width and padding)
		const isMobile = window.innerWidth < 768;
		const tooltipWidth = isMobile ? 280 : 320;
		const tooltipHeight = 200; // Estimated height
		const padding = 16; // Safe padding from viewport edges
		const gap = 20; // Gap between spotlight and tooltip

		// Spotlight matches the element's dimensions with optional padding
		const spotlightPadding = 8; // Extra padding around element
		const spotlightX = rect.left - spotlightPadding;
		const spotlightY = rect.top - spotlightPadding;
		const spotlightWidth = rect.width + (spotlightPadding * 2);
		const spotlightHeight = rect.height + (spotlightPadding * 2);

		// Viewport bounds
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		// Helper function to check if two rectangles overlap
		const rectanglesOverlap = (
			x1: number, y1: number, w1: number, h1: number,
			x2: number, y2: number, w2: number, h2: number
		): boolean => {
			return !(x1 + w1 < x2 || x2 + w2 < x1 || y1 + h1 < y2 || y2 + h2 < y1);
		};

		// Helper function to check if tooltip is within viewport
		const isWithinViewport = (x: number, y: number): boolean => {
			return x >= padding && 
				   y >= padding && 
				   x + tooltipWidth <= viewportWidth - padding && 
				   y + tooltipHeight <= viewportHeight - padding;
		};

		// Define 8 positions around the spotlight (in priority order)
		const positions: Array<{ x: number; y: number; position: 'top' | 'bottom' | 'left' | 'right' }> = [
			// Top middle
			{
				x: spotlightX + (spotlightWidth / 2) - (tooltipWidth / 2),
				y: spotlightY - tooltipHeight - gap,
				position: 'top'
			},
			// Bottom middle
			{
				x: spotlightX + (spotlightWidth / 2) - (tooltipWidth / 2),
				y: spotlightY + spotlightHeight + gap,
				position: 'bottom'
			},
			// Right middle
			{
				x: spotlightX + spotlightWidth + gap,
				y: spotlightY + (spotlightHeight / 2) - (tooltipHeight / 2),
				position: 'right'
			},
			// Left middle
			{
				x: spotlightX - tooltipWidth - gap,
				y: spotlightY + (spotlightHeight / 2) - (tooltipHeight / 2),
				position: 'left'
			},
			// Top right
			{
				x: spotlightX + spotlightWidth + gap,
				y: spotlightY - tooltipHeight - gap,
				position: 'top'
			},
			// Top left
			{
				x: spotlightX - tooltipWidth - gap,
				y: spotlightY - tooltipHeight - gap,
				position: 'top'
			},
			// Bottom right
			{
				x: spotlightX + spotlightWidth + gap,
				y: spotlightY + spotlightHeight + gap,
				position: 'bottom'
			},
			// Bottom left
			{
				x: spotlightX - tooltipWidth - gap,
				y: spotlightY + spotlightHeight + gap,
				position: 'bottom'
			},
		];

		// Find first position that doesn't overlap and is within viewport
		let tooltipX = 0;
		let tooltipY = 0;
		let tooltipPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';
		let foundValidPosition = false;

		for (const pos of positions) {
			const noOverlap = !rectanglesOverlap(
				pos.x, pos.y, tooltipWidth, tooltipHeight,
				spotlightX, spotlightY, spotlightWidth, spotlightHeight
			);
			const inViewport = isWithinViewport(pos.x, pos.y);

			if (noOverlap && inViewport) {
				tooltipX = pos.x;
				tooltipY = pos.y;
				tooltipPosition = pos.position;
				foundValidPosition = true;
				break;
			}
		}

		// If no valid position found, center tooltip on screen
		if (!foundValidPosition) {
			tooltipX = (viewportWidth / 2) - (tooltipWidth / 2);
			tooltipY = (viewportHeight / 2) - (tooltipHeight / 2);
			tooltipPosition = 'bottom'; // Default arrow position
			
			// Ensure centered position is still within viewport
			tooltipX = Math.max(padding, Math.min(tooltipX, viewportWidth - tooltipWidth - padding));
			tooltipY = Math.max(padding, Math.min(tooltipY, viewportHeight - tooltipHeight - padding));
		}

		return {
			spotlightX,
			spotlightY,
			spotlightWidth,
			spotlightHeight,
			tooltipX,
			tooltipY,
			tooltipPosition,
		};
	}, [currentStepConfig, isReady, currentStep, forceUpdateCounter]);

	// Wait for required elements to be ready
	useEffect(() => {
		if (!isVisible) {
			setIsReady(false);
			return;
		}

		let retryCount = 0;
		const MAX_RETRIES = isDemoMode() ? 50 : 30;
		const RETRY_INTERVAL = 150;

		const checkReady = () => {
			// Check for critical elements
			const isMobile = window.innerWidth < 768;
			const chatInput = document.querySelector('[data-onboarding-chat-input]');
			const mobileChatInput = document.querySelector('[data-onboarding-mobile-chat-input]');
			const calendarView = document.querySelector('[data-onboarding-calendar-view]');
			const calendarEventsContainer = document.querySelector('#calendar-events-container');
			const hasCalendarEvents = calendarEventsContainer && calendarEventsContainer.children.length > 0;

			// For mobile, we need mobileChatInput first (before opening chat)
			// For desktop, we need chatInput (it's always visible)
			const hasRequiredChatElement = isMobile ? !!mobileChatInput : !!chatInput;

			if (hasRequiredChatElement && calendarView && hasCalendarEvents) {
				setIsReady(true);
				return;
			}

			if (retryCount < MAX_RETRIES) {
				retryCount++;
				setTimeout(checkReady, RETRY_INTERVAL);
			} else {
				console.error('[OnboardingGuide] Max retries reached, proceeding anyway');
				setIsReady(true);
			}
		};

		const initialTimer = setTimeout(checkReady, 300);

		// Listen for resize, scroll, and demo data events
		const handleResize = () => {
			setForceUpdate(prev => prev + 1);
		};

		const handleScroll = () => {
			setForceUpdate(prev => prev + 1);
		};

		const handleDemoDataEvent = () => {
			retryCount = 0;
			setTimeout(checkReady, 200);
		};

		window.addEventListener('resize', handleResize);
		window.addEventListener('scroll', handleScroll, true); // Use capture phase to catch all scroll events
		window.addEventListener(ONBOARDING_DEMO_DATA_EVENT, handleDemoDataEvent as EventListener);

		// MutationObserver for calendar events
		const calendarEventsContainer = document.querySelector('#calendar-events-container');
		let observer: MutationObserver | null = null;

		if (calendarEventsContainer) {
			observer = new MutationObserver((mutations) => {
				const hasAddedNodes = mutations.some(m => m.addedNodes.length > 0);
				if (hasAddedNodes) {
					retryCount = 0;
					setTimeout(checkReady, 100);
				}
			});

			observer.observe(calendarEventsContainer, { childList: true, subtree: true });
		}

		return () => {
			clearTimeout(initialTimer);
			window.removeEventListener('resize', handleResize);
			window.removeEventListener('scroll', handleScroll, true);
			window.removeEventListener(ONBOARDING_DEMO_DATA_EVENT, handleDemoDataEvent as EventListener);
			if (observer) observer.disconnect();
		};
	}, [isVisible]);

	const handleNext = () => {
		const isMobile = window.innerWidth < 768;
		const nextStepConfig = availableSteps[currentStep + 1];
		
		// If on mobile and we're on the mobile-open-chat step, trigger the mobile chat to open
		if (isMobile && currentStepConfig.id === 'mobile-open-chat') {
			// Dispatch event to open mobile chat
			window.dispatchEvent(new CustomEvent('onboarding-open-mobile-chat'));
			// Wait a moment for the chat to open before moving to next step
			setTimeout(() => {
				setCurrentStep(currentStep + 1);
			}, 300);
			return;
		}
		
		// If on mobile and moving to calendar step, close the chat view first
		if (isMobile && nextStepConfig && nextStepConfig.id === 'calendar') {
			// Dispatch event to close mobile chat
			window.dispatchEvent(new CustomEvent('onboarding-close-mobile-chat'));
			// Wait a moment for the chat to close before moving to next step
			setTimeout(() => {
				setCurrentStep(currentStep + 1);
			}, 300);
			return;
		}
		
		if (currentStep < availableSteps.length - 1) {
			setCurrentStep(currentStep + 1);
		} else {
			handleComplete();
		}
	};

	const handlePrev = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	const handleComplete = () => {
		localStorage.setItem(LOCALSTORAGE_KEY, 'true');
		onComplete();
	};

	const handleSkipAll = () => {
		localStorage.setItem(LOCALSTORAGE_KEY, 'true');
		onSkip();
	};

	if (!isVisible || !isReady || !currentPositions) {
		return null;
	}

	return (
		<OverlayContainer $visible={isVisible}>
			<SpotlightRectangle
				$x={currentPositions.spotlightX}
				$y={currentPositions.spotlightY}
				$width={currentPositions.spotlightWidth}
				$height={currentPositions.spotlightHeight}
			/>
			<TooltipCard
				$x={currentPositions.tooltipX}
				$y={currentPositions.tooltipY}
				$position={currentPositions.tooltipPosition}
			>
				<CloseButton onClick={handleSkipAll} aria-label="Close guide">
					<X size={20} />
				</CloseButton>
				
				<StepIndicator>
					{availableSteps.map((_, index) => (
						<StepDot key={index} $active={index === currentStep} />
					))}
				</StepIndicator>

				<TooltipTitle>{t(`common.onboarding.guide.steps.${currentStepConfig.id}.title`)}</TooltipTitle>
				<TooltipDescription>
					{t(`common.onboarding.guide.steps.${currentStepConfig.id}.description`)}
				</TooltipDescription>

				<ButtonGroup>
					<SkipButton onClick={handleSkipAll}>{t('common.onboarding.guide.skip')}</SkipButton>
					<NavButtons>
						{currentStep > 0 && (
							<NavButton onClick={handlePrev}>
								{t('common.onboarding.guide.prev')}
							</NavButton>
						)}
						<NavButton $variant="primary" onClick={handleNext}>
							{currentStep === availableSteps.length - 1
								? t('common.onboarding.guide.done')
								: t('common.onboarding.guide.next')}
						</NavButton>
					</NavButtons>
				</ButtonGroup>
			</TooltipCard>
		</OverlayContainer>
	);
};

export default OnboardingGuide;

// Helper hook to check if onboarding should be shown
export const useOnboardingGuide = () => {
	const [shouldShow, setShouldShow] = useState(false);

	useEffect(() => {
		const hasCompleted = localStorage.getItem(LOCALSTORAGE_KEY);
		setShouldShow(!hasCompleted);
	}, []);

	const markAsCompleted = () => {
		localStorage.setItem(LOCALSTORAGE_KEY, 'true');
		setShouldShow(false);
	};

	const resetOnboarding = () => {
		localStorage.removeItem(LOCALSTORAGE_KEY);
		setShouldShow(true);
	};

	// Start onboarding demo - injects demo data and triggers onboarding
	const startOnboardingDemo = async () => {
		const { activateOnboardingDemo } = await import('@/config/demo_config');
		
		// Activate demo mode temporarily
		activateOnboardingDemo('current-persona');
		
		// Reset and show onboarding
		localStorage.removeItem(LOCALSTORAGE_KEY);
		await new Promise(resolve => setTimeout(resolve, 1000));
		setShouldShow(true);
	};

	// End onboarding demo - deactivates demo mode
	const endOnboardingDemo = async () => {
		const { deactivateOnboardingDemo } = await import('@/config/demo_config');
		deactivateOnboardingDemo();
		markAsCompleted();
	};

	return {
		shouldShow,
		markAsCompleted,
		resetOnboarding,
		startOnboardingDemo,
		endOnboardingDemo,
	};
};
