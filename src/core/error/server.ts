class ServerError extends Error {
	public endpoint: string;
	public details?: unknown;
	/**
	 * HTTP status code of the failing response. Populated by `AppApi` when
	 * the response is a non-OK HTTP status; absent for network-level
	 * failures. The server answers a *plain* 404 (no JSON body) for missing
	 * integrations, so callers detect that case via `status`, not the body.
	 */
	public status?: number;

	constructor(message: string, endpoint: string, details?: unknown, status?: number) {
		super(message);
		this.name = 'ServerError';
		this.endpoint = endpoint;
		this.details = details;
		this.status = status;
	}
}

export default ServerError;
