export async function register() {
    // Only run on the server side (Node.js runtime)
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        try {
            // Initialize TP/SL monitoring system
            const { initializeTPSLMonitoring } = await import('@/services/tp-sl-monitor');
            await initializeTPSLMonitoring();

            console.log('******************************************');
            console.log('🚀 TP/SL MONITOR IS ACTIVE AND RUNNING');
            console.log('******************************************');
        } catch (error) {
            console.error('[Instrumentation] Failed to initialize services:', error);
        }
    }
}
