# Customer Portal Documentation

## Overview

The customer portal provides a read-only view for customers to track their portfolio performance, positions, orders, and bot signals. All data is automatically updated based on admin actions.

## Features

### 1. Dashboard (`/customer/dashboard`)

The main dashboard provides an overview of the customer's portfolio:

**Statistics Cards:**
- Portfolio Value
- Total P&L (Profit & Loss with percentage)
- Win Rate (with win/loss breakdown)
- Active Positions count

**Performance Chart:**
- Time-based P&L (Daily, Weekly, Monthly)
- Trading metrics (Average Win/Loss, Largest Win/Loss, Profit Factor)
- Portfolio value tracking

**Recent Activity:**
- Last 5 positions/trades
- Last 5 bot signals
- Real-time status updates

### 2. Positions (`/customer/positions`)

View all trading positions with filtering:

**Features:**
- Filter by All/Open/Closed positions
- Detailed position information:
  - Symbol, Side (LONG/SHORT), Type
  - Entry price, Quantity, Current price
  - P&L with percentage
  - Status and Source (MANUAL/BOT)
  - Timestamps
- Color-coded P&L (green for profit, red for loss)
- Status badges

### 3. Orders (`/customer/orders`)

Complete order history:

**Information Displayed:**
- Order ID, Symbol
- Type (ENTRY/EXIT), Side (BUY/SELL)
- Order Type (MARKET/LIMIT)
- Price, Quantity, Total Value
- Fill percentage
- P&L for each order
- Status (FILLED, PENDING, CANCELED, etc.)
- Creation timestamp

### 4. Performance (`/customer/performance`)

Comprehensive performance analytics:

**Performance Overview:**
- Total P&L with trend
- Win Rate statistics
- Total trades count
- Profit Factor

**Time-based Performance:**
- Daily P&L
- Weekly P&L
- Monthly P&L

**Trade Performance:**
- Average Win amount
- Average Loss amount
- Largest Win
- Largest Loss

**Portfolio Summary:**
- Initial Balance
- Current Balance
- Total Wins/Losses

## Data Source

All customer portal data is retrieved from the database Portfolio model:

### Portfolio Statistics (Auto-calculated)
```typescript
{
  totalPnl: number         // Total profit/loss
  totalPnlPercent: number  // Overall P/L percentage
  totalWins: number        // Number of winning trades
  totalLosses: number      // Number of losing trades
  winRate: number          // Win rate percentage
  currentBalance: number   // Current total balance
  initialBalance: number   // Starting balance
  totalTrades: number      // Total number of trades
  activeTrades: number     // Currently open positions
  dailyPnl: number        // Today's P/L
  weeklyPnl: number       // This week's P/L
  monthlyPnl: number      // This month's P/L
  avgWinAmount: number    // Average winning trade
  avgLossAmount: number   // Average losing trade
  largestWin: number      // Biggest win
  largestLoss: number     // Biggest loss
  profitFactor: number    // Gross profit / Gross loss
}
```

## Server Actions

### Customer Data Actions

Location: `src/db/actions/customer/`

1. **`getPortfolioStats()`**
   - Returns portfolio statistics for the current user
   - Automatically filters by user ID

2. **`getRecentPositions(limit)`**
   - Returns recent positions for the current user
   - Default limit: 10, Max: 50

3. **`getRecentSignals(limit)`**
   - Returns recent bot signals for the current user
   - Default limit: 10
   - Includes bot name and signal details

4. **`getOrders(limit)`**
   - Returns order history for the current user
   - Default limit: 50, Max: 100

## Real-time Updates

The customer portal displays data that is automatically updated when admins:

1. **Create Positions** → Updates:
   - Active Positions count
   - Recent Positions list
   - Portfolio value

2. **Close Positions** → Updates:
   - Total P&L
   - Win/Loss counts
   - Win Rate
   - Active Positions count
   - Average Win/Loss amounts

3. **Execute Orders** → Updates:
   - Order History
   - Position entry/exit prices
   - P&L calculations

4. **Bot Signals Processed** → Updates:
   - Recent Signals list
   - Positions (if signal creates a trade)
   - Portfolio statistics

## Security

- **Authentication Required**: All routes require user authentication
- **User-specific Data**: All queries filter by user ID
- **Read-only Access**: Customers cannot modify any data
- **Server-side Rendering**: Data is fetched server-side for security

## Access Control

```typescript
// Both CUSTOMER and ADMIN roles can access customer portal
if (!user) {
  redirect("/sign-in");
}
// No role restriction - both can access
```

## UI Components

### Dashboard Components
- `StatsCards` - Portfolio statistics overview
- `RecentPositions` - Last 5 positions with P&L
- `RecentSignals` - Bot signals with status
- `PerformanceChart` - Performance metrics and charts

### Positions Components
- `PositionsTable` - Filterable table of all positions
- Tabs for All/Open/Closed positions

### Orders Components
- `OrdersTable` - Complete order history table

### Performance Components
- `PerformanceOverview` - Key performance metrics
- `TradingStatistics` - Detailed trading statistics

## Data Flow

```
Admin Actions (Create/Update/Close Positions)
    ↓
Database (Portfolio, Position, Order, Signal tables)
    ↓
Server Actions (getPortfolioStats, getRecentPositions, etc.)
    ↓
Customer Portal Pages (Server Components)
    ↓
UI Components (Client Components)
    ↓
Customer View (Read-only Display)
```

## Future Enhancements

1. **Real-time Updates**: Add WebSocket support for live data updates
2. **Notifications**: Alert customers of significant events
3. **Export Data**: Allow customers to export their trading history
4. **Charts**: Add interactive charts for portfolio performance over time
5. **Filters**: Advanced filtering and search capabilities
6. **Mobile App**: Dedicated mobile application for on-the-go monitoring

