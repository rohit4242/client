// Functional programming types for signal bot system

// Import required types
import type { SignalBot } from "../signal-bot";
import type { ErrorType } from "./validation";

// Local type definitions for trading interfaces
interface SymbolInfo {
  minQty: number;
  stepSize: number;
  minNotional: number;
}

interface AssetBalance {
  asset: string;
  free: string;
  locked: string;
}

interface Position {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  quantity: number;
  entryValue: number;
  stopLoss?: number;
  takeProfit?: number;
  status: string;
  createdAt: Date;
}

export interface PositionCreationContext {
  bot: SignalBot;
  symbol: string;
  side: 'Long' | 'Short';
  customQuantity?: number;
  userAccountId: string;
}

export interface EnrichedContext extends PositionCreationContext {
  currentPrice: number;
  symbolInfo: SymbolInfo;
  balances: AssetBalance[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  suggestedQuantity?: number;
  data?: Record<string, unknown>;
}

export interface PositionResult {
  success: boolean;
  position?: Position;
  message?: string;
  error?: string;
  errorType?: ErrorType;
  statusCode?: number;
}

export interface PositionCalculation {
  quantity: number;
  positionValue: number;
  stopLoss?: number;
  takeProfit?: number;
  validation: ValidationResult;
}
