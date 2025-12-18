/**
 * Binance Feature - Usage Examples
 * 
 * Real-world examples of using the Binance feature.
 */

import {
    usePlaceOrderMutation,
    useClosePositionMutation,
    useRealtimePrice,
    useSpotBalanceQuery,
    useMarginBalanceQuery,
    useTradingCalculator,
    calculateStopLossPrice,
    formatCurrency,
    formatPercent,
} from "@/features/binance/client";

// ============================================================================
// Example 1: Simple Buy Order
// ============================================================================

export function SimpleBuyExample() {
    const { mutate: placeOrder, isLoading } = usePlaceOrderMutation({
        onSuccess: (data) => {
            console.log("Order placed successfully:", data.orderId);
        },
    });

    const handleBuyBTC = () => {
        placeOrder({
            exchangeId: "your-exchange-id",
            symbol: "BTCUSDT",
            side: "BUY",
            type: "MARKET",
            accountType: "SPOT",
            quoteOrderQty: "100", // Spend $100 USDT
        });
    };

    return (
        <button onClick={handleBuyBTC} disabled={isLoading}>
            {isLoading ? "Placing order..." : "Buy $100 of BTC"}
        </button>
    );
}

// ============================================================================
// Example 2: Trading with Real-time Price
// ============================================================================

export function TradingWithPriceExample({ exchangeId }: { exchangeId: string }) {
    const { price, isLive, isLoading } = useRealtimePrice("BTCUSDT", {
        exchangeId,
    });

    const { mutate: placeOrder } = usePlaceOrderMutation();

    const handleTrade = (quantity: string) => {
        if (!price) return;

        placeOrder({
            exchangeId,
            symbol: "BTCUSDT",
            side: "BUY",
            type: "LIMIT",
            accountType: "SPOT",
            quantity,
            price, // Use current real-time price
        });
    };

    return (
        <div>
            <div className="price-display">
                <span>BTC Price: ${price}</span>
                {isLive && <span className="live-badge">🔴 LIVE</span>}
            </div>
            <button onClick={() => handleTrade("0.001")}>
                Buy 0.001 BTC at ${price}
            </button>
        </div>
    );
}

// ============================================================================
// Example 3: Balance Check Before Trading
// ============================================================================

export function BalanceCheckExample({ exchangeId }: { exchangeId: string }) {
    const { data: balance } = useSpotBalanceQuery({ exchangeId });
    const { mutate: placeOrder } = usePlaceOrderMutation();

    const usdtBalance = balance?.balances.find((b) => b.asset === "USDT");
    const availableUSDT = parseFloat(usdtBalance?.free || "0");

    const handleTrade = (amount: number) => {
        // Check if enough balance
        if (availableUSDT < amount) {
            alert(`Insufficient balance. Available: $${availableUSDT.toFixed(2)}`);
            return;
        }

        placeOrder({
            exchangeId,
            symbol: "BTCUSDT",
            side: "BUY",
            type: "MARKET",
            accountType: "SPOT",
            quoteOrderQty: amount.toString(),
        });
    };

    return (
        <div>
            <p>Available USDT: ${availableUSDT.toFixed(2)}</p>
            <button onClick={() => handleTrade(100)}>Buy $100 BTC</button>
            <button onClick={() => handleTrade(500)}>Buy $500 BTC</button>
        </div>
    );
}

// ============================================================================
// Example 4: Close Position
// ============================================================================

export function ClosePositionExample({ positionId }: { positionId: string }) {
    const { mutate: closePosition, isLoading } = useClosePositionMutation({
        onSuccess: () => {
            alert("Position closed successfully!");
        },
    });

    const handleClose = () => {
        if (confirm("Are you sure you want to close this position?")) {
            closePosition({
                positionId,
                sideEffectType: "AUTO_REPAY", // For margin positions
            });
        }
    };

    return (
        <button onClick={handleClose} disabled={isLoading}>
            {isLoading ? "Closing..." : "Close Position"}
        </button>
    );
}

// ============================================================================
// Example 5: Trading Calculator
// ============================================================================

export function TradingCalculatorExample() {
    const entryPrice = 50000;
    const quantity = 0.1;

    const calculations = useTradingCalculator({
        entryPrice,
        quantity,
        side: "LONG",
        stopLossPercent: 2, // 2% stop loss
        takeProfitPercent: 5, // 5% take profit
    });

    return (
        <div className="trading-calculator">
            <h3>Trade Analysis</h3>
            <div>Entry Price: {formatCurrency(entryPrice)}</div>
            <div>Quantity: {quantity} BTC</div>
            <div>
                Stop Loss: {formatCurrency(calculations.stopLossPrice || 0)} (
                {formatPercent(-2)})
            </div>
            <div>
                Take Profit: {formatCurrency(calculations.takeProfitPrice || 0)} (
                {formatPercent(5)})
            </div>
            <div>
                Potential PnL: {formatCurrency(calculations.potentialPnL || 0)} (
                {formatPercent(calculations.potentialPnLPercent || 0)})
            </div>
            <div>
                Risk/Reward Ratio: {calculations.riskRewardRatio?.toFixed(2) || "N/A"}
            </div>
        </div>
    );
}

// ============================================================================
// Example 6: Margin Trading with Health Monitoring
// ============================================================================

export function MarginTradingExample({ exchangeId }: { exchangeId: string }) {
    const { data: marginBalance } = useMarginBalanceQuery({ exchangeId });
    const { mutate: placeOrder } = usePlaceOrderMutation();

    const marginLevel = parseFloat(marginBalance?.marginLevel || "0");
    const isHealthy = marginLevel >= 2.0;

    const handleMarginTrade = () => {
        if (!isHealthy) {
            alert("Warning: Low margin level. Add collateral before trading!");
            return;
        }

        placeOrder({
            exchangeId,
            symbol: "BTCUSDT",
            side: "BUY",
            type: "MARKET",
            accountType: "MARGIN",
            quoteOrderQty: "1000",
            sideEffectType: "MARGIN_BUY", // Auto-borrow if needed
        });
    };

    return (
        <div>
            <div className={`margin-health ${isHealthy ? "healthy" : "warning"}`}>
                Margin Level: {marginLevel.toFixed(2)}
                {!isHealthy && " ⚠️ Low!"}
            </div>
            <button onClick={handleMarginTrade} disabled={!isHealthy}>
                Place Margin Trade
            </button>
        </div>
    );
}

// ============================================================================
// Example 7: Complete Trading Interface
// ============================================================================

export function CompleteTradingInterface({ exchangeId }: { exchangeId: string }) {
    const symbol = "BTCUSDT";

    // Real-time price
    const { price, isLive } = useRealtimePrice(symbol, { exchangeId });

    // Balances
    const { data: spotBalance } = useSpotBalanceQuery({ exchangeId });
    const { data: marginBalance } = useMarginBalanceQuery({ exchangeId });

    // Trading
    const { mutate: placeOrder, isLoading } = usePlaceOrderMutation();

    // Calculations
    const calcs = useTradingCalculator({
        entryPrice: parseFloat(price || "0"),
        quantity: 0.01,
        side: "LONG",
        stopLossPercent: 2,
        takeProfitPercent: 4,
    });

    const usdtBalance = spotBalance?.balances.find((b) => b.asset === "USDT");

    const handleBuy = () => {
        placeOrder({
            exchangeId,
            symbol,
            side: "BUY",
            type: "MARKET",
            accountType: "SPOT",
            quoteOrderQty: "100",
        });
    };

    return (
        <div className="trading-interface">
            {/* Price Section */}
            <section className="price-section">
                <h2>
                    BTC/USDT {isLive && <span className="live">🔴</span>}
                </h2>
                <div className="price">${price}</div>
            </section>

            {/* Balance Section */}
            <section className="balance-section">
                <div>Spot USDT: {usdtBalance?.free}</div>
                <div>Margin Level: {marginBalance?.marginLevel}</div>
            </section>

            {/* Calculator Section */}
            <section className="calculator-section">
                <h3>Trade Calculator</h3>
                <div>Stop Loss: ${calcs.stopLossPrice?.toFixed(2)}</div>
                <div>Take Profit: ${calcs.takeProfitPrice?.toFixed(2)}</div>
                <div>R/R: {calcs.riskRewardRatio?.toFixed(2)}</div>
            </section>

            {/* Action Section */}
            <section className="actions">
                <button onClick={handleBuy} disabled={isLoading}>
                    {isLoading ? "Processing..." : "Buy BTC"}
                </button>
            </section>
        </div>
    );
}
