# Trading Services

This directory contains the reusable service layer for trading operations.

## Architecture

```
┌─────────────────┐         ┌─────────────────┐
│  Manual Trading │         │   Signal Bot    │
│      (UI)       │         │   (Webhook)     │
└────────┬────────┘         └────────┬────────┘
         │                           │
         └───────────┬───────────────┘
                     │
         ┌───────────▼────────────┐
         │  API Routes (Thin)     │
         └───────────┬────────────┘
                     │
         ┌───────────▼────────────┐
         │  Order Service         │  ← Main orchestrator
         └───────────┬────────────┘
                     │
      ┌──────────────┼──────────────┐
      │              │              │
      ▼              ▼              ▼
 ┌─────────┐  ┌──────────┐  ┌──────────┐
 │Exchange │  │ Position │  │Validators│
 │Services │  │ Service  │  │          │
 └─────────┘  └──────────┘  └──────────┘
```

## Services

### order-service.ts
Main orchestrator for all order operations. Provides a single entry point for executing orders.

**Main Function:**
```typescript
executeOrder(request: OrderRequest): Promise<OrderResult>
```

**Used by:**
- `/api/trading/order` (unified trading API)
- `/api/order/create` (legacy spot API)
- `/api/margin/order/create` (legacy margin API)
- Signal bot webhooks (future)

### position-service.ts
Manages position lifecycle (create, update, close).

**Functions:**
- `createPosition()` - Create new position
- `updatePositionWithExecution()` - Update with exchange execution data
- `closePosition()` - Close position and calculate P&L
- `deletePosition()` - Cleanup failed orders

### exchange/
Exchange-specific implementations for order execution.

**binance-spot.ts:**
- `placeSpotOrder()` - Execute spot orders
- `placeSpotCloseOrder()` - Close spot positions

**binance-margin.ts:**
- `placeMarginOrder()` - Execute margin orders
- `placeMarginCloseOrder()` - Close margin positions
- `getMaxBorrowable()` - Check borrowing limits
- `getMarginAccount()` - Get account details

### validators/
Validation utilities for orders and balances.

**balance-validator.ts:**
- `validateSpotBalance()` - Check spot balance sufficiency
- `validateMarginBalance()` - Check margin balance with borrowing
- `calculateRequiredAmount()` - Calculate order requirements

## Usage Examples

### Manual Trading (UI → API → Service)

```typescript
// In UI component
const response = await fetch('/api/trading/order', {
  method: 'POST',
  body: JSON.stringify({
    exchange: selectedExchange,
    order: {
      symbol: 'BTCUSDT',
      side: 'BUY',
      type: 'MARKET',
      quoteOrderQty: '100',
    },
    userId,
    portfolioId,
  }),
});
```

### Signal Bot (Direct Service Call)

```typescript
import { executeOrder } from '@/lib/services/order-service';

// In signal bot webhook
const result = await executeOrder({
  userId: signal.userId,
  portfolioId: signal.portfolioId,
  exchange: signal.exchange,
  accountType: 'spot',
  order: {
    symbol: signal.symbol,
    side: signal.side,
    type: signal.type,
    quantity: signal.quantity,
  },
  source: 'SIGNAL_BOT',
});

if (result.success) {
  console.log('Order executed:', result.positionId);
}
```

### Automated Trading Script

```typescript
import { executeOrder } from '@/lib/services/order-service';
import { Exchange } from '@/types/exchange';

async function executeStrategy(userId: string, portfolioId: string, exchange: Exchange) {
  // Buy BTC
  const buyResult = await executeOrder({
    userId,
    portfolioId,
    exchange,
    accountType: 'spot',
    order: {
      symbol: 'BTCUSDT',
      side: 'BUY',
      type: 'MARKET',
      quoteOrderQty: '100',
    },
    source: 'SIGNAL_BOT',
  });

  // Sell BTC
  const sellResult = await executeOrder({
    userId,
    portfolioId,
    exchange,
    accountType: 'spot',
    order: {
      symbol: 'BTCUSDT',
      side: 'SELL',
      type: 'MARKET',
      quantity: '0.001',
    },
    source: 'SIGNAL_BOT',
  });
}
```

## Benefits

1. **Reusability**: Same code for manual and automated trading
2. **Maintainability**: Change logic once, affects all callers
3. **Testability**: Services can be unit tested
4. **Consistency**: Orders always follow same flow
5. **Flexibility**: Easy to add new order sources

## Migration

Old API routes (`/api/order/create` and `/api/margin/order/create`) have been updated to use the new service layer internally. They remain functional for backward compatibility but are deprecated.

New code should use `/api/trading/order` or call `executeOrder()` directly.

