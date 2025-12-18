/**
 * Binance Feature Exports
 * 
 * ⚠️ WARNING: This file re-exports server-only SDK code that requires Node.js modules.
 * 
 * BEST PRACTICES:
 * - For CLIENT components: import from '@/features/binance/client'
 * - For SERVER components/actions: import from '@/features/binance/server'
 * - This file exists for backward compatibility with server code only
 * 
 * Production-grade SDK for Binance trading operations:
 * - Spot & Margin trading
 * - Real-time WebSocket price streams
 * - Market data queries
 * - Type-safe validation with Zod
 * - Server actions for backend operations
 * - React Query hooks for UI integration
 * - Utility functions for calculations
 */

// For backward compatibility with existing server code
// This re-exports everything including Node.js SDK
// Only import this in SERVER components or server actions!
export * from "./server";
