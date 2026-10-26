import { AddressDataModel, TileshareLocation } from '@/core/common/types/tileshare';

export function toAddressData(location: TileshareLocation): AddressDataModel | undefined {
	const address = location.address.trim();
	return address
		? {
				Address: address,
				Description: location.description.trim() || undefined,
				AddressIsVerified: location.isVerified,
			}
		: undefined;
}
