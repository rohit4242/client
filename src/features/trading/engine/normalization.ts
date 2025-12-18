/**
 * Trading Engine - Request Normalization
 * 
 * Converts signal actions (ENTER_LONG, EXIT_LONG) to standard BUY/SELL format
 * so both manual and signal requests can be processed uniformly.
 */

import type { TradingRequest, NormalizedTradingRequest, SignalAction } from "../types/trading.types";

/**
 * Convert signal action to BUY/SELL side
 */
function signalActionToSide(action: SignalAction): "BUY" | "SELL" {
    switch (action) {
        case "ENTER_LONG":
            return "BUY";
        case "EXIT_LONG":
            return "SELL";
        case "ENTER_SHORT":
            return "SELL"; // Short = sell first
        case "EXIT_SHORT":
            return "BUY"; // Cover short = buy back
        default:
            throw new Error(`Unknown signal action: ${action}`);
    }
}

/**
 * Normalize trading request
 * Converts webhook signal format to standard manual trading format
 * 
 * @param request - Trading request (manual or signal)
 * @returns Normalized request with side always populated
 */
export function normalizeRequest(
    request: TradingRequest
): NormalizedTradingRequest {
    // If side already provided (manual trading), just return as-is
    if (request.order.side) {
        return request as NormalizedTradingRequest;
    }

    // Convert signal action to side
    if (!request.order.action) {
        throw new Error("Either 'side' or 'action' must be provided in order");
    }

    const side = signalActionToSide(request.order.action);

    return {
        ...request,
        order: {
            ...request.order,
            side,
        },
    } as NormalizedTradingRequest;
}

/**
 * Determine if action is entry or exit
 */
export function isEntryAction(action?: SignalAction, side?: "BUY" | "SELL"): boolean {
    if (action) {
        return action === "ENTER_LONG" || action === "ENTER_SHORT";
    }
    // For manual trading, we'll need additional context (e.g., existing positions)
    // This is a simplified check
    return true;
}

/**
 * Determine position side from order
 */
export function determinePositionSide(side: "BUY" | "SELL", action?: SignalAction): "LONG" | "SHORT" {
    if (action) {
        return action.includes("LONG") ? "LONG" : "SHORT";
    }
    // For manual trading, BUY = LONG, SELL = SHORT (simplified)
    return side === "BUY" ? "LONG" : "SHORT";
}
