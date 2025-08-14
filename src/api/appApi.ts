import ServerError from '@/core/error/server';
import { Env } from '../config/config_getter';
import AuthError from '@/core/error/auth';

type RequestOptions = RequestInit & {
	headers?: Headers;
	authRequired?: boolean;
};

export class AppApi {
	#baseUrl = Env.get('BASE_URL');
	getUri(path: string): string {
		return this.defaultDomain + path;
	}

	async apiRequest<T>(
		endpoint: string,
		options?: RequestOptions
	): Promise<T> {
		const requestEndpoint = this.getUri(endpoint);
		const requestOptions: RequestOptions = {
			method: 'GET',
			headers: new Headers({
				'Content-Type': 'application/json',
				Accept: 'application/json',
			}),
			...options,
		};

		if (options?.authRequired) {
			const token = localStorage.getItem('tiler_bearer');
			if (!token) {
				throw new AuthError('No bearer token found');
			} else {
				requestOptions.headers!.append('Authorization', token);
			}
		}

		try {
			const res = await fetch(requestEndpoint, requestOptions);
			if (!res.ok) {
				throw new ServerError(`HTTP error! status: ${res.status}`, requestEndpoint);
			}
			return (await res.json()) as T;
		} catch (error) {
			if (error instanceof ServerError) throw error;
			throw new ServerError('Unexpected error occurred', requestEndpoint, error);
		}
	}

	get defaultDomain(): string {
		return this.#baseUrl;
	}
}
