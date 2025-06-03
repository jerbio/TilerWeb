import { Env } from '../config/config_getter';

export class AppApi {
	#baseUrl = Env.get('BASE_URL');
	getUri(path: string): string {
		return this.defaultDomain + path;
	}

	get defaultDomain(): string {
		return this.#baseUrl;
	}
}
