import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { GoogleCalendarExportApi } from '@/api/googleCalendarExportApi';

const Section = styled.section`
	margin: 24px 0;
	padding: 20px 0;
	border-top: 1px solid currentColor;
	h2 {
		font-size: 18px;
		margin: 0 0 12px;
	}
	p {
		font-size: 14px;
		line-height: 1.5;
	}
	label {
		display: flex;
		align-items: center;
		gap: 10px;
		margin: 12px 0;
	}
	input[type='number'] {
		width: 80px;
		padding: 6px;
	}
	button {
		padding: 8px 16px;
		cursor: pointer;
	}
`;

/** User publishing preferences only; worker outcomes are inspected separately by engineering. */
export function GoogleCalendarExportSettings({ authenticationId }: { authenticationId: string }) {
	const { t } = useTranslation();
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
			<label>
				<input
					type="checkbox"
					checked={enabled}
					disabled={saving || available === null}
					onChange={(event) => {
						dirty.current = true;
						setEnabled(event.target.checked);
					}}
				/>
				{t('settings.googleExport.enable', 'Publish my Tiler schedule')}
			</label>
			<label>
				{t('settings.googleExport.days', 'Days ahead')}
				<input
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
			</label>
			<button
				type="button"
				disabled={
					saving || available === null || !Number.isInteger(days) || days < 1 || days > 30
				}
				onClick={() => void save()}
			>
				{saving
					? t('settings.googleExport.saving', 'Saving…')
					: t('settings.googleExport.save', 'Save publishing settings')}
			</button>
			{error && (
				<p role="alert">
					{t(
						'settings.googleExport.error',
						'Publishing settings could not be loaded or saved. Please try again.'
					)}
					<button type="button" onClick={() => void refresh()}>
						{t('settings.googleExport.retry', 'Try again')}
					</button>
				</p>
			)}
		</Section>
	);
}
