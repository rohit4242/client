import { Spot } from "@binance/spot";
import { createSpotClient } from "@/features/binance/sdk/client";
import { handleExecutionReport } from "@/features/position/services/execution-monitor";

// Interface for active stream session
interface StreamSession {
    listenKey: string;
    ws: WebSocket;
    pingInterval: NodeJS.Timeout;
    reconnectAttempt: number;
    client: Spot; // Store client to renew key
}

// Map to store active user streams: userId -> Session
const userStreams = new Map<string, StreamSession>();

export const binanceStreamManager = {
    /**
     * Start User Data Stream for a specific user
     */
    startStream: async (userId: string, apiKey: string, apiSecret: string) => {
        // If stream already exists, check if it's healthy, otherwise close and recreate
        if (userStreams.has(userId)) {
            console.log(`[Binance Stream] Stream already exists for user ${userId}`);
            return;
        }

        console.log(`[Binance Stream] Starting stream for user ${userId}`);

        try {
            // 1. Initialize Spot Client using helper
            const client = createSpotClient({ apiKey, apiSecret });

            // 2. Create Listen Key
            // @ts-expect-error - Types might be loose for the library or specific version
            const response = await client.createListenKey();
            const listenKey = response.data.listenKey;

            console.log(`[Binance Stream] ListenKey created for ${userId}`);

            // 3. Connect WebSocket
            connectWebSocket(userId, listenKey, client, apiKey, apiSecret);

        } catch (error) {
            console.error(`[Binance Stream] Failed to start stream for user ${userId}:`, error);
        }
    },

    /**
     * Stop Stream for a user
     */
    stopStream: (userId: string) => {
        const session = userStreams.get(userId);
        if (session) {
            console.log(`[Binance Stream] Stopping stream for user ${userId}`);
            clearInterval(session.pingInterval);
            session.ws.close();
            userStreams.delete(userId);
        }
    },

    /**
     * Initialize streams for all users with active positions
     * Call this on server startup
     */
    initializeAllActiveStreams: async () => {
        try {
            // Dynamically import db to avoid circular dependencies if invoked from places importing this
            const { db } = await import("@/lib/db/client");

            console.log("[Binance Stream] Initializing all active streams...");

            // Find active portfolios with Binance exchanges AND active TP/SL positions
            const portfolios = await db.portfolio.findMany({
                where: {
                    positions: {
                        some: {
                            status: "OPEN",
                            OR: [
                                { stopLossOrderId: { not: null } },
                                { takeProfitOrderId: { not: null } }
                            ]
                        }
                    },
                    exchanges: {
                        some: { name: "Binance", isActive: true }
                    }
                },
                include: {
                    exchanges: {
                        where: { name: "Binance", isActive: true },
                        take: 1
                    }
                }
            });

            console.log(`[Binance Stream] Found ${portfolios.length} portfolios with active positions`);

            for (const portfolio of portfolios) {
                const exchange = portfolio.exchanges[0];
                if (exchange && exchange.apiKey && exchange.apiSecret) {
                    await binanceStreamManager.startStream(portfolio.userId, exchange.apiKey, exchange.apiSecret);
                }
            }

        } catch (error) {
            console.error("[Binance Stream] Failed to initialize active streams:", error);
        }
    }
};

/**
 * Internal function to manage WebSocket connection and reconnection
 */
function connectWebSocket(
    userId: string,
    listenKey: string,
    client: Spot,
    apiKey: string, // Needed for potential given logic
    apiSecret: string
) {
    const wsUrl = `wss://stream.binance.com:9443/ws/${listenKey}`;
    const ws = new WebSocket(wsUrl);

    // Setup Keep-alive (ping listenKey every 30 mins)
    const pingInterval = setInterval(async () => {
        try {
            console.log(`[Binance Stream] Pinging ListenKey for ${userId}`);
            // @ts-expect-error - TS might miss the method definition
            await client.renewListenKey(listenKey);
        } catch (error) {
            console.error(`[Binance Stream] Failed to ping ListenKey for ${userId}`, error);
        }
    }, 30 * 60 * 1000); // 30 minutes

    const session: StreamSession = {
        listenKey,
        ws,
        pingInterval,
        reconnectAttempt: 0,
        client
    };

    userStreams.set(userId, session);

    ws.onopen = () => {
        console.log(`[Binance Stream] WebSocket Connected for user ${userId}`);
        session.reconnectAttempt = 0;
    };

    ws.onmessage = async (event) => {
        try {
            const data = JSON.parse(event.data.toString());
            // We only care about executionReport
            if (data.e === 'executionReport') {
                await handleExecutionReport(userId, data);
            }
        } catch (error) {
            console.error(`[Binance Stream] Error parsing message for user ${userId}`, error);
        }
    };

    ws.onclose = () => {
        console.log(`[Binance Stream] WebSocket Closed for user ${userId}`);
        clearInterval(session.pingInterval);

        // Remove from map
        userStreams.delete(userId);

        // Simple reconnection logic
        setTimeout(() => {
            console.log(`[Binance Stream] Attempting to reconnect for user ${userId}`);
            binanceStreamManager.startStream(userId, apiKey, apiSecret);
        }, 5000);
    };

    ws.onerror = (error) => {
        console.error(`[Binance Stream] WebSocket Error for user ${userId}`, error);
    };
}
