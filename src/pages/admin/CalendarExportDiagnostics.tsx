import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import {
	CalendarExportDiagnosticsApi,
	type CalendarExportDiagnostic,
} from '@/api/calendarExportDiagnosticsApi';

const Container = styled.section`
	color: ${({ theme }) => theme.colors.text.primary};
	padding: 2rem 0;
	form {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 12px;
		margin: 20px 0;
	}
	input {
		min-width: 320px;
		padding: 8px;
	}
	button {
		padding: 8px 12px;
		cursor: pointer;
	}
	table {
		width: 100%;
		border-collapse: collapse;
	}
	th,
	td {
		padding: 12px;
		text-align: left;
		vertical-align: top;
		border-bottom: 1px solid currentColor;
	}
`;

/** Engineering inspection and explicit worker retries under AdminRoute. Publication details never appear in user settings. */
export default function CalendarExportDiagnostics() {
	const [userId, setUserId] = useState('');
	const [records, setRecords] = useState<CalendarExportDiagnostic[] | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(false);
	const [inspectedUserId, setInspectedUserId] = useState<string | null>(null);
	const [retrying, setRetrying] = useState(false);
	const [retryNotice, setRetryNotice] = useState<string | null>(null);
	const [retryError, setRetryError] = useState(false);
	const retryPending = useRef(false);
	const sequence = useRef(0);
	const api = useRef(new CalendarExportDiagnosticsApi());
	useEffect(
		() => () => {
			sequence.current++;
		},
		[]
	);

	async function inspect() {
		const target = userId.trim();
		if (!target) return;
		const request = ++sequence.current;
		setLoading(true);
		setError(false);
		setRecords(null);
		setInspectedUserId(null);
		setRetryNotice(null);
		setRetryError(false);
		try {
			const result = await api.current.list(target);
			if (request === sequence.current) {
				setRecords(result);
				setInspectedUserId(target);
			}
		} catch {
			if (request === sequence.current) setError(true);
		} finally {
			if (request === sequence.current) setLoading(false);
		}
	}

	async function retry() {
		const target = inspectedUserId;
		if (!target || target !== userId.trim() || retryPending.current) return;
		retryPending.current = true;
		const request = ++sequence.current;
		setRetrying(true);
		setRetryNotice(null);
		setRetryError(false);
		setError(false);
		try {
			const result = await api.current.retry(target);
			if (request !== sequence.current) return;
			setRetryNotice(
				`Sync retry queued. Enabled exports made due: ${result.scheduledExports}. Exports already running: ${result.activeExports}.${result.nativeAlreadyProcessing ? ' The current sync will finish before the new generation runs.' : ''}`
			);
			// A failed status refresh must not turn an acknowledged queue action into an apparent retry failure.
			try {
				const refreshed = await api.current.list(target);
				if (request === sequence.current) setRecords(refreshed);
			} catch {
				if (request === sequence.current) setError(true);
			}
		} catch {
			if (request === sequence.current) setRetryError(true);
		} finally {
			retryPending.current = false;
			if (request === sequence.current) setRetrying(false);
		}
	}
	const date = (value: string | null) => (value ? new Date(value).toLocaleString() : '—');

	return (
		<Container>
			<h1>Calendar publishing diagnostics</h1>
			<p>Engineering inspection of Google publishing, retries and confirmed coverage.</p>
			<form
				onSubmit={(event) => {
					event.preventDefault();
					void inspect();
				}}
			>
				<label htmlFor="export-user">Tiler user ID</label>
				<input
					id="export-user"
					value={userId}
					maxLength={128}
					disabled={retrying}
					onChange={(event) => {
						sequence.current++;
						setUserId(event.target.value);
						setRecords(null);
						setError(false);
						setLoading(false);
						setInspectedUserId(null);
						setRetryNotice(null);
						setRetryError(false);
					}}
				/>
				<button type="submit" disabled={loading || retrying || !userId.trim()}>
					{loading ? 'Loading…' : 'Inspect / refresh'}
				</button>
			</form>
			{inspectedUserId && (
				<p>
					<button
						type="button"
						disabled={loading || retrying}
						onClick={() => void retry()}
					>
						{retrying ? 'Queuing retry…' : 'Retry sync and export'}
					</button>{' '}
					Queues a fresh Google read and schedule evaluation, then retries enabled
					exports.
				</p>
			)}
			{retryNotice && <p role="status">{retryNotice}</p>}
			{retryError && (
				<p role="alert">
					Could not confirm the retry request. Inspect the latest state before trying
					again.
				</p>
			)}
			{error && (
				<p role="alert">
					Diagnostics could not be loaded. Check admin access and try again.
				</p>
			)}
			{records?.length === 0 && <p>No export configurations for this user.</p>}
			{records && records.length > 0 && (
				<div style={{ overflowX: 'auto' }}>
					<table>
						<caption>Publishing state for {userId.trim()}</caption>
						<thead>
							<tr>
								<th>Account / configuration</th>
								<th>Settings</th>
								<th>Worker</th>
								<th>Confirmed coverage</th>
								<th>Recovery</th>
							</tr>
						</thead>
						<tbody>
							{records.map((record) => (
								<tr key={record.id}>
									<td>
										{record.authenticationId}
										<br />
										{record.id}
									</td>
									<td>
										{record.enabled ? 'Enabled' : 'Disabled'}
										<br />
										{record.horizonDays} days
									</td>
									<td>
										{record.state}
										<br />
										Generation {record.generation}
									</td>
									<td>
										{date(record.coverageStart)} — {date(record.coverageEnd)}
										<br />
										Last success: {date(record.lastSuccessAt)}
									</td>
									<td>
										Next attempt: {date(record.nextAttemptAt)}
										<br />
										Attempts: {record.attempts}; conflicts:{' '}
										{record.conflictCount}
										<br />
										{record.errorCode ?? 'No error'}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</Container>
	);
}
