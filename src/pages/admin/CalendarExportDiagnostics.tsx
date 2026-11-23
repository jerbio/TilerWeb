import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import {
	CalendarExportDiagnosticsApi,
	type CalendarExportDiagnostic,
	type CalendarExportAudit,
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
	const [toolBusy, setToolBusy] = useState<'audit' | 'repair' | 'destination' | null>(null);
	const [auditReports, setAuditReports] = useState<CalendarExportAudit[] | null>(null);
	const [toolError, setToolError] = useState<string | null>(null);
	const busy = retrying || toolBusy !== null;
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
		setAuditReports(null);
		setToolError(null);
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
		setAuditReports(null);
		setToolError(null);
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
	async function exportTool(action: 'audit' | 'repair') {
		const target = inspectedUserId;
		if (!target || target !== userId.trim() || retryPending.current) return;
		retryPending.current = true;
		const request = ++sequence.current;
		setToolBusy(action);
		setToolError(null);
		setAuditReports(null);
		setRetryNotice(null);
		setRetryError(false);
		try {
			if (action === 'audit') {
				const reports = await api.current.audit(target);
				if (request === sequence.current) setAuditReports(reports);
			} else {
				const result = await api.current.repair(target);
				if (request !== sequence.current) return;
				setRetryNotice(
					`Export repair queued. Enabled exports made due: ${result.scheduledExports}. Exports already running: ${result.activeExports}.`
				);
				try {
					const refreshed = await api.current.list(target);
					if (request === sequence.current) setRecords(refreshed);
				} catch {
					if (request === sequence.current) setError(true);
				}
			}
		} catch {
			if (request === sequence.current)
				setToolError(
					action === 'audit'
						? 'Audit could not complete. No repair was performed.'
						: 'Could not confirm the repair request. Inspect the latest state before trying again.'
				);
		} finally {
			retryPending.current = false;
			if (request === sequence.current) setToolBusy(null);
		}
	}
	const date = (value: string | null) => (value ? new Date(value).toLocaleString() : '—');
	async function destinationAction(authenticationId: string, calendarId?: string) {
		const target = inspectedUserId;
		if (!target || target !== userId.trim() || retryPending.current) return;
		retryPending.current = true;
		const request = ++sequence.current;
		setToolBusy('destination');
		setToolError(null);
		setRetryNotice(null);
		try {
			if (calendarId)
				await api.current.reuseDestination(target, authenticationId, calendarId);
			else await api.current.cleanupDestinations(target, authenticationId);
			if (request === sequence.current) {
				setRetryNotice(
					calendarId
						? 'Destination association queued. A working destination will be kept; event deletion still requires verified receipts.'
						: 'Extra-calendar cleanup queued. Unverified events and history will be preserved.'
				);
				setAuditReports(null);
			}
		} catch {
			if (request === sequence.current)
				setToolError(
					'Could not confirm the destination request. Cleanup may be disabled. Inspect the latest state before retrying.'
				);
		} finally {
			retryPending.current = false;
			if (request === sequence.current) setToolBusy(null);
		}
	}

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
					disabled={busy}
					onChange={(event) => {
						sequence.current++;
						setUserId(event.target.value);
						setAuditReports(null);
						setToolError(null);
						setRecords(null);
						setError(false);
						setLoading(false);
						setInspectedUserId(null);
						setRetryNotice(null);
						setRetryError(false);
					}}
				/>
				<button type="submit" disabled={loading || busy || !userId.trim()}>
					{loading ? 'Loading…' : 'Inspect / refresh'}
				</button>
			</form>
			{inspectedUserId && (
				<p>
					<button type="button" disabled={loading || busy} onClick={() => void retry()}>
						{retrying ? 'Queuing retry…' : 'Retry sync and export'}
					</button>{' '}
					Queues a fresh Google read and schedule evaluation, then retries enabled
					exports.
				</p>
			)}
			{inspectedUserId && (
				<p>
					<button
						type="button"
						disabled={loading || busy}
						onClick={() => void exportTool('audit')}
					>
						{toolBusy === 'audit' ? 'Auditing...' : 'Audit'}
					</button>{' '}
					<button
						type="button"
						disabled={loading || busy}
						onClick={() => void exportTool('repair')}
					>
						{toolBusy === 'repair' ? 'Queuing repair...' : 'Repair now'}
					</button>{' '}
					Audit compares Tiler with Google without changing events. Repair queues bounded
					reconciliation.
				</p>
			)}
			{toolError && <p role="alert">{toolError}</p>}
			{auditReports && (
				<section aria-label="Export audit results">
					<h2>Audit results</h2>
					{auditReports.length === 0 && <p>No enabled export configurations to audit.</p>}
					{auditReports.map((report) => (
						<div key={report.configurationId} style={{ overflowX: 'auto' }}>
							{report.nativeAuditComplete === false && (
								<p>
									Destination discovery only. Native event reconciliation is
									incomplete until a destination is bound.
								</p>
							)}
							{(report.destinations?.length ?? 0) > 0 && (
								<section aria-label="Calendar destinations">
									<h3>Calendar destinations</h3>
									<p>
										Reuse keeps the working destination and associates reviewed
										extras. Markers alone never authorize event deletion.
									</p>
									<table>
										<thead>
											<tr>
												<th>Calendar</th>
												<th>Classification / evidence</th>
												<th>Contents</th>
												<th>Action</th>
											</tr>
										</thead>
										<tbody>
											{report.destinations?.map((destination) => (
												<tr key={destination.calendarId}>
													<td>{destination.calendarId}</td>
													<td>
														{destination.classification}
														<br />
														{destination.ownershipEvidence}
													</td>
													<td>
														{destination.eventCount ?? 'Unknown'}{' '}
														events; {destination.verifiedCopies}{' '}
														verified copies;{' '}
														{destination.unresolvedEvents} unresolved
													</td>
													<td>
														{destination.classification !== 'Current' &&
															destination.classification !==
																'Conflicting' &&
															destination.configurationId && (
																<button
																	type="button"
																	disabled={loading || busy}
																	onClick={() =>
																		void destinationAction(
																			destination.authenticationId,
																			destination.calendarId
																		)
																	}
																>
																	Reuse destination
																</button>
															)}
													</td>
												</tr>
											))}
										</tbody>
									</table>
									<button
										type="button"
										disabled={loading || busy}
										onClick={() =>
											void destinationAction(
												report.destinations![0].authenticationId
											)
										}
									>
										Clean up extras
									</button>
								</section>
							)}
							<p>
								Configuration: {report.configurationId}. Repair window:{' '}
								{date(report.repairStart)} to {date(report.repairEnd)}.
							</p>
							<p>
								{Object.entries(report.counts)
									.map(([reason, count]) => `${reason}: ${count}`)
									.join('; ') || 'No discrepancies found.'}
							</p>
							{report.discrepancies.length > 0 && (
								<table>
									<caption>
										Export discrepancies for {report.configurationId}
									</caption>
									<thead>
										<tr>
											<th>Native event</th>
											<th>Google event</th>
											<th>Reason</th>
											<th>Automatic repair</th>
										</tr>
									</thead>
									<tbody>
										{report.discrepancies.map((entry, index) => (
											<tr
												key={`${entry.providerEventId ?? entry.nativeEventId}-${index}`}
											>
												<td>{entry.nativeEventId ?? 'Unknown'}</td>
												<td>{entry.providerEventId ?? 'Missing'}</td>
												<td>{entry.reason}</td>
												<td>
													{entry.repairEligible
														? 'Eligible'
														: 'Review required / outside scope'}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							)}
						</div>
					))}
				</section>
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
										{record.destinationLifecycle && (
											<>
												<br />
												Destination: {record.destinationLifecycle}
											</>
										)}
										{record.destinationLifecycle === 'Creating' && (
											<p>
												Creation outcome requires review. Inspect Google
												before authorizing another creation; retries will
												only discover existing calendars.
											</p>
										)}
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
