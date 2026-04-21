import styled from 'styled-components';
import Input from './input';
import { EventLocation, LocationSource } from '@/core/common/types/schedule';
import { useEffect, useRef, useState } from 'react';
import { scheduleService } from '@/services';
import { Bookmark, CheckCircle2, Loader2, MapPin, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type LocationInputController = {
	isVerified: boolean;
	location: string;
	setLocation: (value: string) => void;
	clearLocation: () => void;
	setFromSelection: (loc: EventLocation) => void;
};

type LocationInputProps = {
	label?: React.ReactNode;
	placeholder?: string;
	controller: LocationInputController;
	containerStyle?: React.CSSProperties;
};

const LocationInput: React.FC<LocationInputProps> = ({
	label,
	placeholder,
	controller,
	containerStyle,
}) => {
	const { t } = useTranslation();
	const { location, isVerified } = controller;
	const userEditedLocationRef = useRef(false);
	const [locationResults, setLocationResults] = useState<EventLocation[]>([]);
	const [showLocationDropdown, setShowLocationDropdown] = useState(false);
	const [isSearching, setIsSearching] = useState(false);

	function selectLocation(loc: EventLocation) {
		controller.setFromSelection(loc);
		setLocationResults([]);
		setShowLocationDropdown(false);
	}

	function clearLocation() {
		controller.clearLocation();
		setLocationResults([]);
		setShowLocationDropdown(false);
	}

	useEffect(() => {
		if (!userEditedLocationRef.current) return;
		userEditedLocationRef.current = false;
		if (location.trim().length < 3) {
			setLocationResults([]);
			setShowLocationDropdown(false);
			setIsSearching(false);
			return;
		}
		setIsSearching(true);
		const timer = setTimeout(async () => {
			try {
				const results = await scheduleService.searchLocations(location);
				setLocationResults(results);
				setShowLocationDropdown(results.length > 0);
			} catch {
				setLocationResults([]);
				setShowLocationDropdown(false);
			} finally {
				setIsSearching(false);
			}
		}, 300);
		return () => clearTimeout(timer);
	}, [location]);

	return (
		<LocationFieldGroup style={containerStyle}>
			<Input
				label={label}
				name="location"
				placeholder={placeholder}
				value={location}
				onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
					userEditedLocationRef.current = true;
					controller.setLocation(e.target.value);
				}}
				onFocus={() => {
					if (locationResults.length > 0) setShowLocationDropdown(true);
				}}
				onBlur={() => {
					setTimeout(() => setShowLocationDropdown(false), 150);
				}}
			/>
			{location && (
				<ClearButton type="button" onClick={clearLocation}>
					<X size={14} />
				</ClearButton>
			)}
			{isVerified && location && (
				<VerifiedBadge
					data-testid="location-verified-badge"
					title={t('location.verified.tooltip')}
				>
					<CheckCircle2 size={12} />
					{t('location.verified.label')}
				</VerifiedBadge>
			)}
			<LocationOverlay>
				{location.trim().length > 0 && location.trim().length < 3 && (
					<HintText>{t('calendarEvent.edit.locationMinChars')}</HintText>
				)}
				{isSearching && (
					<SearchingIndicator role="status">
						<Loader2 size={16} className="spin" />
					</SearchingIndicator>
				)}
				{!isSearching && showLocationDropdown && locationResults.length > 0 && (
					<Dropdown>
						{(() => {
							const saved = locationResults.filter(
								(l) => l.source !== LocationSource.Google
							);
							const google = locationResults.filter(
								(l) => l.source === LocationSource.Google
							);
							return (
								<>
									{saved.map((loc) => (
										<DropdownItem
											key={loc.id}
											onClick={() => selectLocation(loc)}
										>
											<ItemIcon>
												<Bookmark size={14} />
											</ItemIcon>
											<DropdownItemText>
												<DropdownItemAddress>
													{loc.address}
												</DropdownItemAddress>
												{loc.description && loc.description !== loc.id && (
													<DropdownItemDesc>
														{loc.description}
													</DropdownItemDesc>
												)}
											</DropdownItemText>
										</DropdownItem>
									))}
									{google.map((loc) => (
										<DropdownItem
											key={loc.id}
											onClick={() => selectLocation(loc)}
										>
											<ItemIcon>
												<MapPin size={14} />
											</ItemIcon>
											<DropdownItemText>
												<DropdownItemAddress>
													{loc.address}
												</DropdownItemAddress>
												{loc.description && (
													<DropdownItemDesc>
														{loc.description}
													</DropdownItemDesc>
												)}
											</DropdownItemText>
										</DropdownItem>
									))}
									{google.length > 0 && (
										<PoweredByGoogle>
											{t('calendarEvent.edit.poweredByGoogle')}
										</PoweredByGoogle>
									)}
								</>
							);
						})()}
					</Dropdown>
				)}
			</LocationOverlay>
		</LocationFieldGroup>
	);
};

const LocationFieldGroup = styled.div`
	position: relative;
	z-index: 10;
	flex: 1;
	min-width: 0;
`;

const LocationOverlay = styled.div`
	position: absolute;
	top: 100%;
	left: 0;
	right: 0;
	z-index: 10;
`;

const ClearButton = styled.button`
	position: absolute;
	right: 6px;
	top: 50%;
	transform: translateY(-50%);
	display: flex;
	align-items: center;
	justify-content: center;
	width: 20px;
	height: 20px;
	border: none;
	border-radius: 50%;
	background: ${({ theme }) => theme.colors.background.card2};
	color: ${({ theme }) => theme.colors.text.muted};
	cursor: pointer;
	padding: 0;

	&:hover {
		color: ${({ theme }) => theme.colors.text.primary};
		background: ${({ theme }) => theme.colors.border.default};
	}
`;

const HintText = styled.p`
	margin: 0.25rem 0 0;
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	color: ${({ theme }) => theme.colors.text.muted};
	padding: 0.25rem 0.5rem;
	background: ${({ theme }) => theme.colors.background.card};
	border-radius: ${({ theme }) => theme.borderRadius.medium};
`;

const SearchingIndicator = styled.div`
	display: flex;
	justify-content: center;
	padding: 0.5rem;
	color: ${({ theme }) => theme.colors.text.muted};
	background: ${({ theme }) => theme.colors.background.card};
	border-radius: ${({ theme }) => theme.borderRadius.medium};

	.spin {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
`;

const Dropdown = styled.div`
	max-height: 240px;
	overflow-y: auto;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	background: ${({ theme }) => theme.colors.background.card};
	margin-top: 4px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const DropdownItem = styled.button`
	display: flex;
	align-items: flex-start;
	width: 100%;
	padding: 0.5rem 0.75rem;
	border: none;
	background: transparent;
	text-align: left;
	cursor: pointer;
	gap: 0.5rem;

	&:hover {
		background: ${({ theme }) => theme.colors.background.card2};
	}

	&:not(:last-child) {
		border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
	}
`;

const ItemIcon = styled.span`
	display: flex;
	align-items: center;
	flex-shrink: 0;
	margin-top: 2px;
	color: ${({ theme }) => theme.colors.text.muted};
`;

const DropdownItemText = styled.span`
	display: flex;
	flex-direction: column;
	gap: 0.125rem;
	min-width: 0;
`;

const DropdownItemAddress = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.primary};
`;

const DropdownItemDesc = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	color: ${({ theme }) => theme.colors.text.muted};
`;

const PoweredByGoogle = styled.div`
	padding: 0.375rem 0.75rem;
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	color: ${({ theme }) => theme.colors.text.muted};
	text-align: right;
	font-style: italic;
	border-top: 1px solid ${({ theme }) => theme.colors.border.default};
`;

const VerifiedBadge = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	color: ${({ theme }) => theme.colors.success[600]};
	font-weight: 500;
	margin-top: 0.25rem;
	cursor: default;

	svg {
		flex-shrink: 0;
	}
`;

export default LocationInput;
