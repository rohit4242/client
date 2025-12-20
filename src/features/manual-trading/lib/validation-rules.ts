/**
 * Manual Trading Feature - Validation Rules
 * 
 * Business logic for order validation
 */

import type {
    OrderFormData,
    ValidationContext,
    ValidationError,
    ValidationResult,
    TradingConstraints,
} from "../types/manual-trading.types";
import { extractBaseAsset, extractQuoteAsset, parseAssetAmount } from "../utils/asset-utils";

/**
 * Validate order before submission
 */
export function validateOrder(
    orderData: OrderFormData,
    context: ValidationContext
): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!orderData.symbol) {
        errors.push({
            code: 'MISSING_SYMBOL',
            field: 'symbol',
            message: 'Please select a trading pair',
        });
    }

    if (!orderData.side) {
        errors.push({
            code: 'MISSING_SIDE',
            field: 'side',
            message: 'Please select Buy or Sell',
        });
    }

    // Quantity validation
    const hasQuantity = orderData.quantity && parseFloat(orderData.quantity) > 0;
    const hasQuoteQty = orderData.quoteOrderQty && parseFloat(orderData.quoteOrderQty) > 0;

    if (!hasQuantity && !hasQuoteQty) {
        errors.push({
            code: 'MISSING_QUANTITY',
            field: 'quantity',
            message: 'Please enter a quantity or total amount',
        });
    }

    // Price validation for limit orders
    if (orderData.type === "LIMIT") {
        if (!orderData.price || parseFloat(orderData.price) <= 0) {
            errors.push({
                code: 'MISSING_PRICE',
                field: 'price',
                message: 'Please enter a limit price',
            });
        }
    }

    // If basic validation fails, return early
    if (errors.length > 0) {
        return { isValid: false, errors, warnings };
    }

    // Advanced validation with context
    const quantity = hasQuantity ? parseFloat(orderData.quantity!) :
        (hasQuoteQty && context.currentPrice ? parseFloat(orderData.quoteOrderQty!) / parseFloat(context.currentPrice.price) : 0);

    // Validate against trading constraints
    if (context.constraints) {
        const constraintErrors = validateConstraints(quantity, orderData, context.constraints);
        errors.push(...constraintErrors);
    }

    // Validate balance
    if (context.baseBalance && context.quoteBalance) {
        const balanceErrors = validateBalance(quantity, orderData, context);
        errors.push(...balanceErrors);
    }

    // Validate notional value
    if (context.currentPrice && context.constraints.minNotional) {
        const price = orderData.type === "LIMIT" && orderData.price ?
            parseFloat(orderData.price) : parseFloat(context.currentPrice.price);
        const notional = quantity * price;

        if (notional < context.constraints.minNotional) {
            errors.push({
                code: 'BELOW_MIN_NOTIONAL',
                field: 'quantity',
                message: `Order value (${notional.toFixed(2)} ${context.quoteAsset}) is below minimum (${context.constraints.minNotional.toFixed(2)} ${context.quoteAsset})`,
            });
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Validate order against trading constraints
 */
function validateConstraints(
    quantity: number,
    orderData: OrderFormData,
    constraints: TradingConstraints
): ValidationError[] {
    const errors: ValidationError[] = [];

    // Min quantity
    if (quantity < constraints.minQuantity) {
        errors.push({
            code: 'BELOW_MIN_QUANTITY',
            field: 'quantity',
            message: `Quantity must be at least ${constraints.minQuantity}`,
        });
    }

    // Max quantity
    if (quantity > constraints.maxQuantity) {
        errors.push({
            code: 'ABOVE_MAX_QUANTITY',
            field: 'quantity',
            message: `Quantity exceeds maximum of ${constraints.maxQuantity}`,
        });
    }

    // Step size (lot size)
    if (constraints.stepSize > 0) {
        const remainder = quantity % constraints.stepSize;
        if (remainder > 0.00000001) { // Floating point tolerance
            errors.push({
                code: 'INVALID_LOT_SIZE',
                field: 'quantity',
                message: `Quantity must be a multiple of ${constraints.stepSize}`,
            });
        }
    }

    // Price validation for limit orders
    if (orderData.type === "LIMIT" && orderData.price) {
        const price = parseFloat(orderData.price);

        // Min price
        if (price < constraints.minPrice) {
            errors.push({
                code: 'BELOW_MIN_PRICE',
                field: 'price',
                message: `Price must be at least ${constraints.minPrice}`,
            });
        }

        // Max price
        if (price > constraints.maxPrice) {
            errors.push({
                code: 'ABOVE_MAX_PRICE',
                field: 'price',
                message: `Price exceeds maximum of ${constraints.maxPrice}`,
            });
        }

        // Tick size
        if (constraints.tickSize > 0) {
            const remainder = price % constraints.tickSize;
            if (remainder > 0.00000001) {
                errors.push({
                    code: 'INVALID_TICK_SIZE',
                    field: 'price',
                    message: `Price must be a multiple of ${constraints.tickSize}`,
                });
            }
        }
    }

    return errors;
}

/**
 * Validate balance for order
 */
function validateBalance(
    quantity: number,
    orderData: OrderFormData,
    context: ValidationContext
): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!context.currentPrice) {
        return errors;
    }

    const price = orderData.type === "LIMIT" && orderData.price ?
        parseFloat(orderData.price) : parseFloat(context.currentPrice.price);

    if (orderData.side === "BUY") {
        // Buying: need quote asset (e.g., USDT)
        const quoteBalance = parseAssetAmount(context.quoteBalance?.free || '0');
        const totalCost = quantity * price;

        // Check if we have margin borrowing enabled
        const hasBorrowing = context.sideEffectType === 'MARGIN_BUY';
        const maxBorrowable = context.maxBorrowableQuote || 0;
        const totalAvailable = quoteBalance + (hasBorrowing ? maxBorrowable : 0);

        if (totalCost > totalAvailable) {
            if (hasBorrowing) {
                errors.push({
                    code: 'INSUFFICIENT_BALANCE_WITH_BORROW',
                    field: 'quantity',
                    message: `Insufficient ${context.quoteAsset}. Available: ${quoteBalance.toFixed(2)}, Borrowable: ${maxBorrowable.toFixed(2)}, Required: ${totalCost.toFixed(2)}`,
                });
            } else {
                errors.push({
                    code: 'INSUFFICIENT_BALANCE',
                    field: 'quantity',
                    message: `Insufficient ${context.quoteAsset} balance. Available: ${quoteBalance.toFixed(2)}, Required: ${totalCost.toFixed(2)}`,
                });
            }
        }
    } else {
        // Selling: need base asset (e.g., BTC)
        const baseBalance = parseAssetAmount(context.baseBalance?.free || '0');

        // Check if we have margin borrowing enabled (for short selling)
        const hasBorrowing = context.sideEffectType === 'MARGIN_BUY';
        const maxBorrowable = context.maxBorrowableBase || 0;
        const totalAvailable = baseBalance + (hasBorrowing ? maxBorrowable : 0);

        if (quantity > totalAvailable) {
            if (hasBorrowing) {
                errors.push({
                    code: 'INSUFFICIENT_BALANCE_WITH_BORROW',
                    field: 'quantity',
                    message: `Insufficient ${context.baseAsset}. Available: ${baseBalance.toFixed(8)}, Borrowable: ${maxBorrowable.toFixed(8)}, Required: ${quantity.toFixed(8)}`,
                });
            } else {
                errors.push({
                    code: 'INSUFFICIENT_BALANCE',
                    field: 'quantity',
                    message: `Insufficient ${context.baseAsset} balance. Available: ${baseBalance.toFixed(8)}, Required: ${quantity.toFixed(8)}`,
                });
            }
        }
    }

    return errors;
}
