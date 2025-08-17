import { WaitlistApi } from "@/api/waitlistApi";
import { normalizeError } from "@/core/error";

export class WaitlistService {
	private waitlistApi: WaitlistApi;
	constructor(waitlistApi: WaitlistApi) {
		this.waitlistApi = waitlistApi;
	}

	async joinWaitlist(email: string) {
		try {
			const response = await this.waitlistApi.joinWaitlist(email);
			return response;
		} catch (error) {
			console.error("Error joining waitlist", error);
			throw normalizeError(error);
		}
	}
}

