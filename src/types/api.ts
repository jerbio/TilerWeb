export type ApiResponse<T> = {
	Error: {
		Code: string;
		Message: string;
	};
	Content: T;
};
