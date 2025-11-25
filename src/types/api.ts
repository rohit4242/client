/**
 * Standard API Response Types
 * All API routes should use these types for consistent response format
 */

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Helper to create success response
 */
export function createSuccessResponse<T>(data: T, message?: string): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
  };
}

/**
 * Helper to create error response
 */
export function createErrorResponse(error: string, code?: string, details?: any): ApiErrorResponse {
  return {
    success: false,
    error,
    ...(code && { code }),
    ...(details && { details }),
  };
}

