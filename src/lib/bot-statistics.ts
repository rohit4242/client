import { BotPerformanceMetrics, BotTrade } from "@/types/signal-bot";

/**
 * Calculate performance metrics for a bot based on its trade history
 * @param trades List of bot trades (completed and open)
 * @returns BotPerformanceMetrics object
 */
export function calculateBotStats(trades: BotTrade[]): BotPerformanceMetrics {
    // Filter for closed trades only for most stats
    const closedTrades = trades.filter(
        (t) => t.status === "Closed" && t.exitPrice !== null && t.exitPrice !== undefined
    );

    const totalTrades = closedTrades.length;

    if (totalTrades === 0) {
        return {
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            winRate: 0,
            totalPnl: 0,
            averageWin: 0,
            averageLoss: 0,
            profitFactor: 0,
        };
    }

    let winningTrades = 0;
    let losingTrades = 0;
    let grossProfit = 0;
    let grossLoss = 0;
    let totalPnl = 0;

    closedTrades.forEach((trade) => {
        const profit = trade.profit || 0;
        totalPnl += profit;

        if (profit > 0) {
            winningTrades++;
            grossProfit += profit;
        } else {
            losingTrades++;
            grossLoss += Math.abs(profit);
        }
    });

    const winRate = (winningTrades / totalTrades) * 100;
    const averageWin = winningTrades > 0 ? grossProfit / winningTrades : 0;
    const averageLoss = losingTrades > 0 ? (grossLoss / losingTrades) * -1 : 0; // Represent as negative number

    // Profit Factor = Gross Profit / Gross Loss
    // If Gross Loss is 0, Profit Factor is typically undefined or infinity. 
    // We'll handle it by returning Gross Profit if Loss is 0, or a high number/capped number if preferred.
    // Standard practice: if loss is 0, PF is undefined or strictly speaking infinite. 
    // Let's return grossProfit if loss is 0 (or maybe 0 if no profit either). 
    // Another common approach in bot UIs is to show a high value or just 0 if no trades.

    let profitFactor = 0;
    if (grossLoss > 0) {
        profitFactor = grossProfit / grossLoss;
    } else if (grossProfit > 0) {
        profitFactor = 999; // Or some indicator for "Infinite"
    }

    return {
        totalTrades,
        winningTrades,
        losingTrades,
        winRate,
        totalPnl,
        averageWin,
        averageLoss,
        profitFactor,
    };
}
