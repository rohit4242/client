/**
 * Signal Bot Constants
 * 
 * Centralized constants for Signal Bot feature.
 */

// Order Type Options
export const ORDER_TYPE_OPTIONS = [
    { label: "Market Order", value: "Market" },
    { label: "Limit Order", value: "Limit" },
] as const;

// Account Type Options
export const ACCOUNT_TYPE_OPTIONS = [
    { label: "Spot Trading", value: "SPOT" },
    { label: "Margin Trading", value: "MARGIN" },
] as const;

// Side Effect Type Options (for margin trading)
export const SIDE_EFFECT_TYPE_OPTIONS = [
    { label: "No Side Effect", value: "NO_SIDE_EFFECT", description: "Normal order without auto-borrow/repay" },
    { label: "Margin Buy", value: "MARGIN_BUY", description: "Auto-borrow if balance insufficient" },
    { label: "Auto Repay", value: "AUTO_REPAY", description: "Auto-repay debt when selling" },
    { label: "Auto Borrow & Repay", value: "AUTO_BORROW_REPAY", description: "Automatically borrow and repay as needed" },
] as const;

// Trade Amount Type Options
export const TRADE_AMOUNT_TYPE_OPTIONS = [
    { label: "Quote Currency", value: "QUOTE", example: "USDT" },
    { label: "Base Currency", value: "BASE", example: "BTC" },
] as const;

// Popular trading symbols for signal bots
export const SIGNAL_BOT_SYMBOLS = [
    "BTCUSDT",
    "BTCFDUSD",
    "ETHUSDT",
    "ETHFDUSD",
    "BNBUSDT",
    "ADAUSDT",
    "XRPUSDT",
    "SOLUSDT",
    "DOTUSDT",
    "DOGEUSDT",
    "AVAXUSDT",
    "MATICUSDT",
    "LINKUSDT",
    "UNIUSDT",
    "LTCUSDT",
    "BCHUSDT",
    "XLMUSDT",
    "FILUSDT",
    "TRXUSDT",
    "ETCUSDT",
    "XMRUSDT",
    "EOSUSDT",
] as const;
