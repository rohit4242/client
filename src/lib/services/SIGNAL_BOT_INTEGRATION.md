# Signal Bot Integration Guide

This guide shows how the signal bot can use the new order service for executing trades.

## Current Implementation

The signal bot currently uses:
```
Webhook → processSignal() → Trade Executor → Binance API
```

## New Service Integration

The signal bot can now use the unified order service:

### Option 1: Via API Route (Recommended for external webhooks)

```typescript
// In webhook handler
const response = await fetch('/api/trading/order', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    exchange: bot.exchange,
    order: {
      symbol: signal.symbol,
      side: signal.action === 'ENTER_LONG' ? 'BUY' : 'SELL',
      type: bot.orderType,
      quantity: calculatedQuantity,
    },
    userId: bot.portfolio.userId,
    portfolioId: bot.portfolioId,
  }),
});
```

### Option 2: Direct Service Call (Recommended for internal processing)

```typescript
import { executeOrder } from '@/lib/services/order-service';

// In signal processor
async function executeSignalTrade(signal, bot) {
  const result = await executeOrder({
    userId: bot.portfolio.userId,
    portfolioId: bot.portfolioId,
    exchange: bot.exchange,
    accountType: bot.accountType === 'SPOT' ? 'spot' : 'margin',
    order: {
      symbol: signal.symbol,
      side: determineSide(signal.action),
      type: bot.orderType,
      quantity: calculateQuantity(bot, signal),
      sideEffectType: bot.sideEffectType,
    },
    source: 'SIGNAL_BOT',
  });

  if (result.success) {
    console.log('Signal executed:', result.positionId);
    return result;
  } else {
    console.error('Signal failed:', result.error);
    throw new Error(result.error);
  }
}
```

## Benefits of Using New Service

1. **Consistency**: Same validation and execution logic as manual trading
2. **Simplicity**: No need to duplicate position creation and update logic
3. **Error Handling**: Unified error handling and cleanup
4. **Maintainability**: Updates to service benefit both manual and automated trading
5. **Auditability**: All trades go through same service layer

## Example: Complete Signal Bot Integration

```typescript
import { executeOrder } from '@/lib/services/order-service';
import { calculatePositionSize } from '@/lib/signal-bot/position-calculator';

export async function processSignalWithService(signalId: string) {
  // Get signal and bot
  const signal = await db.signal.findUnique({
    where: { id: signalId },
    include: {
      bot: {
        include: {
          exchange: true,
          portfolio: true,
        },
      },
    },
  });

  if (!signal || !signal.bot) {
    throw new Error('Signal or bot not found');
  }

  const bot = signal.bot;

  // Calculate position size based on bot configuration
  const positionSize = calculatePositionSize(
    bot.positionPercent,
    bot.portfolio.totalValue,
    signal.price || 0
  );

  // Determine order side
  const side = 
    signal.action === 'ENTER_LONG' ? 'BUY' :
    signal.action === 'EXIT_LONG' ? 'SELL' :
    signal.action === 'ENTER_SHORT' ? 'SELL' :
    'BUY'; // EXIT_SHORT

  // Execute order using service
  const result = await executeOrder({
    userId: bot.portfolio.userId,
    portfolioId: bot.portfolioId,
    exchange: bot.exchange,
    accountType: bot.accountType === 'SPOT' ? 'spot' : 'margin',
    order: {
      symbol: signal.symbol,
      side,
      type: bot.orderType,
      quantity: positionSize.quantity,
      price: bot.orderType === 'LIMIT' ? signal.price?.toString() : undefined,
      sideEffectType: bot.sideEffectType,
    },
    source: 'SIGNAL_BOT',
  });

  // Update signal with result
  await db.signal.update({
    where: { id: signalId },
    data: {
      processed: true,
      error: result.success ? null : result.error,
    },
  });

  // Update bot stats if needed
  if (result.success) {
    await db.bot.update({
      where: { id: bot.id },
      data: {
        totalTrades: { increment: 1 },
      },
    });
  }

  return result;
}
```

## Migration Path

Current signal bot implementation can continue to work as-is. The new service provides an alternative for:

1. New signal bot implementations
2. Refactoring existing trade executors
3. Custom automation scripts
4. Direct API integrations

## Testing

To test signal bot with new service:

```bash
# Send test signal via API
curl -X POST http://localhost:3000/api/webhook/signal-bot \
  -H "Content-Type: application/json" \
  -d '{
    "action": "ENTER_LONG",
    "symbol": "BTCUSDT",
    "price": 50000,
    "botId": "your-bot-id",
    "secret": "your-webhook-secret"
  }'
```

The signal will be processed using the existing flow, which can be gradually migrated to use the new service.

