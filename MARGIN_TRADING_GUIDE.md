# Margin Trading & Leverage Guide

## Overview
The Signal Bot now supports fully functional margin trading with leverage and auto-borrow functionality. This guide explains how it works and how to configure it.

## Key Features

### 1. Leverage Support
- **Leverage Range**: 1x to 125x (configurable per bot)
- **Spot Trading**: Leverage is fixed at 1x (no actual leverage without margin)
- **Margin Trading**: Full leverage support with automatic borrowing

### 2. Auto-Borrow Functionality
When margin trading is enabled, the system automatically:
1. Checks your available balance for the required asset
2. Calculates how much needs to be borrowed
3. Validates against exchange borrowing limits
4. Enforces your configured `maxBorrowPercent` limit
5. Only borrows what's needed (not exceeding limits)

### 3. Max Borrow Percentage
- **Purpose**: Limits how much of a position can be financed through borrowing
- **Range**: 1% to 100%
- **Default**: 50%
- **Example**: With 50% max borrow:
  - If you want to open a $1000 position
  - You need at least $500 in your account
  - The system will borrow up to $500 (50% of position)

## How It Works

### For LONG Positions (BUY)

1. **Calculate Position Size**
   ```
   Base Position Value = (Portfolio Value × Position %) / 100
   Leveraged Position Value = Base Position Value × Leverage
   ```

2. **Check Available Balance**
   - Checks quote asset balance (e.g., USDT for BTCUSDT)
   - Determines if borrowing is needed

3. **Validate Borrowing**
   ```
   Amount Needed to Borrow = Leveraged Position Value - Available Balance
   Max Allowed Borrow = Leveraged Position Value × (Max Borrow % / 100)
   ```

4. **Execute Trade**
   - If no borrowing needed: Uses `NO_SIDE_EFFECT` or `AUTO_REPAY`
   - If borrowing needed: Uses `MARGIN_BUY` or `AUTO_BORROW_REPAY`

### For SHORT Positions (SELL)

1. **Calculate Position Size**
   ```
   Base Position Value = (Portfolio Value × Position %) / 100
   Leveraged Position Value = Base Position Value × Leverage
   Base Asset Quantity = Leveraged Position Value / Current Price
   ```

2. **Check Available Balance**
   - Checks base asset balance (e.g., BTC for BTCUSDT)
   - Determines if borrowing is needed

3. **Validate Borrowing**
   - Same validation as LONG but for base asset
   - Must have enough collateral to borrow

4. **Execute Trade**
   - Uses `MARGIN_BUY` to borrow base asset if needed
   - Sells borrowed asset to open short position

## Configuration

### Bot Settings

```typescript
{
  accountType: "MARGIN",           // SPOT or MARGIN
  marginType: "CROSS",             // CROSS margin (ISOLATED coming soon)
  leverage: 3,                     // 1x to 125x
  maxBorrowPercent: 50,           // Max % of position that can be borrowed
  autoRepay: true,                 // Auto-repay borrowed amounts when closing
  sideEffectType: "AUTO_BORROW_REPAY", // Side effect for margin orders
  positionPercent: 20,            // % of portfolio per trade
  stopLoss: 2,                    // 2% stop loss
  takeProfit: 5                   // 5% take profit
}
```

### Side Effect Types

1. **NO_SIDE_EFFECT**: Normal order without auto-borrow/repay
   - Use when you have full balance available
   - No automatic borrowing or repayment

2. **MARGIN_BUY**: Auto-borrow if balance insufficient
   - Automatically borrows needed assets
   - Used for entering positions

3. **AUTO_REPAY**: Auto-repay debt when selling
   - Automatically repays borrowed amounts
   - Used for exiting positions

4. **AUTO_BORROW_REPAY**: Automatically borrow and repay as needed
   - Most automated option
   - System handles both borrowing and repayment

## Examples

### Example 1: LONG with Leverage

**Configuration:**
- Portfolio Value: $10,000
- Position Percent: 20%
- Leverage: 3x
- Max Borrow Percent: 50%
- Available USDT: $1,500

**Calculation:**
```
Base Position Value = $10,000 × 20% = $2,000
Leveraged Position Value = $2,000 × 3 = $6,000
Available Balance = $1,500
Amount to Borrow = $6,000 - $1,500 = $4,500
Max Allowed Borrow = $6,000 × 50% = $3,000
```

**Result:** ❌ REJECTED
- Needs to borrow $4,500 but max allowed is $3,000
- Error: "Borrow amount exceeds bot's max borrow limit of 50%"

### Example 2: LONG with Lower Leverage

**Configuration:**
- Portfolio Value: $10,000
- Position Percent: 20%
- Leverage: 2x
- Max Borrow Percent: 50%
- Available USDT: $2,500

**Calculation:**
```
Base Position Value = $10,000 × 20% = $2,000
Leveraged Position Value = $2,000 × 2 = $4,000
Available Balance = $2,500
Amount to Borrow = $4,000 - $2,500 = $1,500
Max Allowed Borrow = $4,000 × 50% = $2,000
```

**Result:** ✅ SUCCESS
- Needs to borrow $1,500
- Max allowed is $2,000
- Uses own funds: $2,500
- Borrows: $1,500
- Total position: $4,000

### Example 3: SHORT Position

**Configuration:**
- Symbol: BTCUSDT
- Current Price: $50,000
- Portfolio Value: $10,000
- Position Percent: 10%
- Leverage: 2x
- Max Borrow Percent: 60%
- Available BTC: 0.01 BTC

**Calculation:**
```
Base Position Value = $10,000 × 10% = $1,000
Leveraged Position Value = $1,000 × 2 = $2,000
BTC Quantity Needed = $2,000 / $50,000 = 0.04 BTC
Available BTC = 0.01 BTC
BTC to Borrow = 0.04 - 0.01 = 0.03 BTC
Max Allowed Borrow = 0.04 × 60% = 0.024 BTC
```

**Result:** ❌ REJECTED
- Needs to borrow 0.03 BTC but max allowed is 0.024 BTC
- Error: "Borrow amount exceeds bot's max borrow limit of 60%"

## Risk Management

### Position Limits
- Always enforces maxBorrowPercent to prevent over-leveraging
- Validates against exchange borrowing limits
- Checks account margin level before opening positions

### Auto-Repay
- When `autoRepay` is enabled:
  - SELL orders automatically repay borrowed USDT
  - BUY orders (covering shorts) automatically repay borrowed base asset
- Reduces interest costs
- Simplifies position management

### Interest Tracking
- System tracks borrowed amounts per position
- Interest is calculated and recorded
- Can monitor interest costs per position

## Best Practices

1. **Start Conservative**
   - Begin with low leverage (2x-3x)
   - Use maxBorrowPercent of 30-50%
   - Test with small position percentages

2. **Use Stop Loss**
   - Always set stop loss when using leverage
   - Leverage amplifies both gains and losses
   - Recommended: 2-5% stop loss

3. **Monitor Margin Level**
   - Keep margin level above 3.0 (safe zone)
   - Below 1.5 is warning zone
   - Below 1.1 risks liquidation

4. **Enable Auto-Repay**
   - Reduces interest costs
   - Simplifies position management
   - Prevents accumulation of debt

5. **Understand the Risks**
   - Leverage magnifies losses
   - Margin calls can liquidate positions
   - Interest accumulates on borrowed amounts
   - Market volatility is amplified

## Troubleshooting

### "Insufficient borrowable amount"
- Your account doesn't have enough collateral
- Exchange borrowing limits are reached
- Solution: Add more funds or reduce leverage

### "Borrow amount exceeds bot's max borrow limit"
- Trying to borrow more than maxBorrowPercent allows
- Solution: Increase maxBorrowPercent or reduce leverage

### "Invalid portfolio value"
- Exchange data not synced
- Solution: Sync your exchange in settings

### "Symbol not configured for bot"
- Signal received for symbol not in bot's whitelist
- Solution: Add symbol to bot's allowed symbols

## API Integration

### Webhook Payload Example

```json
{
  "action": "ENTER_LONG",
  "symbol": "BTCUSDT",
  "price": 50000,
  "botId": "your-bot-id",
  "secret": "your-webhook-secret"
}
```

The system automatically:
1. Validates the signal
2. Checks margin requirements
3. Calculates optimal position size
4. Borrows if needed (within limits)
5. Executes the trade
6. Tracks the position

## Database Schema

### Position Fields
```typescript
{
  accountType: "MARGIN",          // SPOT or MARGIN
  marginType: "CROSS",            // CROSS or ISOLATED
  leverage: 3.0,                  // Applied leverage
  borrowedAmount: 1500.00,        // Amount borrowed
  borrowedAsset: "USDT",          // Asset borrowed
  sideEffectType: "MARGIN_BUY",   // Side effect used
  interestPaid: 0.50              // Interest paid so far
}
```

## Future Enhancements

1. **Isolated Margin**: Support for isolated margin accounts
2. **Dynamic Leverage**: Adjust leverage based on market conditions
3. **Interest Optimization**: Minimize interest costs automatically
4. **Risk Alerts**: Notifications when margin level is low
5. **Automated Deleveraging**: Reduce leverage when risk is high

## Support

For issues or questions:
- Check logs in the bot dashboard
- Review position details for borrow amounts
- Contact support if problems persist

---

**Remember**: Margin trading and leverage are powerful tools but come with significant risks. Always trade responsibly and never risk more than you can afford to lose.

