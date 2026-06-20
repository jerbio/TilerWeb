import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { ChevronLeft, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { featureFlagApi } from '@/api/featureFlagApi';
import type { AdminUserFlagRow, AdminUserSummary } from '@/core/common/types/featureFlag';
import useAuthNavigate from '@/hooks/useNavigateHome';

const FeatureFlagsAdmin: React.FC = () => {
	const navigate = useAuthNavigate();

	// User selection / search
	const [query, setQuery] = useState('');
	const [searchResults, setSearchResults] = useState<AdminUserSummary[]>([]);
	const [searching, setSearching] = useState(false);
	const [selectedUser, setSelectedUser] = useState<AdminUserSummary | null>(null);

	// Flags for selected user
	const [flags, setFlags] = useState<AdminUserFlagRow[]>([]);
	const [loadingFlags, setLoadingFlags] = useState(false);
	const [mutatingFlagId, setMutatingFlagId] = useState<string | null>(null);

	// Debounced search
	const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	useEffect(() => {
		if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
		if (!query.trim() || selectedUser) {
			setSearchResults([]);
			return;
		}
		setSearching(true);
		searchTimerRef.current = setTimeout(() => {
			featureFlagApi
				.adminSearchUsers(query.trim())
				.then((res) => {
					if (res?.Error?.Code === '0' && res.Content?.users) {
						setSearchResults(res.Content.users);
					} else {
						setSearchResults([]);
					}
				})
				.catch(() => toast.error('User search failed'))
				.finally(() => setSearching(false));
		}, 250);
		return () => {
			if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
		};
	}, [query, selectedUser]);

	// Load flags whenever a user is picked
	useEffect(() => {
		if (!selectedUser) {
			setFlags([]);
			return;
		}
		setLoadingFlags(true);
		featureFlagApi
			.adminGetFlagsForUser(selectedUser.id)
			.then((res) => {
				if (res?.Error?.Code === '0' && res.Content?.flagsForUser?.flags) {
					setFlags(res.Content.flagsForUser.flags);
				} else {
					setFlags([]);
					toast.error('Failed to load flags for user');
				}
			})
			.catch(() => toast.error('Failed to load flags for user'))
			.finally(() => setLoadingFlags(false));
	}, [selectedUser]);

	const handlePickUser = useCallback((user: AdminUserSummary) => {
		setSelectedUser(user);
		setQuery('');
		setSearchResults([]);
	}, []);

	const handleClearUser = useCallback(() => {
		setSelectedUser(null);
		setFlags([]);
	}, []);

	const applyLocal = useCallback(
		(flagId: string, mut: (row: AdminUserFlagRow) => AdminUserFlagRow) => {
			setFlags((prev) => prev.map((f) => (f.flagId === flagId ? mut(f) : f)));
		},
		[]
	);

	const handleToggleOverride = useCallback(
		async (row: AdminUserFlagRow) => {
			if (!selectedUser || mutatingFlagId) return;
			const next = !row.resolvedEnabled;
			const prev = { resolvedEnabled: row.resolvedEnabled, override: row.override };

			setMutatingFlagId(row.flagId);
			// Optimistic
			applyLocal(row.flagId, (f) => ({
				...f,
				resolvedEnabled: next,
				override: {
					isEnabled: next,
					createdBySource: 'PPS',
					createdUtc: new Date().toISOString(),
					updatedUtc: new Date().toISOString(),
					expiresAtUtc: null,
				},
			}));

			try {
				await featureFlagApi.adminSetOverride(row.flagId, selectedUser.id, next);
				toast.success(`"${row.name}" ${next ? 'on' : 'off'} for ${selectedUser.userName}`);
			} catch {
				applyLocal(row.flagId, (f) => ({ ...f, ...prev }));
				toast.error(`Failed to update "${row.name}"`);
			} finally {
				setMutatingFlagId(null);
			}
		},
		[selectedUser, mutatingFlagId, applyLocal]
	);

	const handleClearOverride = useCallback(
		async (row: AdminUserFlagRow) => {
			if (!selectedUser || mutatingFlagId || !row.override) return;
			const prev = { resolvedEnabled: row.resolvedEnabled, override: row.override };

			setMutatingFlagId(row.flagId);
			// Optimistic: revert to rollout default. We don't know the exact bucket result,
			// so fall back to isEnabledGlobal && (rolloutPercent === null || rolloutPercent > 0)
			// just to give the UI an instant value; the server response will refresh below.
			const optimistic = row.isEnabledGlobal && (row.rolloutPercent ?? 100) > 0;
			applyLocal(row.flagId, (f) => ({ ...f, override: null, resolvedEnabled: optimistic }));

			try {
				await featureFlagApi.adminClearOverride(row.flagId, selectedUser.id);
				// Re-fetch to get the authoritative resolved value.
				const res = await featureFlagApi.adminGetFlagsForUser(selectedUser.id);
				if (res?.Error?.Code === '0' && res.Content?.flagsForUser?.flags) {
					setFlags(res.Content.flagsForUser.flags);
				}
				toast.success(`Override cleared for "${row.name}"`);
			} catch {
				applyLocal(row.flagId, (f) => ({ ...f, ...prev }));
				toast.error(`Failed to clear override for "${row.name}"`);
			} finally {
				setMutatingFlagId(null);
			}
		},
		[selectedUser, mutatingFlagId, applyLocal]
	);

	const headerBody = useMemo(() => {
		if (!selectedUser) {
			return (
				<>
					<Title>Feature Flags</Title>
					<Subtitle>Search for a user to view and toggle their feature flags.</Subtitle>
				</>
			);
		}
		return (
			<>
				<Title>Feature Flags</Title>
				<SelectedUser>
					<SelectedUserText>
						<UserName>{selectedUser.userName}</UserName>
						{selectedUser.email && <UserEmail>{selectedUser.email}</UserEmail>}
					</SelectedUserText>
					<ClearButton onClick={handleClearUser} aria-label="Change user">
						<X size={14} /> Change user
					</ClearButton>
				</SelectedUser>
			</>
		);
	}, [selectedUser, handleClearUser]);

	return (
		<Container>
			<BackRow onClick={() => navigate('/admin')}>
				<ChevronLeft size={16} />
				Admin
			</BackRow>

			{headerBody}

			{!selectedUser && (
				<>
					<SearchBox>
						<Search size={16} />
						<SearchInput
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search by username or email"
							autoFocus
						/>
					</SearchBox>

					{searching && <EmptyState>Searching…</EmptyState>}

					{!searching && query.trim() && searchResults.length === 0 && (
						<EmptyState>No users match &ldquo;{query}&rdquo;.</EmptyState>
					)}

					{searchResults.length > 0 && (
						<UserList>
							{searchResults.map((u) => (
								<UserRow key={u.id} onClick={() => handlePickUser(u)}>
									<UserRowText>
										<UserName>{u.userName}</UserName>
										{u.email && <UserEmail>{u.email}</UserEmail>}
									</UserRowText>
								</UserRow>
							))}
						</UserList>
					)}
				</>
			)}

			{selectedUser && loadingFlags && <EmptyState>Loading flags…</EmptyState>}

			{selectedUser && !loadingFlags && flags.length === 0 && (
				<EmptyState>No flags registered.</EmptyState>
			)}

			{selectedUser && !loadingFlags && flags.length > 0 && (
				<FlagList>
					{flags.map((flag) => (
						<FlagRow key={flag.flagId}>
							<FlagInfo>
								<FlagName>{flag.name}</FlagName>
								<PillRow>
									{flag.rolloutPercent !== null && (
										<RolloutPill>{flag.rolloutPercent}% rollout</RolloutPill>
									)}
									{flag.override ? (
										<OverridePill $on={flag.override.isEnabled}>
											Override: {flag.override.isEnabled ? 'on' : 'off'}
											{flag.override.createdBySource === 'TilerFront_Self' &&
												' (self)'}
										</OverridePill>
									) : (
										<DefaultPill>Default</DefaultPill>
									)}
								</PillRow>
							</FlagInfo>
							<FlagActions>
								{flag.override && (
									<ClearOverrideBtn
										onClick={() => handleClearOverride(flag)}
										disabled={mutatingFlagId !== null}
										title="Revert to rollout default"
									>
										Clear
									</ClearOverrideBtn>
								)}
								<Toggle
									$enabled={flag.resolvedEnabled}
									$saving={mutatingFlagId === flag.flagId}
									onClick={() =>
										mutatingFlagId === null && handleToggleOverride(flag)
									}
									aria-label={`Toggle ${flag.name}`}
									role="switch"
									aria-checked={flag.resolvedEnabled}
								>
									<ToggleThumb $enabled={flag.resolvedEnabled} />
								</Toggle>
							</FlagActions>
						</FlagRow>
					))}
				</FlagList>
			)}
		</Container>
	);
};

const Container = styled.div`
	max-width: 720px;
	margin: 0 auto;
	padding: 2rem;
`;

const BackRow = styled.button`
	display: flex;
	align-items: center;
	gap: 0.25rem;
	background: none;
	border: none;
	color: ${({ theme }) => theme.colors.text.secondary};
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	cursor: pointer;
	padding: 0;
	margin-bottom: 2rem;
	transition: color 0.2s ease;
	&:hover {
		color: ${({ theme }) => theme.colors.text.primary};
	}
`;

const Title = styled.h1`
	font-size: ${({ theme }) => theme.typography.fontSize.displaySm};
	color: ${({ theme }) => theme.colors.text.primary};
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
	margin: 0 0 0.5rem 0;
`;

const Subtitle = styled.p`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.secondary};
	margin: 0 0 2rem 0;
`;

const SelectedUser = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: ${({ theme }) => theme.colors.background.card};
	border: 1px solid ${({ theme }) => theme.colors.border.subtle};
	border-radius: 8px;
	padding: 0.75rem 1rem;
	margin: 0.5rem 0 2rem 0;
`;

const SelectedUserText = styled.div`
	display: flex;
	flex-direction: column;
`;

const ClearButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.25rem;
	background: none;
	border: 1px solid ${({ theme }) => theme.colors.border.subtle};
	border-radius: 6px;
	padding: 0.25rem 0.75rem;
	color: ${({ theme }) => theme.colors.text.secondary};
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	cursor: pointer;
	&:hover {
		color: ${({ theme }) => theme.colors.text.primary};
	}
`;

const SearchBox = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	background: ${({ theme }) => theme.colors.background.card};
	border: 1px solid ${({ theme }) => theme.colors.border.subtle};
	border-radius: 8px;
	padding: 0.75rem 1rem;
	margin-bottom: 1rem;
	color: ${({ theme }) => theme.colors.text.secondary};
`;

const SearchInput = styled.input`
	flex: 1;
	background: none;
	border: none;
	outline: none;
	color: ${({ theme }) => theme.colors.text.primary};
	font-size: ${({ theme }) => theme.typography.fontSize.base};
`;

const UserList = styled.div`
	display: flex;
	flex-direction: column;
	border: 1px solid ${({ theme }) => theme.colors.border.subtle};
	border-radius: 8px;
	overflow: hidden;
`;

const UserRow = styled.button`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0.75rem 1rem;
	background: none;
	border: none;
	border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
	cursor: pointer;
	text-align: left;
	&:last-child {
		border-bottom: none;
	}
	&:hover {
		background: ${({ theme }) => theme.colors.background.card};
	}
`;

const UserRowText = styled.div`
	display: flex;
	flex-direction: column;
`;

const UserName = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.base};
	color: ${({ theme }) => theme.colors.text.primary};
	font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const UserEmail = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	color: ${({ theme }) => theme.colors.text.secondary};
`;

const FlagList = styled.div`
	display: flex;
	flex-direction: column;
`;

const FlagRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 1.25rem 0;
	border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
	gap: 1rem;
	&:last-child {
		border-bottom: none;
	}
`;

const FlagInfo = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.4rem;
	min-width: 0;
`;

const FlagName = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.base};
	color: ${({ theme }) => theme.colors.text.primary};
	font-family: monospace;
`;

const PillRow = styled.div`
	display: flex;
	gap: 0.4rem;
	flex-wrap: wrap;
`;

const Pill = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	border-radius: 999px;
	padding: 1px 8px;
	border: 1px solid;
`;

const RolloutPill = styled(Pill)`
	color: ${({ theme }) => theme.colors.brand[400]};
	border-color: ${({ theme }) => theme.colors.brand[400]};
`;

const DefaultPill = styled(Pill)`
	color: ${({ theme }) => theme.colors.text.secondary};
	border-color: ${({ theme }) => theme.colors.border.subtle};
`;

const OverridePill = styled(Pill)<{ $on: boolean }>`
	color: ${({ $on, theme }) => ($on ? theme.colors.brand[400] : theme.colors.gray[400])};
	border-color: ${({ $on, theme }) => ($on ? theme.colors.brand[400] : theme.colors.gray[400])};
`;

const FlagActions = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	flex-shrink: 0;
`;

const ClearOverrideBtn = styled.button`
	background: none;
	border: 1px solid ${({ theme }) => theme.colors.border.subtle};
	border-radius: 6px;
	padding: 0.25rem 0.6rem;
	color: ${({ theme }) => theme.colors.text.secondary};
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	cursor: pointer;
	&:hover:not(:disabled) {
		color: ${({ theme }) => theme.colors.text.primary};
	}
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const Toggle = styled.button<{ $enabled: boolean; $saving: boolean }>`
	position: relative;
	width: 44px;
	height: 24px;
	border-radius: 999px;
	border: none;
	cursor: ${({ $saving }) => ($saving ? 'wait' : 'pointer')};
	background-color: ${({ $enabled, theme }) =>
		$enabled ? theme.colors.brand[400] : theme.colors.gray[600]};
	transition: background-color 0.2s ease;
	opacity: ${({ $saving }) => ($saving ? 0.6 : 1)};
	flex-shrink: 0;
`;

const ToggleThumb = styled.span<{ $enabled: boolean }>`
	position: absolute;
	top: 3px;
	left: ${({ $enabled }) => ($enabled ? '23px' : '3px')};
	width: 18px;
	height: 18px;
	border-radius: 50%;
	background-color: white;
	transition: left 0.2s ease;
`;

const EmptyState = styled.p`
	color: ${({ theme }) => theme.colors.text.secondary};
	font-size: ${({ theme }) => theme.typography.fontSize.base};
`;

export default FeatureFlagsAdmin;
