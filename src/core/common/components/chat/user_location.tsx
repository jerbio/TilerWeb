import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import palette from '@/core/theme/palette';
import useAppStore from '@/global_state';

// Define prop types for styled components
interface StyledProps {
  $isLoading?: boolean; // Using $ prefix to avoid DOM attribute warnings
}

// Pulse animation loader component
const PulseIndicator = styled.span`
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: ${palette.colors.brand[500]};
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
	background-color: ${palette.colors.gray[900]};
	border: 1px solid ${palette.colors.gray[700]};
	border-radius: 6px;
	font-size: 0.75rem;
	color: ${palette.colors.gray[400]};
	display: flex;
	align-items: center;
	gap: 6px;
	cursor: ${props => props.$isLoading ? 'default' : 'pointer'};
	transition: all 0.2s ease-in-out;
	position: relative;
	overflow: visible; /* Changed from hidden to allow tooltips to show */
	
	&:hover {
		border-color: ${props => props.$isLoading ? palette.colors.gray[700] : palette.colors.brand[500]};
		color: ${props => props.$isLoading ? palette.colors.gray[400] : palette.colors.gray[300]};
		box-shadow: ${props => props.$isLoading ? 'none' : '0 0 5px rgba(237, 18, 59, 0.3)'};
	}
	
	&:before {
		content: '';
		position: absolute;
		left: 0;
		bottom: 0;
		height: 2px;
		width: 0;
		background-color: ${palette.colors.brand[500]};
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
	background-color: ${palette.colors.gray[800]};
	border: 1px solid ${palette.colors.gray[600]};
	border-radius: 4px;
	padding: 6px 10px;
	color: ${palette.colors.gray[200]};
	font-size: 0.75rem;
	width: 100%;
	transition: all 0.2s ease;
	
	&:focus {
		outline: none;
		border-color: ${palette.colors.brand[500]};
		box-shadow: 0 0 0 1px ${palette.colors.brand[500]};
	}
	
	&::placeholder {
		color: ${palette.colors.gray[500]};
	}
`;

const SubmitButton = styled.button`
	background-color: ${palette.colors.brand[500]};
	color: white;
	border: none;
	border-radius: 4px;
	padding: 6px 12px;
	font-size: 0.75rem;
	font-weight: 500;
	cursor: pointer;
	transition: background-color 0.2s ease;
	
	&:hover {
		background-color: ${palette.colors.brand[600]};
	}
	
	&:active {
		background-color: ${palette.colors.brand[700]};
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

// UserLocation component - displays the user's location
const UserLocation: React.FC = () => {
	// Default location: National Museum of African American History and Culture in DC
	const DEFAULT_LOCATION = "National Museum of African American History and Culture, Washington, DC";
	
	const [location, setLocation] = useState<string>(DEFAULT_LOCATION);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error] = useState<string | null>(null);
	const [isEditing, setIsEditing] = useState<boolean>(false);
	const [customLocation, setCustomLocation] = useState<string>('');
	const [useDefaultLocation, setUseDefaultLocation] = useState<boolean>(true);
	const inputRef = useRef<HTMLInputElement>(null);
	const tooltipRef = useRef<HTMLDivElement>(null);
	const locationRef = useRef<HTMLDivElement>(null);
	
	// Get and update user info from global state
	const userInfo = useAppStore((state) => state.userInfo);
	const setUserInfo = useAppStore((state) => state.setUserInfo);

	useEffect(() => {
		const fetchLocation = async () => {
			// If we already have a saved location in global state, use that
			if (userInfo?.location) {
				setLocation(userInfo.location);
				setCustomLocation(userInfo.location);
				setUseDefaultLocation(false);
				setIsLoading(false);
				return;
			}
			
			try {
				setIsLoading(true);

				// Check if geolocation is supported by the browser
				if (!navigator.geolocation) {
					console.log('Geolocation not supported, using default location');
					// Use default location if geolocation is not supported
					setLocation(DEFAULT_LOCATION);
					setCustomLocation(DEFAULT_LOCATION);
					setUseDefaultLocation(true);
					setIsLoading(false);
					return;
				}

				// Get the current position with a timeout
				const positionPromise = new Promise<GeolocationPosition>((resolve, reject) => {
					navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
				});
				
				// Race between position fetch and timeout
				try {
					// Try to get user position with a timeout
					const timeoutPromise = new Promise<never>((_, reject) => {
						setTimeout(() => reject(new Error('Geolocation request timed out')), 10000);
					});
					
					const position = await Promise.race([positionPromise, timeoutPromise]) as GeolocationPosition;
					const { latitude, longitude } = position.coords;
					const latitudeStr = latitude.toString();
					const longitudeStr = longitude.toString();


					try {
						// Use reverse geocoding to get a human-readable address
						const response = await fetch(
							`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
						);

						if (!response.ok) {
							throw new Error('Failed to fetch location information');
						}

						const data = await response.json();

						// Format the address in a user-friendly way
						const address =
							data.display_name ||
							`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
						setLocation(address);
						setCustomLocation(address); // Initialize custom location with the fetched location
						setUseDefaultLocation(false);
						
						// Save to global state if we have a user
						if (userInfo) {
							setUserInfo({
								...userInfo,
								location: address,
								userLongitude: longitudeStr,
								userLatitude: latitudeStr,
								userLocationVerified: "true",
							});
						}
					} catch (err) {
						// If reverse geocoding fails, just use coordinates
						const coords = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
						setLocation(coords);
						setCustomLocation(coords);
						setUseDefaultLocation(false);
                        console.log('Reverse geocoding failed, using coordinates', err);
						
						// Save to global state if we have a user
						if (userInfo) {
							setUserInfo({
								...userInfo,
								location: coords
							});
						}
					}
				} catch (err) {
					console.log('Geolocation failed, using default location', err);
					// If geolocation fails for any reason, use the default location
					setLocation(DEFAULT_LOCATION);
					setCustomLocation(DEFAULT_LOCATION);
					setUseDefaultLocation(true);
				}

				setIsLoading(false);
			} catch (err) {
				console.error('Unexpected error in location fetch:', err);
				// Use default location if there's any error
				setLocation(DEFAULT_LOCATION);
				setCustomLocation(DEFAULT_LOCATION);
				setUseDefaultLocation(true);
				setIsLoading(false);
			}
		};

		fetchLocation();
	}, [userInfo, setUserInfo, DEFAULT_LOCATION]);

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
					arrow.style.borderColor = "transparent transparent " + palette.colors.gray[800] + " transparent";
				}
			}
		}
	}, [isEditing]);

	// Handle location edit start
	const handleEditClick = () => {
		// Only trigger if we're not already editing
		if (!isLoading && !isEditing) {
			setIsEditing(true);
		}
	};

	// Handle location submit
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		e.stopPropagation(); // Prevent event bubbling that might trigger blur
		
		if (customLocation.trim()) {
			setLocation(customLocation);
			
			// Check if the entered location is different from the default
			const isUsingDefault = customLocation.trim() === DEFAULT_LOCATION;
			setUseDefaultLocation(isUsingDefault);
			
			// Update global state with the new location
			if (userInfo) {
				setUserInfo({
					...userInfo,
					location: customLocation.trim()
				});
			}
		}
		setIsEditing(false);
	};

	// Reset location to default
	const resetToDefault = () => {
		setLocation(DEFAULT_LOCATION);
		setCustomLocation(DEFAULT_LOCATION);
		setUseDefaultLocation(true);
		
		// Update global state
		if (userInfo) {
			setUserInfo({
				...userInfo,
				location: DEFAULT_LOCATION
			});
		}
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
	
	// No need to define styled components here anymore - they're moved outside

	// Don't display anything if there's an error
	if (error) {
		return null;
	}

	// Message explaining the benefits of setting a custom location
	const locationBenefitMessage = "Setting your actual location helps us create more relevant tiles and improve your experience with personalized scheduling suggestions.";
	
	return (
		<LocationContainer 
			$isLoading={isLoading}
			onClick={handleEditClick}
			style={{
				borderStyle: useDefaultLocation && !isEditing ? 'dashed' : 'solid',
				borderColor: useDefaultLocation && !isEditing ? `${palette.colors.brand[400]}` : undefined
			}}
		>
			<LocationIconWrapper>
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					style={{ 
						color: isEditing ? palette.colors.brand[400] : 
							useDefaultLocation ? palette.colors.brand[300] : 'currentColor' 
					}}
				>
					<path
						d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
						fill="currentColor"
					/>
				</svg>
				{/* Tooltip is now handled with fixed positioning */}
				<div 
					style={{ position: 'relative' }}
					onMouseOver={() => showTooltip('location-icon-tooltip')}
					onMouseOut={() => hideTooltip('location-icon-tooltip')}
				>
					{/* Fixed tooltip that appears at the top of the viewport */}
					<div 
						id="location-icon-tooltip"
						style={{
							position: 'absolute',
							bottom: '100%',  // Position above the location icon
							left: '-30px',   // More offset from left edge
							marginBottom: '15px', // More space between tooltip and element
							backgroundColor: palette.colors.gray[800],
							color: palette.colors.white,
							padding: '12px 16px',
							borderRadius: '8px',
							fontSize: '0.875rem',
							fontWeight: 400,
							boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
							width: '280px',
							maxWidth: 'calc(100vw - 40px)',
							textAlign: 'center',
							lineHeight: '1.5',
							zIndex: 10000,
							opacity: 0,
							visibility: 'hidden',
							transition: 'opacity 0.3s, visibility 0.3s',
							pointerEvents: 'none', // Let clicks go through
						}}
					>
						{isEditing ? 
							"Enter your location" :
							(useDefaultLocation ? 
								<>
									Using default location - Click to change.
									<br /><br />
									{locationBenefitMessage}
								</> :
								"Click to edit your location"
							)
						}
						{/* Arrow pointing to the location icon */}
						<div style={{
							position: 'absolute',
							width: '12px',
							height: '12px',
							backgroundColor: palette.colors.gray[800],
							bottom: '-6px',
							left: '36px', // Adjusted to match new left offset
							transform: 'rotate(45deg)',
							zIndex: 9999,
							boxShadow: '2px 2px 3px rgba(0, 0, 0, 0.2)'
						}} />
					</div>
				</div>
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
						placeholder="Enter your location"
						autoComplete="off"
					/>
					<div 
						style={{ display: 'flex', gap: '4px' }}
						onClick={(e) => e.stopPropagation()} // Prevent clicks in button area from bubbling
					>
						{customLocation !== DEFAULT_LOCATION && (
							<SubmitButton 
								type="button" 
								onClick={(e) => {
									e.stopPropagation();
									e.preventDefault(); // Prevent form submission
									setCustomLocation(DEFAULT_LOCATION);
								}}
								style={{ 
									backgroundColor: palette.colors.gray[700],
									fontSize: '0.7rem',
									padding: '4px 8px'
								}}
							>
								Default
							</SubmitButton>
						)}
						<SubmitButton 
							type="submit"
							onClick={(e) => e.stopPropagation()}
						>
							Save
						</SubmitButton>
					</div>
				</LocationForm>
			) : (
				<span style={{ 
					display: 'flex', 
					alignItems: 'center', 
					gap: '6px',
					fontStyle: useDefaultLocation ? 'italic' : 'normal',
					color: useDefaultLocation ? palette.colors.gray[300] : palette.colors.gray[400]
				}}>
					{isLoading ? (
						<>
							Getting location...
							<PulseIndicator />
						</>
					) : (
						<>
							{location}
							{useDefaultLocation ? (									<div 
									style={{ 
										position: 'relative', 
										display: 'inline-block',
										zIndex: 100
									}}
								>
									<span 
										style={{ 
											fontSize: '0.65rem', 
											color: palette.colors.brand[300],
											backgroundColor: 'rgba(237, 18, 59, 0.1)',
											padding: '2px 4px',
											borderRadius: '3px',
											cursor: 'help'
										}}
										onClick={(e) => {
											e.stopPropagation(); // Prevent triggering LocationContainer click
											setIsEditing(true); // Start editing directly from badge click
										}}
										onMouseOver={() => showTooltip('default-badge-tooltip')}
										onMouseOut={() => hideTooltip('default-badge-tooltip')}
									>
										Default
									</span>
									
									{/* Fixed tooltip that always appears at the top center of the viewport */}
									<div 
										id="default-badge-tooltip"
										style={{
											position: 'absolute',
											bottom: 'calc(100% + 10px)', // Position above the badge
											right: '-50px',            // Offset from the right edge
											backgroundColor: palette.colors.gray[800],
											color: palette.colors.white,
											padding: '12px 16px',
											borderRadius: '8px',
											fontSize: '0.875rem',
											fontWeight: 400,
											boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
											width: '250px',
											maxWidth: 'calc(100vw - 40px)',
											textAlign: 'center',
											lineHeight: '1.5',
											zIndex: 10000,
											opacity: 0,
											visibility: 'hidden',
											transition: 'opacity 0.3s, visibility 0.3s',
											pointerEvents: 'none', // Let clicks go through
										}}
									>
										{locationBenefitMessage}
										{/* Arrow pointing to the Default badge */}
										<div style={{
											position: 'absolute',
											width: '12px',
											height: '12px',
											backgroundColor: palette.colors.gray[800],
											bottom: '-6px',
											right: '70px', // Adjusted to point at the badge
											transform: 'rotate(45deg)',
											zIndex: 9999,
											boxShadow: '2px 2px 3px rgba(0, 0, 0, 0.2)'
										}} />
									</div>
								</div>
							) : (
								<span 
									style={{ 
										fontSize: '0.65rem', 
										color: palette.colors.gray[500],
										cursor: 'pointer',
										marginLeft: '4px',
										textDecoration: 'underline',
										textDecorationStyle: 'dotted'
									}}
									onClick={(e) => {
										e.stopPropagation();
										resetToDefault();
									}}
								>
									Reset to default
								</span>
							)}
						</>
					)}
				</span>
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

export default UserLocation;
