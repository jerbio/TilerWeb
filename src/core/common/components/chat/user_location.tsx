import React, { useEffect, useState, useRef } from 'react';
import styled, { useTheme } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { locationService, LocationData } from '@/services/locationService';

// Define prop types for styled components
interface StyledProps {
  $isLoading?: boolean; // Using $ prefix to avoid DOM attribute warnings
  $isEditing?: boolean;
  $useDefaultLocation?: boolean;
}

// Pulse animation loader component
const PulseIndicator = styled.span`
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: ${({ theme }) => theme.colors.brand[500]};
	display: inline-block;
	animation: pulse 1.5s infinite;
	
	@keyframes pulse {
		0% { opacity: 0.4; }
		50% { opacity: 1; }
		100% { opacity: 0.4; }
	}
`;

// Styled components for UserLocation
const LocationContainer = styled.div<StyledProps>`
	margin-top: 10px;
	padding: 8px 12px;
	background-color: ${({ theme }) => theme.colors.background.card2};
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-style: ${props => props.$useDefaultLocation && !props.$isEditing ? 'dashed' : 'solid'};
	border-color: ${({ $useDefaultLocation, $isEditing, theme }) => $useDefaultLocation && !$isEditing ? theme.colors.brand[400] : theme.colors.border.default};
	border-radius: 6px;
	font-size: 0.75rem;
	color: ${({ theme }) => theme.colors.text.secondary};
	display: flex;
	align-items: center;
	gap: 6px;
	cursor: ${props => props.$isLoading ? 'default' : 'pointer'};
	transition: all 0.2s ease-in-out;
	position: relative;
	overflow: visible;
	
	&:hover {
		border-color: ${({ $isLoading, theme }) => $isLoading ? theme.colors.border.default : theme.colors.brand[500]};
		color: ${({ $isLoading, theme }) => $isLoading ? theme.colors.text.secondary : theme.colors.text.primary};
		box-shadow: ${props => props.$isLoading ? 'none' : '0 0 5px rgba(237, 18, 59, 0.3)'};
	}
	
	&:before {
		content: '';
		position: absolute;
		left: 0;
		bottom: 0;
		height: 2px;
		width: 0;
		background-color: ${({ theme }) => theme.colors.brand[500]};
		transition: width 0.3s ease;
	}
	
	&:hover:before {
		width: ${props => props.$isLoading ? '0' : '100%'};
	}
`;

const LocationForm = styled.form`
	display: flex;
	align-items: center;
	width: 100%;
	gap: 8px;
`;

const LocationInput = styled.input`
	background-color: ${({ theme }) => theme.colors.background.card2};
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: 4px;
	padding: 6px 10px;
	color: ${({ theme }) => theme.colors.text.primary};
	font-size: 0.75rem;
	width: 100%;
	transition: all 0.2s ease;
	
	&:focus {
		outline: none;
		border-color: ${({ theme }) => theme.colors.brand[500]};
		box-shadow: 0 0 0 1px ${({ theme }) => theme.colors.brand[500]};
	}
	
	&::placeholder {
		color: ${({ theme }) => theme.colors.text.muted};
	}
`;

const SubmitButton = styled.button`
	background-color: ${({ theme }) => theme.colors.brand[500]};
	color: ${({ theme }) => theme.colors.white};
	border: none;
	border-radius: 4px;
	padding: 6px 12px;
	font-size: 0.75rem;
	font-weight: 500;
	cursor: pointer;
	transition: background-color 0.2s ease;
	
	&:hover {
		background-color: ${({ theme }) => theme.colors.brand[600]};
	}
	
	&:active {
		background-color: ${({ theme }) => theme.colors.brand[700]};
	}
`;

const LocationIconWrapper = styled.div`
	position: relative;
	display: flex;
	align-items: center;
	z-index: 10;
	
	/* Create more hover area for better tooltip triggering */
	&:before {
		content: '';
		position: absolute;
		top: -20px;
		left: -10px;
		right: -10px;
		bottom: -10px;
		z-index: -1;
	}
`;

const LocationIcon = styled.svg<StyledProps>`
	color: ${props => 
		props.$isEditing ? props.theme.colors.brand[400] : 
		props.$useDefaultLocation ? props.theme.colors.brand[300] : 'currentColor'
	};
`;

const TooltipContainer = styled.div`
	position: relative;
`;

const Tooltip = styled.div`
	position: absolute;
	bottom: 100%;
	left: -30px;
	margin-bottom: 15px;
	background-color: ${({ theme }) => theme.colors.background.card2};
	color: ${({ theme }) => theme.colors.text.primary};
	padding: 12px 16px;
	border-radius: 8px;
	font-size: 0.875rem;
	font-weight: 400;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
	width: 280px;
	max-width: calc(100vw - 40px);
	text-align: center;
	line-height: 1.5;
	z-index: 10000;
	opacity: 0;
	visibility: hidden;
	transition: opacity 0.3s, visibility 0.3s;
	pointer-events: none;
`;

const TooltipArrow = styled.div`
	position: absolute;
	width: 12px;
	height: 12px;
	background-color: ${({ theme }) => theme.colors.background.card2};
	bottom: -6px;
	left: 36px;
	transform: rotate(45deg);
	z-index: 9999;
	box-shadow: 2px 2px 3px rgba(0, 0, 0, 0.2);
`;

const ButtonContainer = styled.div`
	display: flex;
	gap: 4px;
`;

const DefaultButton = styled(SubmitButton)`
	background-color: ${({ theme }) => theme.colors.button.ghost.bgHover};
	font-size: 0.7rem;
	padding: 4px 8px;
`;

const LocationText = styled.span<StyledProps>`
	display: flex;
	align-items: center;
	gap: 6px;
	font-style: ${props => props.$useDefaultLocation ? 'italic' : 'normal'};
	color: ${({ $useDefaultLocation, theme }) => $useDefaultLocation ? theme.colors.text.secondary : theme.colors.text.muted};
`;

const DefaultBadgeContainer = styled.div`
	position: relative;
	display: inline-block;
	z-index: 100;
`;

const DefaultBadge = styled.span`
	font-size: 0.65rem;
	color: ${({ theme }) => theme.colors.brand[300]};
	background-color: rgba(237, 18, 59, 0.1);
	padding: 2px 4px;
	border-radius: 3px;
	cursor: help;
`;

const DefaultBadgeTooltip = styled.div`
	position: absolute;
	bottom: calc(100% + 10px);
	right: -50px;
	background-color: ${({ theme }) => theme.colors.background.card2};
	color: ${({ theme }) => theme.colors.text.primary};
	padding: 12px 16px;
	border-radius: 8px;
	font-size: 0.875rem;
	font-weight: 400;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
	width: 250px;
	max-width: calc(100vw - 40px);
	text-align: center;
	line-height: 1.5;
	z-index: 10000;
	opacity: 0;
	visibility: hidden;
	transition: opacity 0.3s, visibility 0.3s;
	pointer-events: none;
`;

const DefaultBadgeTooltipArrow = styled.div`
	position: absolute;
	width: 12px;
	height: 12px;
	background-color: ${({ theme }) => theme.colors.background.card2};
	bottom: -6px;
	right: 70px;
	transform: rotate(45deg);
	z-index: 9999;
	box-shadow: 2px 2px 3px rgba(0, 0, 0, 0.2);
`;

const ResetLink = styled.span`
	font-size: 0.65rem;
	color: ${({ theme }) => theme.colors.text.muted};
	cursor: pointer;
	margin-left: 4px;
	text-decoration: underline;
	text-decoration-style: dotted;
`;

// UserLocation component - displays the user's location
const UserLocation: React.FC = () => {
	const { t } = useTranslation();
	const theme = useTheme();

	const [locationData, setLocationData] = useState<LocationData>(locationService.getDefaultLocation());
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error] = useState<string | null>(null);
	const [isEditing, setIsEditing] = useState<boolean>(false);
	const [customLocation, setCustomLocation] = useState<string>('');
	const [isLocationFetching, setIsLocationFetching] = useState<boolean>(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const tooltipRef = useRef<HTMLDivElement>(null);
	const locationRef = useRef<HTMLDivElement>(null);
	
	// Location data is now managed locally by the service

	// Location service handles all location logic now

	// Location data is now managed by the service and doesn't need global state

	useEffect(() => {
		const fetchLocation = async () => {
			try {
				setIsLoading(true);
				const currentLocation = await locationService.getCurrentLocation();
				setLocationData(currentLocation);
				setCustomLocation(currentLocation.location);
			} catch (err) {
				console.error('Unexpected error in location fetch:', err);
				const defaultLocation = locationService.getDefaultLocation();
				setLocationData(defaultLocation);
				setCustomLocation(defaultLocation.location);
			} finally {
				setIsLoading(false);
			}
		};

		fetchLocation();
	}, []);

	// Focus the input field when editing starts
	useEffect(() => {
		if (isEditing && inputRef.current) {
			inputRef.current.focus();
		}
	}, [isEditing]);

	// Adjust tooltip position if needed to prevent it from being cut off
	useEffect(() => {
		if (isEditing && tooltipRef.current && locationRef.current) {
			const tooltipElement = tooltipRef.current;
			const locationElement = locationRef.current;
			const tooltipRect = tooltipElement.getBoundingClientRect();
			locationElement.getBoundingClientRect(); // Get element dimensions
			
			// Check if the tooltip would be cut off at the top
			if (tooltipRect.top < 0) {
				// Position below instead
				tooltipElement.style.top = "auto";
				tooltipElement.style.bottom = "auto";
				tooltipElement.style.transform = "translateX(-50%)";
				tooltipElement.style.top = "100%";
				
				// Flip the arrow to point upward
				const arrow = tooltipElement.querySelector("::after") as HTMLElement;
				if (arrow) {
					arrow.style.bottom = "auto";
					arrow.style.top = "-10px";
					arrow.style.borderColor = "transparent transparent " + theme.colors.background.card2 + " transparent";
				}
			}
		}
	}, [isEditing]);

	// Get real-time location
	const getCurrentLocation = async () => {
		try {
			setIsLocationFetching(true);
			const currentLocation = await locationService.refreshLocationFromBrowser();
			setLocationData(currentLocation);
			setCustomLocation(currentLocation.location);
		} catch (err) {
			console.error('Error getting current location:', err);
		} finally {
			setIsLocationFetching(false);
		}
	};

	// Handle location icon click
	const handleLocationIconClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		getCurrentLocation();
	};

	// Handle location edit start
	const handleEditClick = () => {
		// Only trigger if we're not already editing
		if (!isLoading && !isEditing) {
			setIsEditing(true);
		}
	};

	// Geocoding is now handled by the location service

	// Handle location submit
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		e.stopPropagation(); // Prevent event bubbling that might trigger blur

		if (customLocation.trim()) {
			setIsLocationFetching(true);

			try {
				const newLocationData = await locationService.getLocationFromAddress(customLocation.trim());
				setLocationData(newLocationData);
				// Cache the manual location so it persists between re-renders
				locationService.setManualLocation(newLocationData);
			} catch (err) {
				console.error('Error setting location:', err);
				// Fallback to entered text if service fails
				const fallbackLocation = {
					location: customLocation.trim(),
					verified: false,
				};
				setLocationData(fallbackLocation);
				locationService.setManualLocation(fallbackLocation);
			} finally {
				setIsLocationFetching(false);
			}
		}
		setIsEditing(false);
	};

	// Reset location to default
	const resetToDefault = () => {
		const defaultLocation = locationService.getDefaultLocation();
		locationService.setCurrentLocation(defaultLocation);
		setLocationData(defaultLocation);
		setCustomLocation(defaultLocation.location);
		// Clear the cached manual location
		locationService.clearManualLocation();
	};

	// Handle clicking outside to cancel editing
	const handleBlur = (e: React.FocusEvent<HTMLFormElement>) => {
		// Don't hide the input if we're clicking within the form
		// This prevents the input from disappearing during typing
		if (e.currentTarget.contains(e.relatedTarget as Node)) {
			return;
		}
		
		// Small delay to allow for form submission if clicked on submit button
		setTimeout(() => {
			setIsEditing(false);
		}, 200);
	};
	
	// Don't display anything if there's an error
	if (error) {
		return null;
	}

	// Message explaining the benefits of setting a custom location
	const locationBenefitMessage = t('home.expanded.chat.userLocation.locationBenefitMessage');
	
	return (
		<LocationContainer
			$isLoading={isLoading}
			$isEditing={isEditing}
			$useDefaultLocation={!locationData.verified}
			onClick={handleEditClick}
		>
			<LocationIconWrapper>
				<LocationIcon
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					$isEditing={isEditing}
					$useDefaultLocation={!locationData.verified}
					onClick={handleLocationIconClick}
					style={{ cursor: isLocationFetching ? 'wait' : 'pointer' }}
				>
					<path
						d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
						fill="currentColor"
					/>
				</LocationIcon>
				{/* Tooltip is now handled with fixed positioning */}
				<TooltipContainer
					onMouseOver={() => showTooltip('location-icon-tooltip')}
					onMouseOut={() => hideTooltip('location-icon-tooltip')}
				>
					{/* Fixed tooltip that appears at the top of the viewport */}
					<Tooltip id="location-icon-tooltip">
						{isLocationFetching ?
							t('home.expanded.chat.userLocation.gettingCurrentLocation') :
							isEditing ?
								t('home.expanded.chat.userLocation.enterLocation') :
								(!locationData.verified ?
									<>
										{t('home.expanded.chat.userLocation.usingDefaultLocation')}
										<br /><br />
										{locationBenefitMessage}
									</> :
									t('home.expanded.chat.userLocation.clickIconToGetLocation')
								)
						}
						{/* Arrow pointing to the location icon */}
						<TooltipArrow />
					</Tooltip>
				</TooltipContainer>
			</LocationIconWrapper>
			
			{isEditing ? (
				<LocationForm 
					onSubmit={handleSubmit} 
					onBlur={handleBlur}
					onClick={(e) => e.stopPropagation()} // Prevent form clicks from bubbling
				>
					<LocationInput
						ref={inputRef}
						type="text"
						value={customLocation}
						onChange={(e) => {
							e.stopPropagation();
							setCustomLocation(e.target.value);
						}}
						onClick={(e) => e.stopPropagation()} // Prevent clicks in input from bubbling
						onMouseDown={(e) => e.stopPropagation()} // Ensure mouse interactions don't trigger unwanted effects
						placeholder={t('home.expanded.chat.userLocation.enterLocation')}
						autoComplete="off"
					/>
					<ButtonContainer onClick={(e) => e.stopPropagation()}>
						{customLocation !== locationService.getDefaultLocation().location && (
							<DefaultButton 
								type="button" 
								onClick={(e) => {
									e.stopPropagation();
									e.preventDefault(); // Prevent form submission
									setCustomLocation(locationService.getDefaultLocation().location);
								}}
							>
								Default
							</DefaultButton>
						)}
						<SubmitButton 
							type="submit"
							onClick={(e) => e.stopPropagation()}
							disabled={isLocationFetching}
						>
							{isLocationFetching ? t('home.expanded.chat.userLocation.saving') : t('home.expanded.chat.userLocation.save')}
						</SubmitButton>
					</ButtonContainer>
				</LocationForm>
			) : (
				<LocationText $useDefaultLocation={!locationData.verified}>
					{isLoading || isLocationFetching ? (
						<>
							{isLocationFetching ? t('home.expanded.chat.userLocation.gettingCurrentLocation') : t('home.expanded.chat.userLocation.gettingLocation')}
							<PulseIndicator />
						</>
					) : (
						<>
							{locationData.location}
							{!locationData.verified ? (
								<DefaultBadgeContainer>
									<DefaultBadge 
										onClick={(e) => {
											e.stopPropagation(); // Prevent triggering LocationContainer click
											setIsEditing(true); // Start editing directly from badge click
										}}
										onMouseOver={() => showTooltip('default-badge-tooltip')}
										onMouseOut={() => hideTooltip('default-badge-tooltip')}
									>
										{t('home.expanded.chat.userLocation.default')}
									</DefaultBadge>
									
									{/* Fixed tooltip that always appears at the top center of the viewport */}
									<DefaultBadgeTooltip id="default-badge-tooltip">
										{locationBenefitMessage}
										{/* Arrow pointing to the Default badge */}
										<DefaultBadgeTooltipArrow />
									</DefaultBadgeTooltip>
								</DefaultBadgeContainer>
							) : (
								<ResetLink 
									onClick={(e) => {
										e.stopPropagation();
										resetToDefault();
									}}
								>
									{t('home.expanded.chat.userLocation.resetToDefault')}
								</ResetLink>
							)}
						</>
					)}
				</LocationText>
			)}
			
			{/* Animation is handled in the styled component */}
		</LocationContainer>
	);
};

// Tooltip helper functions
export const showTooltip = (id: string) => {
	const tooltip = document.getElementById(id);
	if (tooltip) {
		tooltip.style.opacity = '1';
		tooltip.style.visibility = 'visible';
	}
};

export const hideTooltip = (id: string) => {
	const tooltip = document.getElementById(id);
	if (tooltip) {
		tooltip.style.opacity = '0';
		tooltip.style.visibility = 'hidden';
	}
};

// Export function to get current location data for other components
export const getCurrentLocationData = () => {
	return locationService.getCurrentLocation();
};

export default UserLocation;
