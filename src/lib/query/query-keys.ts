/**
 * Centralized Query Keys for React Query
 * 
 * This file defines all query keys used throughout the application.
 * Following a hierarchical structure for easy invalidation and management.
 * 
 * @example
 * // Use in query hooks
 * useQuery({ queryKey: queryKeys.exchanges.list(), ... })
 * 
 * // Invalidate specific queries
 * queryClient.invalidateQueries({ queryKey: queryKeys.exchanges.list() })
 * 
 * // Invalidate all exchanges queries
 * queryClient.invalidateQueries({ queryKey: queryKeys.exchanges.all() })
 */

export const queryKeys = {
    // Auth
    auth: {
        all: () => ["auth"] as const,
        session: () => [...queryKeys.auth.all(), "session"] as const,
        user: () => [...queryKeys.auth.all(), "user"] as const,
    },

    // Exchanges
    exchanges: {
        all: () => ["exchanges"] as const,
        list: () => [...queryKeys.exchanges.all(), "list"] as const,
        detail: (id: string) => [...queryKeys.exchanges.all(), "detail", id] as const,
    },

    // Portfolio
    portfolio: {
        all: () => ["portfolio"] as const,
        stats: () => [...queryKeys.portfolio.all(), "stats"] as const,
        history: (period: string) => [...queryKeys.portfolio.all(), "history", period] as const,
        balance: () => [...queryKeys.portfolio.all(), "balance"] as const,
    },

    // Positions
    positions: {
        all: () => ["positions"] as const,
        list: (filters?: { status?: string; accountType?: string }) =>
            [...queryKeys.positions.all(), "list", filters] as const,
        detail: (id: string) => [...queryKeys.positions.all(), "detail", id] as const,
        byBot: (botId: string) => [...queryKeys.positions.all(), "byBot", botId] as const,
    },

    // Orders
    orders: {
        all: () => ["orders"] as const,
        list: (positionId?: string) =>
            [...queryKeys.orders.all(), "list", { positionId }] as const,
        detail: (id: string) => [...queryKeys.orders.all(), "detail", id] as const,
    },

    // Signal Bots
    bots: {
        all: () => ["bots"] as const,
        list: (filters?: any) => [...queryKeys.bots.all(), "list", { filters }] as const,
        detail: (id: string) => [...queryKeys.bots.all(), "detail", id] as const,
        positions: (id: string) => [...queryKeys.bots.all(), "positions", id] as const,
        stats: (id: string) => [...queryKeys.bots.all(), "stats", id] as const,
    },

    // Signals
    signals: {
        all: () => ["signals"] as const,
        list: (botId?: string) => [...queryKeys.signals.all(), "list", { botId }] as const,
        detail: (id: string) => [...queryKeys.signals.all(), "detail", id] as const,
    },

    // Margin
    margin: {
        all: () => ["margin"] as const,
        account: () => [...queryKeys.margin.all(), "account"] as const,
        balance: () => [...queryKeys.margin.all(), "balance"] as const,
        maxBorrow: (asset: string) => [...queryKeys.margin.all(), "maxBorrow", asset] as const,
        borrowedAssets: () => [...queryKeys.margin.all(), "borrowedAssets"] as const,
    },

    // Trading
    trading: {
        all: () => ["trading"] as const,
        spotBalance: () => [...queryKeys.trading.all(), "spotBalance"] as const,
        marginBalance: () => [...queryKeys.trading.all(), "marginBalance"] as const,
        symbolInfo: (symbol: string) => [...queryKeys.trading.all(), "symbolInfo", symbol] as const,
        price: (symbol: string) => [...queryKeys.trading.all(), "price", symbol] as const,
    },

    // Users (Admin)
    users: {
        all: () => ["users"] as const,
        list: () => [...queryKeys.users.all(), "list"] as const,
        detail: (id: string) => [...queryKeys.users.all(), "detail", id] as const,
        portfolio: (id: string) => [...queryKeys.users.all(), "portfolio", id] as const,
        orders: (id: string) => [...queryKeys.users.all(), "orders", id] as const,
        positions: (id: string) => [...queryKeys.users.all(), "positions", id] as const,
    },

    // Binance operations
    binance: {
        all: () => ["binance"] as const,
        price: (exchangeId: string, symbol: string) =>
            ["binance", "price", exchangeId, symbol] as const,
        balance: (exchangeId: string, accountType: "SPOT" | "MARGIN") =>
            ["binance", "balance", exchangeId, accountType] as const,
        symbolInfo: (exchangeId: string, symbol: string) =>
            ["binance", "symbol-info", exchangeId, symbol] as const,
    },
} as const;
