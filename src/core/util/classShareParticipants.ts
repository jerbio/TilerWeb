import {
	ContactModel,
	DesignatedUser,
	InvitationStatus,
	TileShareTemplate,
} from '@/core/common/types/tileshare';
import { classParticipants, contactKeys } from './tileshareMode';
import { validDesignatedUsers } from './tileshareAssignees';

export function assignmentContact(assignment: DesignatedUser): ContactModel {
	const identifier = assignment.displayedIdentifier ?? '';
	return {
		Id: assignment.userId ?? undefined,
		FirstName: assignment.userProfile?.firstName ?? undefined,
		LastName: assignment.userProfile?.lastName ?? undefined,
		Email: assignment.userProfile?.email ?? (identifier.includes('@') ? identifier : undefined),
		PhoneNumber:
			assignment.userProfile?.phoneNumber ??
			(!identifier.includes('@') ? identifier || undefined : undefined),
	};
}
export function matchesParticipant(person: ContactModel, assignment: DesignatedUser): boolean {
	const keys = contactKeys(assignmentContact(assignment));
	return contactKeys(person).some((key) => keys.includes(key));
}
export function classParticipantRows(
	tilettes: TileShareTemplate[],
	participants: ContactModel[] = []
) {
	return classParticipants(tilettes, participants).map((person) => {
		const assignments = tilettes.flatMap((tilette) => {
			const assignment = validDesignatedUsers(tilette.designatedUsers).find((user) =>
				matchesParticipant(person, user)
			);
			return assignment ? [{ tilette, assignment }] : [];
		});
		const profile = assignments.find(({ assignment }) => assignment.userProfile)?.assignment
			.userProfile;
		const name =
			profile?.fullName ||
			[profile?.firstName ?? person.FirstName, profile?.lastName ?? person.LastName]
				.filter(Boolean)
				.join(' ') ||
			person.Email ||
			person.PhoneNumber ||
			person.Id ||
			'';
		const completed = assignments.filter(
			({ assignment }) =>
				assignment.rsvpStatus === InvitationStatus.Accepted &&
				assignment.completionPct != null &&
				Number.isFinite(assignment.completionPct) &&
				assignment.completionPct >= 100
		).length;
		const responses = new Map<string, number>();
		for (const { assignment } of assignments) {
			const status =
				assignment.rsvpStatus === InvitationStatus.Pending
					? InvitationStatus.None
					: Object.values(InvitationStatus).includes(
								assignment.rsvpStatus as InvitationStatus
						  )
						? assignment.rsvpStatus!
						: 'unknown';
			responses.set(status, (responses.get(status) ?? 0) + 1);
		}
		return { key: contactKeys(person)[0], person, name, assignments, completed, responses };
	});
}
