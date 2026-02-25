export type ApiRequest<T> = {
	ApiKey: string;
	Content: T;
};

export type ApiCodeResponse = {
	Code: string;
	Message: string | unknown;
};

export type ApiResponse<T> = {
	Error: ApiCodeResponse;
	Content: T;
	ServerStatus: null;
};

/**
 * Standardized pagination parameters used across API endpoints.
 *
 * - `batchSize` — number of items per page
 * - `index`     — page offset / cursor position
 * - `order`     — sort direction
 */
export interface PaginationParams {
	batchSize?: number;
	index?: number;
	order?: 'desc' | 'asc';
}
