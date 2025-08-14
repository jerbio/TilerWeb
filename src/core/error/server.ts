class ServerError extends Error {
	public endpoint: string;
	public details?: unknown;

	constructor(message: string, endpoint: string, details?: unknown) {
		super(message);
		this.name = 'ServerError';
		this.endpoint = endpoint;
		this.details = details;
	}
}

export default ServerError;
