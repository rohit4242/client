export async function register() {
    // Only run on the server side (Node.js runtime)
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        try {
            // Dynamically import the stream manager
            const { binanceStreamManager } = await import('@/services/binance-stream');

            // Initialize streams for all active users
            await binanceStreamManager.initializeAllActiveStreams();

            console.log('[Instrumentation] Binance Stream Manager initialized');
        } catch (error) {
            console.error('[Instrumentation] Failed to initialize Binance Stream Manager:', error);
        }
    }
}
