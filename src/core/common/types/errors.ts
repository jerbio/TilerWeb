import { ApiResponse, ApiCodeResponse } from './api';
import i18n from '@/i18n/config';

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

export class TilerResponseError extends Error {
  public readonly code: string;
  public readonly message: string;

  constructor(errorCode: string, message?: string) {
    const errorMessage = message || `Error code: ${errorCode}`;
    super(errorMessage);
    this.name = 'TilerResponseError';
    this.code = errorCode;
    this.message = errorMessage;
  }

  /**
   * Create TilerResponseError from ApiCodeResponse
   * @param apiCodeResponse - ApiCodeResponse from server
   * @returns TilerResponseError instance with server message
   */
  static fromApiCodeResponse(apiCodeResponse: ApiCodeResponse): TilerResponseError {
    const message =
      typeof apiCodeResponse.Message === 'string'
        ? apiCodeResponse.Message
        : `Error code: ${apiCodeResponse.Code}`;
    return new TilerResponseError(apiCodeResponse.Code, message);
  }
}

export const ERROR_CODES = {
  CHAT_LIMIT_REACHED: '60000001',
  USERNAME_ALREADY_EXISTS: '1004',
} as const;

// Error message map for internationalization
// Keys correspond to error codes, values are i18n translation keys
export const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.CHAT_LIMIT_REACHED]: 'errors.chatLimitReached',
  [ERROR_CODES.USERNAME_ALREADY_EXISTS]: 'errors.usernameAlreadyExists',
};

// Default error messages (fallback when i18n is not available)
export const DEFAULT_ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.CHAT_LIMIT_REACHED]: 'Chat limit reached. Please try again later.',
  [ERROR_CODES.USERNAME_ALREADY_EXISTS]: 'Username already exists',
};

/**
 * Get error message by error code
 * @param code - Error code
 * @returns Translated error message or default message
 */
export const getErrorMessage = (code: string): string => {
  // Use i18n translation if available
  if (i18n.isInitialized && ERROR_MESSAGES[code]) {
    return i18n.t(ERROR_MESSAGES[code]);
  }

  // Fall back to default messages
  return DEFAULT_ERROR_MESSAGES[code] || 'An unexpected error occurred';
};

/**
 * Get error info with localized message
 * @param code - Error code
 * @returns ErrorInfo object with localized message
 */
export const getErrorInfo = (code: string): ErrorInfo => {
  const message = getErrorMessage(code);

  switch (code) {
    case ERROR_CODES.CHAT_LIMIT_REACHED:
      return {
        code,
        message,
        shouldRedirect: true,
        redirectPath: '/',
      };
    case ERROR_CODES.USERNAME_ALREADY_EXISTS:
      return {
        code,
        message,
        shouldRedirect: false,
      };
    default:
      return {
        code,
        message: '',
        shouldRedirect: false,
      };
  }
};

/**
 * Parse server error response and return ErrorInfo with localized message
 * @param error - Error object from server
 * @returns ErrorInfo object or null if not a valid server error
 */
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
    const errorCode = serverError.Error.Code;

    // Get localized error info
    const errorInfo = getErrorInfo(errorCode);

    // Use server message as fallback if i18n is not initialized and server provides a message
    if ((!i18n.isInitialized || !errorInfo.message) && serverError.Error.Message) {
      errorInfo.message = serverError.Error.Message;
    }

    return errorInfo;
  }

  return null;
};
