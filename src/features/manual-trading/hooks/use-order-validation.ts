/**
 * Manual Trading Feature - Order Validation Hook
 * 
 * Hook for managing order validation state
 */

import { useState, useEffect, useCallback } from "react";
import type {
    OrderFormData,
    ValidationContext,
    ValidationError,
    ValidationResult,
} from "../types/manual-trading.types";
import { validateOrder } from "../lib/validation-rules";

interface UseOrderValidationParams {
    orderData: OrderFormData;
    context: ValidationContext;
    enabled?: boolean;
}

interface UseOrderValidationResult {
    errors: ValidationError[];
    warnings: string[];
    isValid: boolean;
    clearErrors: () => void;
    validate: () => ValidationResult;
}

export function useOrderValidation({
    orderData,
    context,
    enabled = true,
}: UseOrderValidationParams): UseOrderValidationResult {
    const [errors, setErrors] = useState<ValidationError[]>([]);
    const [warnings, setWarnings] = useState<string[]>([]);

    const clearErrors = useCallback(() => {
        setErrors([]);
        setWarnings([]);
    }, []);

    const validate = useCallback((): ValidationResult => {
        if (!enabled) {
            return { isValid: true, errors: [], warnings: [] };
        }

        const result = validateOrder(orderData, context);
        setErrors(result.errors);
        setWarnings(result.warnings);
        return result;
    }, [orderData, context, enabled]);

    // Auto-clear errors when form data changes (optional behavior)
    useEffect(() => {
        if (errors.length > 0 || warnings.length > 0) {
            clearErrors();
        }
    }, [orderData.symbol, orderData.side, orderData.type]); // Only clear on major changes

    return {
        errors,
        warnings,
        isValid: errors.length === 0,
        clearErrors,
        validate,
    };
}
