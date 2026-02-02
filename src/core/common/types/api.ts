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
