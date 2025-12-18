/**
 * Binance Feature - README
 * 
 * Production-grade Binance trading integration with SDK, server actions, and React Query hooks.
 */

# Binance Trading Feature

A complete, production-ready Binance trading integration with:
- 🔧 Reusable SDK layer
- ✅ Zod validation throughout
- 🚀 Server actions for backend operations
- ⚡ React Query hooks for UI
- 🔴 Real-time WebSocket price streams
- 💯 100% type-safe

---

## 📁 Structure

```
features/binance/
├── sdk/                    # Core Binance SDK
│   ├── client.ts          # Client management & error handling
│   ├── spot.ts            # Spot trading operations
│   ├── margin.ts          # Margin trading operations
│   ├── market.ts          # Market data queries
│   ├── websocket.ts       # Real-time WebSocket streams
│   └── index.ts
│
├── schemas/               # Zod validation schemas
│   ├── order.schema.ts
│   ├── balance.schema.ts
│   ├── market.schema.ts
│   └── index.ts
│
├── actions/               # Server actions
│   ├── spot/             # Spot trading
│   ├── margin/           # Margin trading
│   ├── position/         # Position management
│   ├── market/           # Market data
│   └── index.ts
│
├── hooks/                # React Query hooks
│   ├── queries/         # Data fetching
│   ├── mutations/       # Data mutations
│   └── index.ts
│
└── index.ts             # Main export
```

---

## 🚀 Quick Start

### 1. Place an Order

```typescript
import { usePlaceOrderMutation } from "@/features/binance";

function TradingForm() {
  const { mutate, isLoading } = usePlaceOrderMutation({
    onSuccess: (data) => {
      console.log("Order placed:", data.orderId);
    },
  });

  const handleBuy = () => {
    mutate({
      exchangeId: "your-exchange-id",
      symbol: "BTCUSDT",
      side: "BUY",
      type: "MARKET",
      accountType: "SPOT", // or "MARGIN"
      quoteOrderQty: "100", // Spend $100 USDT
    });
  };

  return (
    <button onClick={handleBuy} disabled={isLoading}>
      Buy BTC
    </button>
  );
}
```

### 2. Get Real-time Prices

```typescript
import { useRealtimePrice } from "@/features/binance";

function PriceDisplay({ symbol, exchangeId }: Props) {
  const { price, isLive, isLoading } = useRealtimePrice(symbol, {
    exchangeId,
  });

  return (
    <div>
      <span className="price">${price}</span>
      {isLive && <span className="live-badge">🔴 LIVE</span>}
    </div>
  );
}
```

### 3. Close a Position

```typescript
import { useClosePositionMutation } from "@/features/binance";

function PositionCard({ position }: Props) {
  const { mutate, isLoading } = useClosePositionMutation();

  const handleClose = () => {
    mutate({
      positionId: position.id,
      sideEffectType: "AUTO_REPAY", // For margin positions
    });
  };

  return (
    <button onClick={handleClose} disabled={isLoading}>
      Close Position
    </button>
  );
}
```

### 4. Get Balances

```typescript
import { 
  useSpotBalanceQuery, 
  useMarginBalanceQuery 
} from "@/features/binance";

function BalanceDisplay({ exchangeId }: Props) {
  // Spot balance
  const { data: spotData } = useSpotBalanceQuery({ exchangeId });
  const usdtBalance = spotData?.balances.find(b => b.asset === "USDT");

  // Margin balance
  const { data: marginData } = useMarginBalanceQuery({ exchangeId });
  const marginLevel = parseFloat(marginData?.marginLevel ?? "0");

  return (
    <div>
      <div>Spot USDT: {usdtBalance?.free}</div>
      <div>Margin Level: {marginLevel.toFixed(2)}</div>
    </div>
  );
}
```

---

## 📚 Available Hooks

### Queries (Data Fetching)

| Hook | Purpose | Cache Time |
|------|---------|------------|
| `useRealtimePrice()` | Real-time price via WebSocket | 2s stale, 5s refetch |
| `useSpotBalanceQuery()` | Spot account balance | 10s stale, 30s refetch |
| `useMarginBalanceQuery()` | Margin account info | 10s stale, 30s refetch |
| `useSymbolInfoQuery()` | Trading rules & filters | 1h stale, no refetch |
| `useMaxBorrowableQuery()` | Max borrowable amount | 30s stale, 60s refetch |

### Mutations (Data Updates)

| Hook | Purpose | Features |
|------|---------|----------|
| `usePlaceOrderMutation()` | Place spot/margin orders | Auto account type, toast notifications |
| `useClosePositionMutation()` | Close positions | PnL calculation, cache invalidation |

---

## 🔧 SDK Layer

For advanced use cases, you can use the SDK directly:

```typescript
import { 
  createSpotClient,
  placeSpotMarketOrder,
  getSpotBalance 
} from "@/features/binance/sdk";

// In a server action or API route
const client = createSpotClient({
  apiKey: exchange.apiKey,
  apiSecret: exchange.apiSecret,
});

const result = await placeSpotMarketOrder(client, {
  symbol: "BTCUSDT",
  side: "BUY",
  quoteOrderQty: "100",
});

if (result.success) {
  console.log("Order ID:", result.data.orderId);
} else {
  console.error("Error:", result.error);
}
```

---

## ✅ Features

### Trading
- ✅ Place spot market/limit orders
- ✅ Place margin market/limit orders
- ✅ Auto-borrow for margin trading
- ✅ Close positions (spot + margin)
- ✅ Automatic PnL calculation
- ✅ Database order tracking

### Balance Management
- ✅ Real-time spot balance
- ✅ Margin account info
- ✅ Health factor tracking
- ✅ Max borrowable queries
- ✅ Smart caching (10-30s)

### Market Data
- ✅ Real-time prices via WebSocket
- ✅ REST API fallback
- ✅ Symbol trading rules
- ✅ Price/quantity formatters
- ✅ Min notional validation

### Developer Experience
- ✅ 100% type-safe
- ✅ Centralized error handling
- ✅ User-friendly error messages
- ✅ Toast notifications
- ✅ Auto-complete everywhere
- ✅ Smart cache invalidation

---

## 🎯 Best Practices

### 1. Always Handle Errors

```typescript
const { mutate } = usePlaceOrderMutation({
  onError: (error) => {
    // Handle error - already shows toast
    console.error(error);
  },
});
```

### 2. Check Balance Before Trading

```typescript
const { data: balance } = useSpotBalanceQuery({ exchangeId });
const usdtFree = parseFloat(
  balance?.balances.find(b => b.asset === "USDT")?.free ?? "0"
);

if (usdtFree < tradeAmount) {
  toast.error("Insufficient balance");
  return;
}
```

### 3. Use Symbol Info for Validation

```typescript
const { data: symbolInfo } = useSymbolInfoQuery({ 
  exchangeId, 
  symbol: "BTCUSDT" 
});

// Get min notional
const minNotional = symbolInfo?.filters
  .find(f => f.filterType === "MIN_NOTIONAL")?.minNotional;
```

### 4. Monitor Margin Health

```typescript
const { data: marginData } = useMarginBalanceQuery({ exchangeId });
const marginLevel = parseFloat(marginData?.marginLevel ?? "0");

if (marginLevel < 1.5) {
  toast.warning("Low margin level - risk of liquidation!");
}
```

---

## 🔐 Security

- ✅ All actions require authentication
- ✅ User ownership validation
- ✅ Binance API keys encrypted in database
- ✅ Rate limiting via Binance SDK
- ✅ Input validation with Zod

---

## 📊 Performance

- ✅ Smart caching (React Cache + React Query)
- ✅ WebSocket for real-time data (no polling)
- ✅ Background refetching
- ✅ Optimistic updates
- ✅ Request deduplication

---

## 🐛 Error Handling

### Common Errors

| Error Code | Message | Solution |
|------------|---------|----------|
| -1013 | Invalid quantity | Check symbol filters |
| -2010 | Insufficient balance | Add funds or reduce quantity |
| -1121 | Invalid symbol | Verify symbol format (e.g., BTCUSDT) |

### Error Messages

All errors are automatically converted to user-friendly messages:

```typescript
// Binance API Error: -2010
// ❌ Displays: "Insufficient balance"

// Binance API Error: -1013
// ❌ Displays: "Invalid quantity - check symbol filters"
```

---

## 🚧 Roadmap

- [ ] Add protective orders (SL/TP)
- [ ] Add order cancellation
- [ ] Add 24h ticker queries
- [ ] Add order book queries
- [ ] Add trade history
- [ ] Add more account types (isolated margin)

---

## 📖 Learn More

- [Binance API Documentation](https://binance-docs.github.io/apidocs/spot/en/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Zod Documentation](https://zod.dev/)

---

**Built with ❤️ for production trading**
