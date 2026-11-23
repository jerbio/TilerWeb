import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { GoogleCalendarExportApi } from '@/api/googleCalendarExportApi';
import Toggle from '@/core/common/components/Toggle';

const Section = styled.section`
	margin-bottom: 1.5rem;
	padding: 1rem;
	border: 1px solid ${({ theme }) => theme.colors.gray[700]};
	border-radius: 0.75rem;
	color: ${({ theme }) => theme.colors.text.primary};

	h2 {
		font-size: ${({ theme }) => theme.typography.fontSize.base};
		font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
		margin: 0 0 0.75rem;
	}

	> p {
		margin: 0 0 1rem;
		font-size: ${({ theme }) => theme.typography.fontSize.sm};
		line-height: 1.5;
		color: ${({ theme }) => theme.colors.text.secondary};
	}

	> div > button {
		flex-shrink: 0;
	}
`;

const HorizonRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 0.75rem 1rem;
	padding: 0.75rem 0 1.25rem;

	label {
		font-size: ${({ theme }) => theme.typography.fontSize.base};
	}

	input {
		box-sizing: border-box;
		width: 88px;
		min-height: 40px;
		padding: 0.5rem 0.75rem;
		border: 1px solid ${({ theme }) => theme.colors.gray[700]};
		border-radius: 0.5rem;
		background: ${({ theme }) => theme.colors.background.card2};
		color: ${({ theme }) => theme.colors.text.primary};
		font: inherit;
		color-scheme: inherit;

		&:focus-visible {
			outline: 2px solid ${({ theme }) => theme.colors.text.primary};
			outline-offset: 2px;
		}

		&:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}
	}
`;

const ActionButton = styled.button`
	min-height: 36px;
	padding: 0.375rem 0.75rem;
	border: 1px solid ${({ theme }) => theme.colors.gray[500]};
	border-radius: 0.5rem;
	background: transparent;
	color: ${({ theme }) => theme.colors.text.primary};
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
	cursor: pointer;
	transition:
		background-color 0.2s ease,
		border-color 0.2s ease;

	&:hover:not(:disabled) {
		background: ${({ theme }) => theme.colors.background.card2};
		border-color: ${({ theme }) => theme.colors.gray[300]};
	}

	&:focus-visible {
		outline: 2px solid ${({ theme }) => theme.colors.text.primary};
		outline-offset: 2px;
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

const ErrorNotice = styled.div`
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 0.75rem;
	margin-top: 1rem;
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.error};
`;

/** User publishing preferences only; worker outcomes are inspected separately by engineering. */
export function GoogleCalendarExportSettings({ authenticationId }: { authenticationId: string }) {
	const { t } = useTranslation();
	const daysInputId = useId();
	const [available, setAvailable] = useState<boolean | null>(null);
	const [enabled, setEnabled] = useState(false);
	const [days, setDays] = useState(7);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState(false);
	const active = useRef(true);
	const dirty = useRef(false);
	const pending = useRef(false);
	const sequence = useRef(0);
	const api = useRef(new GoogleCalendarExportApi());

	async function refresh() {
		if (pending.current) return;
		const request = ++sequence.current;
		try {
			const records = await api.current.list();
			if (!active.current || request !== sequence.current) return;
			setAvailable(records !== null);
			const record =
				records?.find((item) => item.authenticationId === authenticationId) ?? null;
			if (!dirty.current) {
				setEnabled(record?.enabled ?? false);
				setDays(record?.horizonDays ?? 7);
			}
			setError(false);
		} catch {
			if (active.current && request === sequence.current) setError(true);
		}
	}

	useEffect(() => {
		active.current = true;
		void refresh();
		return () => {
			active.current = false;
		};
		// The account ID keys this component in the connection page; navigation creates a fresh instance.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [authenticationId]);

	async function save() {
		pending.current = true;
		setSaving(true);
		setError(false);
		const request = ++sequence.current;
		try {
			const record = await api.current.configure(authenticationId, enabled, days);
			if (!active.current || request !== sequence.current) return;
			setEnabled(record.enabled);
			setDays(record.horizonDays);
			dirty.current = false;
		} catch {
			if (active.current && request === sequence.current) setError(true);
		} finally {
			if (active.current && request === sequence.current) {
				pending.current = false;
				setSaving(false);
			}
		}
	}

	if (available === false || (available === null && !error)) return null;
	return (
		<Section aria-label={t('settings.googleExport.title', 'Publish to Google Calendar')}>
			<h2>{t('settings.googleExport.title', 'Publish to Google Calendar')}</h2>
			<p>
				{t(
					'settings.googleExport.description',
					'Publish scheduled tiles to a dedicated Tiler calendar in this account. The window extends automatically. Changes and deletions you make to exported events in Google also update Tiler.'
				)}
			</p>
			<Toggle
				label={t('settings.googleExport.enable', 'Publish my Tiler schedule')}
				ariaLabel={t('settings.googleExport.enable', 'Publish my Tiler schedule')}
				isOn={enabled}
				disabled={saving || available === null}
				containerStyle={{ padding: '0.75rem 0', borderBottom: 'none', gap: '1rem' }}
				onChange={(value) => {
					dirty.current = true;
					setEnabled(value);
				}}
			/>
			<HorizonRow>
				<label htmlFor={daysInputId}>
					{t('settings.googleExport.days', 'Days before and after now')}
				</label>
				<input
					id={daysInputId}
					type="number"
					min={1}
					max={30}
					value={days}
					disabled={saving || available === null}
					onChange={(event) => {
						dirty.current = true;
						setDays(Number(event.target.value));
					}}
				/>
			</HorizonRow>
			<ActionButton
				type="button"
				disabled={
					saving || available === null || !Number.isInteger(days) || days < 1 || days > 30
				}
				onClick={() => void save()}
			>
				{saving
					? t('settings.googleExport.saving', 'Saving…')
					: t('settings.googleExport.save', 'Save publishing settings')}
			</ActionButton>
			{error && (
				<ErrorNotice role="alert">
					{t(
						'settings.googleExport.error',
						'Publishing settings could not be loaded or saved. Please try again.'
					)}
					<ActionButton type="button" onClick={() => void refresh()}>
						{t('settings.googleExport.retry', 'Try again')}
					</ActionButton>
				</ErrorNotice>
			)}
		</Section>
	);
}
