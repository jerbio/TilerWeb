import {
	TileShareCluster,
	TileshareMode,
	TileshareLocation,
	ContactModel,
	TileShareTemplate,
} from '@/core/common/types/tileshare';
import { validDesignatedUsers } from './tileshareAssignees';

export function parseTileshareMode(value: unknown): TileshareMode | null {
	if (typeof value !== 'string') return null;
	const mode = value.trim().toLowerCase();
	return Object.values(TileshareMode).includes(mode as TileshareMode)
		? (mode as TileshareMode)
		: null;
}

export function tileshareMode(cluster: TileShareCluster): TileshareMode | null {
	return parseTileshareMode(cluster.mode);
}

export const emptyTileshareLocation = (): TileshareLocation => ({
	address: '',
	description: '',
	isVerified: false,
});

export function shareLocation(
	entity?: Pick<TileShareCluster, 'addressData' | 'location'>
): TileshareLocation {
	if (entity?.addressData)
		return {
			address: entity.addressData.Address,
			description: entity.addressData.Description ?? '',
			isVerified: entity.addressData.AddressIsVerified,
		};
	return entity?.location
		? { ...entity.location, description: entity.location.description ?? '' }
		: emptyTileshareLocation();
}

/** Keep a participant's identity even before they have any task assignments. */
export function classParticipants(
	tilettes: TileShareTemplate[],
	participants: ContactModel[] = []
): ContactModel[] {
	const people = [...participants];
	for (const tilette of tilettes) {
		for (const user of validDesignatedUsers(tilette.designatedUsers)) {
			const profile = user.userProfile;
			const identifier = user.displayedIdentifier ?? '';
			people.push({
				Id: user.userId ?? undefined,
				FirstName: profile?.firstName ?? undefined,
				LastName: profile?.lastName ?? undefined,
				Email: profile?.email ?? (identifier.includes('@') ? identifier : undefined),
				PhoneNumber:
					profile?.phoneNumber ??
					(!identifier.includes('@') ? identifier || undefined : undefined),
			});
		}
	}
	const result: ContactModel[] = [];
	const keys = new Map<string, ContactModel>();
	for (const person of people) {
		const identity = contactKeys(person);
		if (!identity.length) continue;
		const matches = [
			...new Set(
				identity
					.map((key) => keys.get(key))
					.filter((value): value is ContactModel => !!value)
			),
		];
		const merged = matches[0] ?? { ...person };
		if (!matches.length) result.push(merged);
		for (const source of [...matches.slice(1), person]) {
			merged.Id ??= source.Id;
			merged.FirstName ??= source.FirstName;
			merged.LastName ??= source.LastName;
			merged.Email ??= source.Email;
			merged.PhoneNumber ??= source.PhoneNumber;
		}
		// A later assignment can connect an id-only roster entry to an email-only one.
		for (const duplicate of matches.slice(1)) {
			result.splice(result.indexOf(duplicate), 1);
			for (const [key, value] of keys) if (value === duplicate) keys.set(key, merged);
		}
		identity.forEach((key) => keys.set(key, merged));
	}
	return result;
}

export function contactKeys(person: ContactModel): string[] {
	const digits = person.PhoneNumber?.replace(/\D/g, '');
	return [
		person.Id && `id:${person.Id}`,
		person.Email?.trim() && `email:${person.Email.trim().toLowerCase()}`,
		digits && `phone:${digits}`,
	].filter(Boolean) as string[];
}
