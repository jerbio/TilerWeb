import useFormHandler from '@/hooks/useFormHandler';
import React, { useState, useEffect, useRef } from 'react';
import { InitialCreateTileFormState } from '.';
import styled from 'styled-components';
import Input from '../../input';
import DatePicker from '../../date_picker';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { Bookmark, MapPin, X, Loader2, CheckCircle2 } from 'lucide-react';
import { scheduleService } from '@/services';
import { EventLocation } from '@/core/common/types/schedule';

type InfoProps = {
  formHandler: ReturnType<typeof useFormHandler<InitialCreateTileFormState>>;
};

const CreateTileInfo: React.FC<InfoProps> = ({
  formHandler: { formData, handleFormInputChange, setFormData },
}) => {
	const { t } = useTranslation();
	const [locationResults, setLocationResults] = useState<EventLocation[]>([]);
	const [showLocationDropdown, setShowLocationDropdown] = useState(false);
	const [isSearching, setIsSearching] = useState(false);
	const userEditedLocationRef = useRef(false);

	useEffect(() => {
		if (!userEditedLocationRef.current) return;
		userEditedLocationRef.current = false;
		if (formData.location.trim().length < 3) {
			setLocationResults([]);
			setShowLocationDropdown(false);
			setIsSearching(false);
			return;
		}
		setIsSearching(true);
		const timer = setTimeout(async () => {
			try {
				const results = await scheduleService.searchLocations(formData.location);
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
	}, [formData.location]);

	const handleSelectLocation = (loc: EventLocation) => {
		setFormData((prev) => ({
			...prev,
			location: loc.address,
			locationId: loc.source !== 'google' ? loc.id : null,
			locationSource: loc.source,
			locationIsVerified: loc.isVerified,
			locationTag: loc.nickname || '',
		}));
		setShowLocationDropdown(false);
		setLocationResults([]);
	};

	const handleClearLocation = () => {
		setFormData((prev) => ({
			...prev,
			location: '',
			locationId: null,
			locationSource: '',
			locationIsVerified: false,
			locationTag: '',
		}));
		setLocationResults([]);
		setShowLocationDropdown(false);
	};

  return (
    <Grid>
      <Input
        label={t('calendar.createTile.info.action.label')}
        required
        name="action"
        placeholder={t('calendar.createTile.info.action.placeholder')}
        value={formData.action}
        onChange={handleFormInputChange('action')}
      />
      <InlineRow>
        <LocationFieldGroup>
          <Input
            label={t('calendar.createTile.info.location.label')}
            name="location"
            placeholder={t('calendar.createTile.info.location.placeholder')}
            value={formData.location}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              userEditedLocationRef.current = true;
              setFormData((prev) => ({
                ...prev,
                location: e.target.value,
                locationId: null,
                locationSource: '',
                locationIsVerified: false,
                locationTag: '',
              }));
            }}
            onFocus={() => {
              if (locationResults.length > 0) setShowLocationDropdown(true);
            }}
            onBlur={() => {
              setTimeout(() => setShowLocationDropdown(false), 150);
            }}
          />
          {formData.location && (
            <ClearButton type="button" onClick={handleClearLocation}>
              <X size={14} />
            </ClearButton>
          )}
          {formData.locationIsVerified && formData.location && (
            <VerifiedBadge
              data-testid="location-verified-badge"
              title={t('location.verified.tooltip')}
            >
              <CheckCircle2 size={12} />
              {t('location.verified.label')}
            </VerifiedBadge>
          )}
          <LocationOverlay>
            {formData.location.trim().length > 0 && formData.location.trim().length < 3 && (
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
                  const saved = locationResults.filter((l) => l.source !== 'google');
                  const google = locationResults.filter((l) => l.source === 'google');
                  return (
                    <>
                      {saved.map((loc) => (
                        <DropdownItem key={loc.id} onClick={() => handleSelectLocation(loc)}>
                          <ItemIcon><Bookmark size={14} /></ItemIcon>
                          <DropdownItemText>
                            <DropdownItemAddress>{loc.address}</DropdownItemAddress>
                            {loc.description && loc.description !== loc.id && (
                              <DropdownItemDesc>{loc.description}</DropdownItemDesc>
                            )}
                          </DropdownItemText>
                        </DropdownItem>
                      ))}
                      {google.map((loc) => (
                        <DropdownItem key={loc.id} onClick={() => handleSelectLocation(loc)}>
                          <ItemIcon><MapPin size={14} /></ItemIcon>
                          <DropdownItemText>
                            <DropdownItemAddress>{loc.address}</DropdownItemAddress>
                            {loc.description && (
                              <DropdownItemDesc>{loc.description}</DropdownItemDesc>
                            )}
                          </DropdownItemText>
                        </DropdownItem>
                      ))}
                      {google.length > 0 && (
                        <PoweredByGoogle>{t('calendarEvent.edit.poweredByGoogle')}</PoweredByGoogle>
                      )}
                    </>
                  );
                })()}
              </Dropdown>
            )}
          </LocationOverlay>
        </LocationFieldGroup>
        <Input
          label={t('calendar.createTile.info.locationTag.label')}
          name="locationTag"
          placeholder={t('calendar.createTile.info.locationTag.placeholder')}
          value={formData.locationTag}
          onChange={handleFormInputChange('locationTag')}
        />
      </InlineRow>
      <InlineRow>
        <Input
          label={t('calendar.createTile.info.hours.label')}
          required
          type="number"
          name="durationHours"
          placeholder={t('calendar.createTile.info.hours.placeholder')}
          value={formData.durationHours}
          onChange={handleFormInputChange('durationHours', {
            restriction: 'integer',
          })}
        />
        <Input
          label={t('calendar.createTile.info.minutes.label')}
          required
          type="number"
          name="durationMins"
          step="5"
          placeholder={t('calendar.createTile.info.minutes.placeholder')}
          value={formData.durationMins}
          onChange={handleFormInputChange('durationMins', {
            restriction: 'integer',
          })}
        />
      </InlineRow>
      {!formData.isRecurring && (
        <RangeContainer>
          <h3>{t('calendar.createTile.info.range.label')}</h3>
          <RangeDescription>
            <p>{t('calendar.createTile.info.range.description')}</p>
            <DatePicker
              value={dayjs(formData.start).format('YYYY-MM-DD')}
              maxDate={dayjs(formData.deadline).format('YYYY-MM-DD')}
              onChange={(date) =>
                handleFormInputChange('start', {
                  mode: 'static',
                })(dayjs(date))
              }
            />
            <p>{t('calendar.createTile.info.range.conjunction')}</p>
            <DatePicker
              value={dayjs(formData.deadline).format('YYYY-MM-DD')}
              minDate={dayjs(formData.start).format('YYYY-MM-DD')}
              onChange={(date) =>
                handleFormInputChange('deadline', {
                  mode: 'static',
                })(dayjs(date))
              }
            />
          </RangeDescription>
        </RangeContainer>
      )}
    </Grid>
  );
};

const Grid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 1rem;
	margin-block: 2rem;

	label,
	h3 {
		font-family: ${({ theme }) => theme.typography.fontFamily.urban};
		font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
		font-size: ${({ theme }) => theme.typography.fontSize.base};
		color: ${({ theme }) => theme.colors.text.primary};
	}

	@media (min-width: ${({ theme }) => theme.screens.md}) {
		grid-template-columns: repeat(2, 1fr);
	}
`;

const RangeContainer = styled.div`
	display: flex;
	flex-direction: column;
	grid-column: span 2;

	h3 {
		display: flex;
		gap: 0.25rem;
		margin-bottom: 3px;
	}
`;

const RangeDescription = styled.div`
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	align-items: center;
	gap: 1ch;
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.secondary};

	& > div {
		input {
			padding-inline: 1rem !important;
		}

		@media (min-width: ${({ theme }) => theme.screens.sm}) {
			flex: 1;
		}
	}
`;

const InlineRow = styled.div`
	display: flex;
	gap: 1rem;
	grid-column: span 2;

	> * {
		flex: 1;
		min-width: 0;
	}
`;

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

export default CreateTileInfo;

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
