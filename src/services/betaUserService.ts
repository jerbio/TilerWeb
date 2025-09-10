import { BetaUserApi } from "@/api/betaUserApi";
import { BetaUserBody } from "@/core/common/types/beta_user";

export class BetaUserService {
	private betaUserApi: BetaUserApi;
	constructor(betaUserApi: BetaUserApi) {
		this.betaUserApi = betaUserApi;
	}

	async signUp({
		email,
		profession,
		integrations,
		useCases,
	}: {
		email: string,
		profession: string,
		integrations: string[],
		useCases: string,
	}) {
		try {
			const betaUser: BetaUserBody = {
				Email: email,
				FullName: "",
				Profession: profession,
				Integrations: integrations,
				UserCase: useCases,
				TimeZoneOffset: new Date().getTimezoneOffset(),
				TimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			};
			const response = await this.betaUserApi.signUp(betaUser);
			return response;
		} catch (error) {
			console.error("Error signing up for beta", error);
			throw error;
		}
	}
}
