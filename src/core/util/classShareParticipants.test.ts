import { describe, expect, it } from 'vitest';
import { classParticipantRows } from './classShareParticipants';
import { shareAssignment, shareTilette } from '@/test/tileshare-fixtures';
import { InvitationStatus } from '@/core/common/types/tileshare';

describe('Class participant overview data', () => {
	it('includes roster-only people and deduplicates contact and assignment identities', () => {
		const rows = classParticipantRows(
			[shareTilette('task', [shareAssignment('viewer')])],
			[{ Email: 'VIEWER@example.com' }, { Email: 'waiting@example.com' }]
		);
		expect(rows).toHaveLength(2);
		expect(rows.find((row) => row.person.Id === 'viewer')?.assignments).toHaveLength(1);
		expect(
			rows.find((row) => row.person.Email === 'waiting@example.com')?.assignments
		).toHaveLength(0);
	});
	it('keeps responses separate from completed work and includes all assignments in the denominator', () => {
		const rows = classParticipantRows([
			shareTilette('done', [shareAssignment('viewer', InvitationStatus.Accepted, 100)]),
			shareTilette('unknown', [shareAssignment('viewer', InvitationStatus.Accepted, null)]),
			shareTilette('waiting', [shareAssignment('viewer', InvitationStatus.None, 100)]),
		]);
		expect(rows[0].completed).toBe(1);
		expect(rows[0].assignments).toHaveLength(3);
		expect(rows[0].responses.get(InvitationStatus.Accepted)).toBe(2);
		expect(rows[0].responses.get(InvitationStatus.None)).toBe(1);
	});
	it('merges roster entries connected by a later assignment', () => {
		const rows = classParticipantRows(
			[shareTilette('task', [shareAssignment('viewer')])],
			[{ Id: 'viewer' }, { Email: 'viewer@example.com' }]
		);
		expect(rows).toHaveLength(1);
		expect(rows[0].assignments).toHaveLength(1);
	});
});
