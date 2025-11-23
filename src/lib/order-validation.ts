import { TradingFormData } from "@/db/schema/order";
import { TradingConstraints, validateMinNotional, isValidStepSize } from "./trading-constraints";
import { AssetBalance, AssetPrice } from "@/types/trading";


export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface OrderValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export interface ValidationContext {
  baseAsset: string;
  quoteAsset: string;
  constraints: TradingConstraints | null;
  baseBalance: AssetBalance | null;
  quoteBalance: AssetBalance | null;
  currentPrice: AssetPrice | null;
  sideEffectType?: string;
  maxBorrowableQuote?: number | null;
  maxBorrowableBase?: number | null;
}

export function validateOrder(
  orderData: TradingFormData,
  context: ValidationContext
): OrderValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  const { currentPrice } = context;

  // Basic data validation
  if (!currentPrice?.price || parseFloat(currentPrice.price) <= 0) {
    errors.push({
      field: "general",
      message: "Current price is not available. Please try again.",
      code: "PRICE_UNAVAILABLE"
    });
    return { isValid: false, errors, warnings };
  }

  const price = parseFloat(currentPrice.price);

  // Validate based on order type and side
  if (orderData.type === "MARKET") {
    if (orderData.side === "BUY") {
      validateBuyOrder(orderData as TradingFormData & { type: "MARKET"; side: "BUY" }, context, price, errors, warnings);
    } else {
      validateSellOrder(orderData as TradingFormData & { type: "MARKET"; side: "SELL" }, context, errors);
    }
  } else if (orderData.type === "LIMIT") {
    validateLimitOrder(orderData as TradingFormData & { type: "LIMIT" }, context, errors);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}


function validateBuyOrder(
  orderData: TradingFormData & { type: "MARKET"; side: "BUY" },
  context: ValidationContext,
  currentPrice: number,
  errors: ValidationError[],
  warnings: string[]
) {
  const { baseAsset, quoteAsset, constraints, quoteBalance, sideEffectType, maxBorrowableQuote } = context;

  const quantity = orderData.quantity ? parseFloat(orderData.quantity) : 0;
  const quoteOrderQty = orderData.quoteOrderQty ? parseFloat(orderData.quoteOrderQty) : 0;
  const availableQuoteBalance = quoteBalance ? parseFloat(quoteBalance.free) : 0;

  // Must have either quantity or quoteOrderQty
  if (!quantity && !quoteOrderQty) {
    errors.push({
      field: "quantity",
      message: "Please enter either total amount or quantity to buy.",
      code: "MISSING_QUANTITY"
    });
    return;
  }

  // Validate by total (quoteOrderQty)
  if (quoteOrderQty > 0) {
    // Check minimum notional
    if (constraints?.minNotional && quoteOrderQty < constraints.minNotional) {
      errors.push({
        field: "quoteOrderQty",
        message: `Minimum order value is ${constraints.minNotional.toFixed(2)} ${quoteAsset}`,
        code: "MIN_NOTIONAL"
      });
    }

    // Check maximum notional
    if (constraints?.maxNotional && quoteOrderQty > constraints.maxNotional) {
      errors.push({
        field: "quoteOrderQty",
        message: `Maximum order value is ${constraints.maxNotional.toFixed(2)} ${quoteAsset}`,
        code: "MAX_NOTIONAL"
      });
    }

    // Check balance or max borrowable based on sideEffectType
    if (sideEffectType === 'MARGIN_BUY') {
      // Skip balance check, validate against max borrowable
      const requiredBorrow = Math.max(0, quoteOrderQty - availableQuoteBalance);
      if (maxBorrowableQuote !== null && maxBorrowableQuote !== undefined) {
        if (requiredBorrow > maxBorrowableQuote) {
          errors.push({
            field: "quoteOrderQty",
            message: `Order exceeds maximum borrowable amount. Max borrowable: ${maxBorrowableQuote.toFixed(2)} ${quoteAsset}`,
            code: "EXCEEDS_MAX_BORROWABLE"
          });
        }
      }
    } else {
      // Standard balance validation (NO_SIDE_EFFECT or AUTO_REPAY)
      if (quoteOrderQty > availableQuoteBalance) {
        errors.push({
          field: "quoteOrderQty",
          message: `Insufficient ${quoteAsset} balance. Available: ${availableQuoteBalance.toFixed(8)} ${quoteAsset}`,
          code: "INSUFFICIENT_BALANCE"
        });
      }
    }

    // Calculate estimated quantity for warnings
    const estimatedQuantity = quoteOrderQty / currentPrice;
    if (constraints?.minQty && estimatedQuantity < constraints.minQty) {
      warnings.push(`Estimated quantity (${estimatedQuantity.toFixed(8)} ${baseAsset}) may be below minimum (${constraints.minQty} ${baseAsset})`);
    }
  }

  // Validate by quantity
  if (quantity > 0) {
    // Check minimum quantity
    if (constraints?.minQty && quantity < constraints.minQty) {
      errors.push({
        field: "quantity",
        message: `Minimum quantity is ${constraints.minQty} ${baseAsset}`,
        code: "MIN_QUANTITY"
      });
    }

    // Check maximum quantity
    if (constraints?.maxQty && quantity > constraints.maxQty) {
      errors.push({
        field: "quantity",
        message: `Maximum quantity is ${constraints.maxQty} ${baseAsset}`,
        code: "MAX_QUANTITY"
      });
    }

    // Check step size
    if (constraints?.stepSize && !isValidStepSize(quantity, constraints.stepSize)) {
      errors.push({
        field: "quantity",
        message: `Quantity must be a multiple of ${constraints.stepSize} ${baseAsset}`,
        code: "STEP_SIZE"
      });
    }

    // Check balance or max borrowable based on sideEffectType
    const estimatedCost = quantity * currentPrice;
    if (sideEffectType === 'MARGIN_BUY') {
      // Skip balance check, validate against max borrowable
      const requiredBorrow = Math.max(0, estimatedCost - availableQuoteBalance);
      if (maxBorrowableQuote !== null && maxBorrowableQuote !== undefined) {
        if (requiredBorrow > maxBorrowableQuote) {
          errors.push({
            field: "quantity",
            message: `Order exceeds maximum borrowable amount. Max borrowable: ${maxBorrowableQuote.toFixed(2)} ${quoteAsset}`,
            code: "EXCEEDS_MAX_BORROWABLE"
          });
        }
      }
    } else {
      // Standard balance validation (NO_SIDE_EFFECT or AUTO_REPAY)
      if (estimatedCost > availableQuoteBalance) {
        errors.push({
          field: "quantity",
          message: `Insufficient ${quoteAsset} balance. Need: ${estimatedCost.toFixed(2)} ${quoteAsset}, Available: ${availableQuoteBalance.toFixed(2)} ${quoteAsset}`,
          code: "INSUFFICIENT_BALANCE"
        });
      }
    }

    // Check minimum notional
    if (constraints?.minNotional && !validateMinNotional(quantity, currentPrice, constraints.minNotional)) {
      errors.push({
        field: "quantity",
        message: `Order value (${(quantity * currentPrice).toFixed(2)} ${quoteAsset}) is below minimum (${constraints.minNotional.toFixed(2)} ${quoteAsset})`,
        code: "MIN_NOTIONAL"
      });
    }
  }
}

function validateSellOrder(
  orderData: TradingFormData & { type: "MARKET"; side: "SELL" },
  context: ValidationContext,
  errors: ValidationError[]
) {
  const { baseAsset, constraints, baseBalance, sideEffectType, maxBorrowableBase } = context;

  const quantity = orderData.quantity ? parseFloat(orderData.quantity) : 0;
  const availableBaseBalance = baseBalance ? parseFloat(baseBalance.free) : 0;

  // Must have quantity for sell orders
  if (!quantity || quantity <= 0) {
    errors.push({
      field: "quantity",
      message: "Please enter the amount to sell.",
      code: "MISSING_QUANTITY"
    });
    return;
  }

  // Check minimum quantity
  if (constraints?.minQty && quantity < constraints.minQty) {
    errors.push({
      field: "quantity",
      message: `Minimum quantity is ${constraints.minQty} ${baseAsset}`,
      code: "MIN_QUANTITY"
    });
  }

  // Check maximum quantity
  if (constraints?.maxQty && quantity > constraints.maxQty) {
    errors.push({
      field: "quantity",
      message: `Maximum quantity is ${constraints.maxQty} ${baseAsset}`,
      code: "MAX_QUANTITY"
    });
  }

  // Check step size
  if (constraints?.stepSize && !isValidStepSize(quantity, constraints.stepSize)) {
    errors.push({
      field: "quantity",
      message: `Quantity must be a multiple of ${constraints.stepSize} ${baseAsset}`,
      code: "STEP_SIZE"
    });
  }

  // Check balance based on sideEffectType
  if (sideEffectType === 'MARGIN_BUY') {
    // Allow borrowing base asset to sell (short selling)
    const requiredBorrow = Math.max(0, quantity - availableBaseBalance);
    if (maxBorrowableBase !== null && maxBorrowableBase !== undefined) {
      if (requiredBorrow > maxBorrowableBase) {
        errors.push({
          field: "quantity",
          message: `Order exceeds maximum borrowable amount. Max borrowable: ${maxBorrowableBase.toFixed(8)} ${baseAsset}`,
          code: "EXCEEDS_MAX_BORROWABLE"
        });
      }
    }
  } else if (sideEffectType === 'AUTO_REPAY') {
    // Allow selling more than available balance (will auto-repay debt)
    // Still validate against max quantity constraints above
  } else {
    // Standard balance validation (NO_SIDE_EFFECT)
    if (quantity > availableBaseBalance) {
      errors.push({
        field: "quantity",
        message: `Insufficient ${baseAsset} balance. Available: ${availableBaseBalance.toFixed(8)} ${baseAsset}`,
        code: "INSUFFICIENT_BALANCE"
      });
    }
  }
}

function validateLimitOrder(
  orderData: TradingFormData & { type: "LIMIT" },
  context: ValidationContext,
  errors: ValidationError[]
) {
  const { baseAsset, quoteAsset, constraints, baseBalance, quoteBalance } = context;

  const quantity = parseFloat(orderData.quantity);
  const price = parseFloat(orderData.price);
  
  if (!quantity || quantity <= 0) {
    errors.push({
      field: "quantity",
      message: "Please enter a valid quantity.",
      code: "INVALID_QUANTITY"
    });
  }

  if (!price || price <= 0) {
    errors.push({
      field: "price",
      message: "Please enter a valid price.",
      code: "INVALID_PRICE"
    });
  }

  if (!quantity || !price) return;

  // Validate quantity constraints (same as market orders)
  if (constraints?.minQty && quantity < constraints.minQty) {
    errors.push({
      field: "quantity",
      message: `Minimum quantity is ${constraints.minQty} ${baseAsset}`,
      code: "MIN_QUANTITY"
    });
  }

  if (constraints?.maxQty && quantity > constraints.maxQty) {
    errors.push({
      field: "quantity",
      message: `Maximum quantity is ${constraints.maxQty} ${baseAsset}`,
      code: "MAX_QUANTITY"
    });
  }

  if (constraints?.stepSize && !isValidStepSize(quantity, constraints.stepSize)) {
    errors.push({
      field: "quantity",
      message: `Quantity must be a multiple of ${constraints.stepSize} ${baseAsset}`,
      code: "STEP_SIZE"
    });
  }

  // Validate price constraints
  if (constraints?.minPrice && price < constraints.minPrice) {
    errors.push({
      field: "price",
      message: `Minimum price is ${constraints.minPrice} ${quoteAsset}`,
      code: "MIN_PRICE"
    });
  }

  if (constraints?.maxPrice && price > constraints.maxPrice) {
    errors.push({
      field: "price",
      message: `Maximum price is ${constraints.maxPrice} ${quoteAsset}`,
      code: "MAX_PRICE"
    });
  }

  if (constraints?.tickSize && !isValidStepSize(price, constraints.tickSize)) {
    errors.push({
      field: "price",
      message: `Price must be a multiple of ${constraints.tickSize} ${quoteAsset}`,
      code: "TICK_SIZE"
    });
  }

  // Check minimum notional
  if (constraints?.minNotional && !validateMinNotional(quantity, price, constraints.minNotional)) {
    errors.push({
      field: "quantity",
      message: `Order value (${(quantity * price).toFixed(2)} ${quoteAsset}) is below minimum (${constraints.minNotional.toFixed(2)} ${quoteAsset})`,
      code: "MIN_NOTIONAL"
    });
  }

  // Check sufficient balance based on side and sideEffectType
  if (orderData.side === "BUY") {
    const totalCost = quantity * price;
    const availableQuoteBalance = quoteBalance ? parseFloat(quoteBalance.free) : 0;
    const { sideEffectType, maxBorrowableQuote } = context;
    
    if (sideEffectType === 'MARGIN_BUY') {
      // Skip balance check, validate against max borrowable
      const requiredBorrow = Math.max(0, totalCost - availableQuoteBalance);
      if (maxBorrowableQuote !== null && maxBorrowableQuote !== undefined) {
        if (requiredBorrow > maxBorrowableQuote) {
          errors.push({
            field: "quantity",
            message: `Order exceeds maximum borrowable amount. Max borrowable: ${maxBorrowableQuote.toFixed(2)} ${quoteAsset}`,
            code: "EXCEEDS_MAX_BORROWABLE"
          });
        }
      }
    } else {
      // Standard balance validation (NO_SIDE_EFFECT or AUTO_REPAY)
      if (totalCost > availableQuoteBalance) {
        errors.push({
          field: "quantity",
          message: `Insufficient ${quoteAsset} balance. Need: ${totalCost.toFixed(2)} ${quoteAsset}, Available: ${availableQuoteBalance.toFixed(2)} ${quoteAsset}`,
          code: "INSUFFICIENT_BALANCE"
        });
      }
    }
  } else {
    const availableBaseBalance = baseBalance ? parseFloat(baseBalance.free) : 0;
    const { sideEffectType } = context;
    
    if (sideEffectType === 'AUTO_REPAY') {
      // Allow selling more than available balance (will auto-repay debt)
      // Still validate against max quantity constraints above
    } else {
      // Standard balance validation (NO_SIDE_EFFECT or MARGIN_BUY)
      if (quantity > availableBaseBalance) {
        errors.push({
          field: "quantity",
          message: `Insufficient ${baseAsset} balance. Available: ${availableBaseBalance.toFixed(8)} ${baseAsset}`,
          code: "INSUFFICIENT_BALANCE"
        });
      }
    }
  }
}
