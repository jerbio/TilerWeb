export class AppApi {
	#defaultUrl = 'https://tiler.app/';
	getUri(path: string): string {
		return this.defaultDomain + path;
	}

	get defaultDomain(): string {
		return this.#defaultUrl;
	}
}
