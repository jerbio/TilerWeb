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
				// Try to parse error response body for structured error info
				try {
					const errorBody = await res.json();
					// If the response has the expected error structure, throw it directly
					if (errorBody && typeof errorBody === 'object' && 'Error' in errorBody) {
						throw errorBody;
					}
					// Otherwise, throw a ServerError with the parsed body as details
					throw new ServerError(`HTTP error! status: ${res.status}`, requestEndpoint, errorBody);
				} catch (jsonError) {
					// If JSON parsing fails, throw a standard ServerError
					if (jsonError instanceof ServerError || (jsonError && typeof jsonError === 'object' && 'Error' in jsonError)) {
						throw jsonError;
					}
					throw new ServerError(`HTTP error! status: ${res.status}`, requestEndpoint);
				}
			}
			return (await res.json()) as T;
		} catch (error) {
			if (error instanceof ServerError) throw error;
			// Check if it's a structured error response (not ServerError)
			if (error && typeof error === 'object' && 'Error' in error) {
				throw error;
			}
			throw new ServerError('Unexpected error occurred', requestEndpoint, error);
		}
	}

	async apiRequestFormData<T>(
		endpoint: string,
		options?: RequestInit & { authRequired?: boolean }
	): Promise<T> {
		const requestEndpoint = this.getUri(endpoint);

		// Destructure to exclude headers from the spread
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { headers: _headers, authRequired, ...restOptions } = options || {};

		const requestOptions: RequestInit = {
			method: 'POST',
			...restOptions,
		};

		// Don't set Content-Type header for FormData - browser will set it with boundary
		const headers = new Headers();

		if (authRequired) {
			const token = localStorage.getItem('tiler_bearer');
			if (!token) {
				throw new AuthError('No bearer token found');
			} else {
				headers.append('Authorization', token);
			}
		}

		// Only set headers if we added authorization, otherwise leave undefined
		// to let browser set multipart/form-data with boundary
		if (authRequired) {
			requestOptions.headers = headers;
		}

		try {
			const res = await fetch(requestEndpoint, requestOptions);
			if (!res.ok) {
				// Try to parse error response body for structured error info
				try {
					const errorBody = await res.json();
					// If the response has the expected error structure, throw it directly
					if (errorBody && typeof errorBody === 'object' && 'Error' in errorBody) {
						throw errorBody;
					}
					// Otherwise, throw a ServerError with the parsed body as details
					throw new ServerError(`HTTP error! status: ${res.status}`, requestEndpoint, errorBody);
				} catch (jsonError) {
					// If JSON parsing fails, throw a standard ServerError
					if (jsonError instanceof ServerError || (jsonError && typeof jsonError === 'object' && 'Error' in jsonError)) {
						throw jsonError;
					}
					throw new ServerError(`HTTP error! status: ${res.status}`, requestEndpoint);
				}
			}
			return (await res.json()) as T;
		} catch (error) {
			if (error instanceof ServerError) throw error;
			// Check if it's a structured error response (not ServerError)
			if (error && typeof error === 'object' && 'Error' in error) {
				throw error;
			}
			throw new ServerError('Unexpected error occurred', requestEndpoint, error);
		}
	}

	get defaultDomain(): string {
		return this.#baseUrl;
	}
}
