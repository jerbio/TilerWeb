import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { featureFlagApi, AdminFlagEntry } from '@/api/featureFlagApi';
import useAuthNavigate from '@/hooks/useNavigateHome';
import { Env } from '@/config/config_getter';
import { DEV_ADMIN_FLAGS } from '@/config/dev_overrides';

const FeatureFlagsAdmin: React.FC = () => {
	const navigate = useAuthNavigate();
	const [flags, setFlags] = useState<AdminFlagEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState<string | null>(null);

	useEffect(() => {
		if (Env.isDevelopment()) {
			setFlags(DEV_ADMIN_FLAGS);
			setLoading(false);
			return;
		}

		featureFlagApi
			.adminGetAllFlags()
			.then((res) => {
				if (res?.Content?.flags) {
					setFlags(res.Content.flags);
				}
			})
			.catch(() => toast.error('Failed to load feature flags'))
			.finally(() => setLoading(false));
	}, []);

	const handleToggle = useCallback(async (flag: AdminFlagEntry) => {
		const next = !flag.isEnabledGlobal;
		setSaving(flag.name);

		// Optimistic update
		setFlags((prev) =>
			prev.map((f) => (f.name === flag.name ? { ...f, isEnabledGlobal: next } : f))
		);

		if (Env.isDevelopment()) {
			setSaving(null);
			return;
		}

		try {
			await featureFlagApi.adminUpdateFlag(flag.name, next, flag.rolloutPercent);
			toast.success(`"${flag.name}" turned ${next ? 'on' : 'off'}`);
		} catch {
			// Revert on failure
			setFlags((prev) =>
				prev.map((f) =>
					f.name === flag.name ? { ...f, isEnabledGlobal: flag.isEnabledGlobal } : f
				)
			);
			toast.error(`Failed to update "${flag.name}"`);
		} finally {
			setSaving(null);
		}
	}, []);

	return (
		<Container>
			<BackRow onClick={() => navigate('/admin')}>
				<ChevronLeft size={16} />
				Admin
			</BackRow>

			<Title>Feature Flags</Title>
			<Subtitle>Changes take effect for users on their next page load.</Subtitle>

			{loading ? (
				<EmptyState>Loading...</EmptyState>
			) : flags.length === 0 ? (
				<EmptyState>No flags registered.</EmptyState>
			) : (
				<FlagList>
					{flags.map((flag) => (
						<FlagRow key={flag.name}>
							<FlagInfo>
								<FlagName>{flag.name}</FlagName>
								{flag.rolloutPercent !== null && (
									<RolloutPill>{flag.rolloutPercent}% rollout</RolloutPill>
								)}
							</FlagInfo>
							<Toggle
								$enabled={flag.isEnabledGlobal}
								$saving={saving === flag.name}
								onClick={() => saving === null && handleToggle(flag)}
								aria-label={`Toggle ${flag.name}`}
								role="switch"
								aria-checked={flag.isEnabledGlobal}
							>
								<ToggleThumb $enabled={flag.isEnabledGlobal} />
							</Toggle>
						</FlagRow>
					))}
				</FlagList>
			)}
		</Container>
	);
};

const Container = styled.div`
	max-width: 600px;
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
	margin: 0 0 3rem 0;
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
	&:last-child {
		border-bottom: none;
	}
`;

const FlagInfo = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const FlagName = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.base};
	color: ${({ theme }) => theme.colors.text.primary};
	font-family: monospace;
`;

const RolloutPill = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	color: ${({ theme }) => theme.colors.brand[400]};
	border: 1px solid ${({ theme }) => theme.colors.brand[400]};
	border-radius: 999px;
	padding: 1px 8px;
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
