# Portfolio Feature

Complete implementation of the Portfolio feature with server actions, React Query hooks, and Zod validation.

## Overview

The Portfolio feature manages user portfolio statistics, balance tracking, and performance analytics. It provides:
- Portfolio statistics (PnL, win rate, trades, etc.)
- Balance tracking (spot + margin)
- Historical data for charts
- Balance synchronization with exchanges

## Architecture

```
portfolio/
├── actions/                      # Server actions
│   ├── get-portfolio.ts          # Fetch full portfolio
│   ├── get-portfolio-stats.ts    # Fetch statistics only
│   ├── get-portfolio-history.ts  # Fetch balance history for charts
│   └── sync-portfolio-balance.ts # Sync balance from exchange
├── hooks/                        # React Query hooks
│   ├── use-portfolio-query.ts    
│   ├── use-portfolio-stats-query.ts
│   ├── use-portfolio-history-query.ts
│   └── use-sync-portfolio-balance-mutation.ts
├── schemas/                      # Zod validation schemas
│   └── portfolio.schema.ts
├── types/                        # TypeScript types
│   └── portfolio.types.ts
├── index.ts                      # Public exports
└── README.md                     # This file
```

## Usage

### Fetching Portfolio

```typescript
import { usePortfolioQuery } from "@/features/portfolio";

function PortfolioDashboard() {
  const { data, isLoading } = usePortfolioQuery();
  const portfolio = data?.portfolio;
  
  if (!portfolio) return <div>No portfolio found</div>;
  
  return (
    <div>
      <h1>{portfolio.name}</h1>
      <p>Balance: ${portfolio.currentBalance.toFixed(2)}</p>
      <p>Total PnL: ${portfolio.totalPnl.toFixed(2)}</p>
    </div>
  );
}
```

### Fetching Portfolio Statistics

```typescript
import { usePortfolioStatsQuery } from "@/features/portfolio";

function PortfolioStats() {
  const { data, isLoading } = usePortfolioStatsQuery();
  const stats = data?.stats;
  
  if (!stats) return null;
  
  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard 
        title="Total PnL" 
        value={`$${stats.totalPnl.toFixed(2)}`}
        change={stats.totalPnlPercent}
      />
      <StatCard 
        title="Win Rate" 
        value={`${stats.winRate.toFixed(1)}%`}
      />
      <StatCard 
        title="Total Trades" 
        value={stats.totalTrades}
      />
      <StatCard 
        title="Active Positions" 
        value={stats.activeTrades}
      />
    </div>
  );
}
```

### Fetching Portfolio History (Charts)

```typescript
import { usePortfolioHistoryQuery } from "@/features/portfolio";
import { LineChart, Line, XAxis, YAxis } from "recharts";

function PortfolioChart() {
  const { data, isLoading } = usePortfolioHistoryQuery({ 
    period: "month" 
  });
  
  const chartData = data?.data ?? [];
  
  return (
    <LineChart width={600} height={300} data={chartData}>
      <XAxis dataKey="date" />
      <YAxis />
      <Line 
        type="monotone" 
        dataKey="value" 
        stroke="#8884d8" 
      />
    </LineChart>
  );
}
```

### Syncing Portfolio Balance

```typescript
import { useSyncPortfolioBalanceMutation } from "@/features/portfolio";

function SyncBalanceButton() {
  const syncMutation = useSyncPortfolioBalanceMutation();
  
  return (
    <button 
      onClick={() => syncMutation.mutate()}
      disabled={syncMutation.isPending}
    >
      {syncMutation.isPending ? "Syncing..." : "Sync Balance"}
    </button>
  );
}
```

## Features

### ✅ Comprehensive Statistics
- Total PnL (profit/loss) and percentage
- Win rate, total wins/losses
- Average win/loss amounts
- Largest win/loss tracking
- Profit factor calculation
- Time-based PnL (daily, weekly, monthly)

### ✅ Multi-Account Support
- Separate spot and margin balances
- Total balance aggregation
- Deposit/withdrawal tracking

### ✅ Historical Data
- Balance snapshots over time
- Configurable time periods (day, week, month, year, all)
- Chart-ready data format
- Percentage change calculations

### ✅ Admin Features
- View any user's portfolio
- Sync balance for customers
- Portfolio management tools

## API Reference

### Hooks

#### `usePortfolioQuery(options?)`
Fetch full portfolio for current user.

**Options:**
- `staleTime?: number` (default: 30s)
- `enabled?: boolean` (default: true)
- `refetchInterval?: number | false` (default: 60s)

**Returns:**
- `data.portfolio` - Full portfolio object or null
- `isLoading` - Loading state
- `error` - Error object

#### `usePortfolioStatsQuery(options?)`
Fetch portfolio statistics only (optimized).

**Options:** Same as usePortfolioQuery but with staleTime default of 10s

**Returns:**
- `data.stats` - Portfolio statistics or null
- Faster than full portfolio query (optimized field selection)

#### `usePortfolioHistoryQuery(input, options?)`
Fetch portfolio history for charts.

**Parameters:**
- `input.period` - Time period: "day" | "week" | "month" | "year" | "all"
- `input.userId?` - Optional user ID (admin only)

**Options:**
- `staleTime?: number` (default: 60s - history doesn't change rapidly)
- `enabled?: boolean` (default: true)

**Returns:**
- `data.data` - Array of chart data points
- `data.period` - Selected period

#### `useSyncPortfolioBalanceMutation()`
Sync portfolio balance from active exchange.

**Returns:**
- `mutate(input?)` - Execute sync
- `isPending` - Loading state
- `isSuccess` - Success state

## Types

```typescript
interface PortfolioStats {
  // Performance Metrics
  totalPnl: number;
  totalPnlPercent: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;

  // Balance Tracking
  initialBalance: number;
  currentBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;

  // Time-based Analytics
  dailyPnl: number;
  weeklyPnl: number;
  monthlyPnl: number;

  // Statistics
  totalTrades: number;
  activeTrades: number;
  avgWinAmount: number;
  avgLossAmount: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number;

  // Separate balances
  spotBalance: number;
  marginBalance: number;

  // Metadata
  lastCalculatedAt: string;
}

interface ChartDataPoint {
  date: string;          // ISO date string
  value: number;         // Portfolio value at this time
  pnl: number;          // Total PnL at this time
  change: number;        // Percentage change from previous point
}
```

## Integration with Other Features

### Exchange Feature
Portfolio balance syncs from active exchange:
```typescript
// After creating exchange, sync portfolio balance
const createMutation = useCreateExchangeMutation();
const syncMutation = useSyncPortfolioBalanceMutation();

createMutation.mutate(exchangeData, {
  onSuccess: () => {
    syncMutation.mutate(); // Auto-sync balance
  },
});
```

### Position Feature
Portfolio stats update when positions close:
```typescript
// Portfolio stats automatically recalculated
// Win rate, PnL, trade counts updated
```

## Best Practices

### 1. Use Specific Hooks
```typescript
// ✅ Good: Use stats query for dashboard
const { data } = usePortfolioStatsQuery();

// ❌ Avoid: Loading full portfolio just for stats
const { data } = usePortfolioQuery(); // More data than needed
```

### 2. Cache History by Period
```typescript
// Each period is cached separately
const monthData = usePortfolioHistoryQuery({ period: "month" });
const yearData = usePortfolioHistoryQuery({ period: "year" });
// No redundant requests!
```

### 3. Sync After Exchange Changes
```typescript
// Always sync balance after exchange operations
const deleteMutation = useDeleteExchangeMutation();
const syncMutation = useSyncPortfolioBalanceMutation();

deleteMutation.mutate(exchangeId, {
  onSuccess: () => {
    syncMutation.mutate(); // Recalculate balance
  },
});
```

## Migration Guide

### Before (Old Pattern)
```typescript
const [portfolio, setPortfolio] = useState(null);

useEffect(() => {
  async function fetch() {
    const res = await fetch("/api/portfolio");
    const data = await res.json();
    setPortfolio(data.portfolio);
  }
  fetch();
}, []);
```

### After (New Pattern)
```typescript
const { data } = usePortfolioQuery();
const portfolio = data?.portfolio;
```

### Benefits
- **Automatic caching** - No redundant requests
- **Background refetching** - Data stays fresh
- **Type safety** - Full TypeScript support
- **Better performance** - Optimized queries
- **Error handling** - Built-in error states

## Performance Optimizations

1. **Field Selection** - Stats query only fetches needed fields
2. **Cache Duration** - Different stale times for different data:
   - Stats: 10s (frequently changing)
   - Portfolio: 30s (moderate changes)
   - History: 60s (slow changing)
3. **Background Refetch** - Auto-updates without blocking UI
4. **Request Deduplication** - Multiple components, single request

## Next Steps

After completing all features:
1. Update dashboard components
2. Replace old API calls
3. Add real-time balance updates
4. Implement portfolio comparison features
