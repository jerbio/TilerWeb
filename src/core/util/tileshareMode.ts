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
		const existing = identity.map((key) => keys.get(key)).find(Boolean);
		const merged = existing ?? { ...person };
		if (existing) {
			merged.Id ??= person.Id;
			merged.Email ??= person.Email;
			merged.PhoneNumber ??= person.PhoneNumber;
		} else result.push(merged);
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
