export class AppApi {
	#defaultUrl = 'https://localhost-44322-tiler-prod.conveyor.cloud/';
	// #defaultUrl = 'https://localhost:44388/';
	getUri(path: string): string {
		return this.defaultDomain + path;
	}

	get defaultDomain(): string {
		return this.#defaultUrl;
	}
}
