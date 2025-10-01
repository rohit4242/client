import type { ErrorType, ErrorContext } from "@/types/signal-bot/validation";
import db from "@/db";

/**
 * Error result interface
 */
export interface ErrorResult {
  success: false;
  error: string;
  errorType: ErrorType;
  statusCode: number;
  context: ErrorContext;
}

/**
 * Handle position creation errors with cleanup
 * @param error - Error that occurred
 * @param context - Context where error occurred
 * @returns Promise<ErrorResult> - Standardized error result
 */
export const handlePositionError = async (
  error: Error,
  context: ErrorContext
): Promise<ErrorResult> => {
  console.error('Position creation error:', error);

  // Attempt cleanup if position was created
  if (context.positionId) {
    await cleanupFailedPosition(context.positionId);
  }

  // Determine error type and create appropriate response
  const errorType = determineErrorType(error);

  return {
    success: false,
    error: error.message,
    errorType,
    statusCode: getHttpStatusCode(errorType),
    context
  };
};

/**
 * Determine error type from error message or object
 * @param error - Error to analyze
 * @returns ErrorType - Categorized error type
 */
export const determineErrorType = (error: Error): ErrorType => {
  const message = error.message.toLowerCase();

  if (message.includes('insufficient balance') || message.includes('insufficient funds')) {
    return 'INSUFFICIENT_BALANCE';
  }

  if (message.includes('invalid symbol') || message.includes('not configured')) {
    return 'INVALID_SYMBOL';
  }

  if (message.includes('exchange') || message.includes('binance') || message.includes('api')) {
    return 'EXCHANGE_ERROR';
  }

  if (message.includes('order') || message.includes('position')) {
    return 'ORDER_ERROR';
  }

  if (message.includes('validation') || message.includes('invalid')) {
    return 'VALIDATION_ERROR';
  }

  return 'UNKNOWN_ERROR';
};

/**
 * Get HTTP status code for error type
 * @param errorType - Type of error
 * @returns number - HTTP status code
 */
export const getHttpStatusCode = (errorType: ErrorType): number => {
  switch (errorType) {
    case 'INSUFFICIENT_BALANCE':
    case 'INVALID_SYMBOL':
    case 'VALIDATION_ERROR':
      return 400;
    case 'EXCHANGE_ERROR':
    case 'ORDER_ERROR':
      return 502;
    default:
      return 500;
  }
};

/**
 * Clean up failed position
 * @param positionId - Position ID to delete
 * @returns Promise<void>
 */
export const cleanupFailedPosition = async (positionId: string): Promise<void> => {
  try {
    // Delete associated orders first
    await db.order.deleteMany({
      where: { positionId }
    });

    // Delete the position
    await db.position.delete({
      where: { id: positionId }
    });

    console.log(`Cleaned up failed position: ${positionId}`);
  } catch (error) {
    console.error('Failed to cleanup position:', error);
  }
};

/**
 * Log error with context
 * @param error - Error to log
 * @param context - Additional context
 */
export const logError = (error: Error, context?: Record<string, unknown>): void => {
  console.error('Signal Bot Error:', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Create user-friendly error message
 * @param error - Error object
 * @returns string - User-friendly message
 */
export const getUserFriendlyErrorMessage = (error: Error): string => {
  const errorType = determineErrorType(error);

  switch (errorType) {
    case 'INSUFFICIENT_BALANCE':
      return 'Insufficient balance to execute trade. Please check your exchange balance.';
    
    case 'INVALID_SYMBOL':
      return 'Invalid or unsupported trading symbol. Please check bot configuration.';
    
    case 'EXCHANGE_ERROR':
      return 'Exchange communication error. Please check your API credentials and try again.';
    
    case 'ORDER_ERROR':
      return 'Order execution failed. Please check symbol and exchange status.';
    
    case 'VALIDATION_ERROR':
      return 'Trade validation failed. Please check position parameters.';
    
    default:
      return 'An unexpected error occurred. Please try again or contact support.';
  }
};

/**
 * Handle webhook errors
 * @param error - Error that occurred
 * @param signalId - Optional signal ID
 * @returns Error response object
 */
export const handleWebhookError = async (
  error: Error,
  signalId?: string
): Promise<{ error: string; details: string; userMessage: string }> => {
  const errorType = determineErrorType(error);
  const userMessage = getUserFriendlyErrorMessage(error);

  // Log error with context
  logError(error, { signalId, errorType });

  // Update signal with error if provided
  if (signalId) {
    try {
      await db.signal.update({
        where: { id: signalId },
        data: {
          processed: true,
          error: error.message,
        },
      });
    } catch (updateError) {
      console.error('Failed to update signal error:', updateError);
    }
  }

  return {
    error: errorType,
    details: error.message,
    userMessage,
  };
};