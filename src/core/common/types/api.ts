export type ApiRequest<T> = {
	ApiKey: string;
	Content: T;
};

export type ApiResponse<T> = {
	Error: {
		Code: string;
		Message: string;
	};
	Content: T;
	ServerStatus: null;
};
