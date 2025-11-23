/**
 * Cross margin account information from Binance
 */
export interface MarginAccountInfo {
  created: boolean;
  borrowEnabled: boolean;
  marginLevel: string;
  collateralMarginLevel: string;
  totalAssetOfBtc: string;
  totalLiabilityOfBtc: string;
  totalNetAssetOfBtc: string;
  TotalCollateralValueInUSD: string;
  totalOpenOrderLossInUSD: string;
  tradeEnabled: boolean;
  transferInEnabled: boolean;
  transferOutEnabled: boolean;
  accountType: string; // "MARGIN_1" for Cross Margin Classic, "MARGIN_2" for Cross Margin Pro
  userAssets: MarginAsset[];
}

/**
 * Individual asset in margin account
 */
export interface MarginAsset {
  asset: string;
  borrowed: string;
  free: string;
  interest: string;
  locked: string;
  netAsset: string;
}

/**
 * Side effect types for margin orders
 */
export enum SideEffectType {
  NO_SIDE_EFFECT = 'NO_SIDE_EFFECT', // Normal order, no auto borrow/repay
  MARGIN_BUY = 'MARGIN_BUY', // Auto borrow if balance insufficient
  AUTO_REPAY = 'AUTO_REPAY', // Auto repay debt when selling
}

/**
 * Margin order parameters
 */
export interface MarginOrderParams {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  quantity?: string;
  quoteOrderQty?: string;
  price?: string;
  sideEffectType?: SideEffectType;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
}

/**
 * Borrow request payload
 */
export interface BorrowRequest {
  asset: string;
  amount: string;
  exchangeId?: string;
}

/**
 * Repay request payload
 */
export interface RepayRequest {
  asset: string;
  amount: string;
  exchangeId?: string;
}

/**
 * Transfer request payload
 */
export interface TransferRequest {
  asset: string;
  amount: string;
  direction: 'toMargin' | 'toSpot';
  exchangeId?: string;
}

/**
 * Max borrowable response
 */
export interface MaxBorrowable {
  asset: string;
  amount: string;
}

/**
 * Margin interest record
 */
export interface MarginInterest {
  asset: string;
  interest: string;
  interestAccuredTime: number;
  interestRate: string;
  principal: string;
  type: string;
}

/**
 * Account type for trading
 */
export type AccountType = 'spot' | 'margin';

/**
 * Risk level based on margin level
 */
export type RiskLevel = 'safe' | 'warning' | 'danger';

/**
 * Margin account statistics
 */
export interface MarginAccountStats {
  totalAssets: number;
  totalBorrowed: number;
  marginLevel: number;
  riskLevel: RiskLevel;
  isLiquidationRisk: boolean;
}

