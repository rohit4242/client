import { NextResponse } from "next/server";
import { createErrorResponse } from "@/types/api";

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Common error codes
 */
export const ErrorCodes = {
  // Authentication
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  
  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  
  // Trading
  INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE",
  INVALID_ORDER: "INVALID_ORDER",
  ORDER_FAILED: "ORDER_FAILED",
  POSITION_NOT_FOUND: "POSITION_NOT_FOUND",
  
  // Exchange
  EXCHANGE_ERROR: "EXCHANGE_ERROR",
  EXCHANGE_UNAVAILABLE: "EXCHANGE_UNAVAILABLE",
  INVALID_API_KEY: "INVALID_API_KEY",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  
  // System
  INTERNAL_ERROR: "INTERNAL_ERROR",
  NOT_FOUND: "NOT_FOUND",
  METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
} as const;

/**
 * Handle various error types and return standardized NextResponse
 */
export function handleApiError(error: unknown): NextResponse {
  console.error("[API Error]", error);

  // Handle ApiError instances
  if (error instanceof ApiError) {
    return NextResponse.json(
      createErrorResponse(error.message, error.code, error.details),
      { status: error.statusCode }
    );
  }

  // Handle Binance API errors
  if (error && typeof error === "object" && "message" in error) {
    const errorMessage = (error as Error).message;
    
    // Check for specific Binance error patterns
    if (errorMessage.includes("Invalid API-key")) {
      return NextResponse.json(
        createErrorResponse(
          "Invalid API key or insufficient permissions",
          ErrorCodes.INVALID_API_KEY,
          { originalError: errorMessage }
        ),
        { status: 401 }
      );
    }
    
    if (errorMessage.includes("Insufficient balance")) {
      return NextResponse.json(
        createErrorResponse(
          "Insufficient balance for this operation",
          ErrorCodes.INSUFFICIENT_BALANCE,
          { originalError: errorMessage }
        ),
        { status: 400 }
      );
    }
    
    if (errorMessage.includes("Too many requests") || errorMessage.includes("Rate limit")) {
      return NextResponse.json(
        createErrorResponse(
          "Rate limit exceeded. Please try again later",
          ErrorCodes.RATE_LIMIT_EXCEEDED,
          { originalError: errorMessage }
        ),
        { status: 429 }
      );
    }

    // Generic Binance error
    return NextResponse.json(
      createErrorResponse(
        errorMessage,
        ErrorCodes.EXCHANGE_ERROR,
        { originalError: errorMessage }
      ),
      { status: 400 }
    );
  }

  // Handle Zod validation errors
  if (error && typeof error === "object" && "issues" in error) {
    return NextResponse.json(
      createErrorResponse(
        "Validation failed",
        ErrorCodes.VALIDATION_ERROR,
        { issues: (error as any).issues }
      ),
      { status: 400 }
    );
  }

  // Generic error fallback
  return NextResponse.json(
    createErrorResponse(
      "An unexpected error occurred",
      ErrorCodes.INTERNAL_ERROR,
      process.env.NODE_ENV === "development"
        ? { error: error instanceof Error ? error.message : String(error) }
        : undefined
    ),
    { status: 500 }
  );
}

/**
 * Middleware wrapper for API routes with error handling
 */
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error) as any;
    }
  };
}

