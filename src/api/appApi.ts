import ServerError from '@/core/error/server';
import { Env } from '../config/config_getter';

type RequestOptions = RequestInit & {
	headers?: Headers;
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
			credentials: 'include', // Send ASP.NET authentication cookies with every request
			...options,
		};

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
		options?: RequestInit
	): Promise<T> {
		const requestEndpoint = this.getUri(endpoint);

		// Destructure to exclude headers from the spread
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { headers: _headers, ...restOptions } = options || {};

		const requestOptions: RequestInit = {
			method: 'POST',
			credentials: 'include', // Send ASP.NET authentication cookies with every request
			...restOptions,
		};

		// Don't set Content-Type header for FormData - browser will set it with boundary

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
