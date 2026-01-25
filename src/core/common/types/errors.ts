import { ApiResponse } from "./api";

export interface ErrorInfo {
  code: string;
  message: string | unknown;
  shouldRedirect: boolean;
  redirectPath?: string;
}

export class ChatLimitError extends Error {
  public readonly code: string;
  public readonly shouldRedirect: boolean;
  public readonly redirectPath?: string;

  constructor(errorInfo: ErrorInfo) {
    super(typeof errorInfo.message === 'string' ? errorInfo.message : '');
    this.name = 'ChatLimitError';
    this.code = errorInfo.code;
    this.shouldRedirect = errorInfo.shouldRedirect;
    this.redirectPath = errorInfo.redirectPath;
  }
}

export const ERROR_CODES = {
  CHAT_LIMIT_REACHED: '60000001',
} as const;

export const parseServerError = (error: unknown): ErrorInfo | null => {
  // Type guard to check if it's a server error response
  if (
    error &&
    typeof error === 'object' &&
    'Error' in error &&
    error.Error &&
    typeof error.Error === 'object' &&
    'Code' in error.Error &&
    'Message' in error.Error &&
    typeof error.Error.Code === 'string' &&
    (typeof error.Error.Message === 'string' || error.Error.Message === null)
  ) {
    const serverError = error as ApiResponse<string>;

    switch (serverError.Error.Code) {
      case ERROR_CODES.CHAT_LIMIT_REACHED:
        return {
          code: serverError.Error.Code,
          message: serverError.Error.Message ?? undefined,
          shouldRedirect: true,
          redirectPath: '/' // or wherever you want to redirect
        };

      default:
        return {
          code: serverError.Error.Code,
          message: serverError.Error.Message ?? undefined,
          shouldRedirect: false
        };
    }
  }

  return null;
};