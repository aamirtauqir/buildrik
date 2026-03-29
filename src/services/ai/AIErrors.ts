/**
 * AIErrors - Error types and creators for AI services
 * @module services/ai/AIErrors
 * @license BSD-3-Clause
 */

export type AIErrorCode =
  | "API_ERROR"
  | "TIMEOUT"
  | "NETWORK_ERROR"
  | "RATE_LIMITED"
  | "INVALID_REQUEST"
  | "CONTENT_FILTERED"
  | "MAX_RETRIES"
  | "CANCELLED"
  | "UNKNOWN_ERROR";

export interface AIError extends Error {
  code: AIErrorCode;
  status?: number;
  isTimeout?: boolean;
  isNetworkError?: boolean;
  isRateLimited?: boolean;
  retryAfter?: number;
  suggestion?: string;
}

export const ERROR_SUGGESTIONS: Record<AIErrorCode, string> = {
  API_ERROR: "Check your request parameters and try again",
  TIMEOUT: "The request took too long. Try with a shorter prompt",
  NETWORK_ERROR: "Check your internet connection and try again",
  RATE_LIMITED: "Too many requests. Please wait before trying again",
  INVALID_REQUEST: "The request format is invalid. Check your input",
  CONTENT_FILTERED: "The content was filtered. Try rephrasing your prompt",
  MAX_RETRIES: "Multiple attempts failed. Please try again later",
  CANCELLED: "The request was cancelled",
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again",
};

export function createAIError(
  message: string,
  code: AIErrorCode,
  options: {
    status?: number;
    isTimeout?: boolean;
    isNetworkError?: boolean;
    isRateLimited?: boolean;
    retryAfter?: number;
  } = {}
): AIError {
  const error = new Error(message) as AIError;
  error.name = "AIError";
  error.code = code;
  error.status = options.status;
  error.isTimeout = options.isTimeout;
  error.isNetworkError = options.isNetworkError;
  error.isRateLimited = options.isRateLimited;
  error.retryAfter = options.retryAfter;
  error.suggestion = ERROR_SUGGESTIONS[code];
  return error;
}
