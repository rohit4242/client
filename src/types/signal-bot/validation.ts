// Validation and error types for signal bot functional programming
export type ErrorType =
  | 'INSUFFICIENT_BALANCE'
  | 'INVALID_SYMBOL'
  | 'EXCHANGE_ERROR'
  | 'ORDER_ERROR'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN_ERROR';

export interface ErrorContext {
  botId: string;
  symbol: string;
  side: 'Long' | 'Short';
  positionId?: string;
}
