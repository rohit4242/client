# 🎯 Take Profit & Stop Loss Automation

## Overview

Automatic monitoring system that closes positions when they hit take profit or stop loss targets.

---

## 🚀 Features

### 1. Automatic Position Monitoring
- ✅ Monitors all open positions with TP/SL set
- ✅ Checks prices every minute
- ✅ Closes positions automatically when targets hit
- ✅ Works for both LONG and SHORT positions
- ✅ Supports both SPOT and MARGIN trading

### 2. Take Profit (TP)
**For LONG positions:**
- Closes when price goes UP to take profit level
- Example: Entry $50,000, TP 5% → Closes at $52,500

**For SHORT positions:**
- Closes when price goes DOWN to take profit level
- Example: Entry $50,000, TP 5% → Closes at $47,500

### 3. Stop Loss (SL)
**For LONG positions:**
- Closes when price goes DOWN to stop loss level
- Example: Entry $50,000, SL 2% → Closes at $49,000

**For SHORT positions:**
- Closes when price goes UP to stop loss level
- Example: Entry $50,000, SL 2% → Closes at $51,000

---

## 📊 How It Works

### Configuration in Bot
```json
{
  "takeProfit": 5,     // Close at 5% profit
  "stopLoss": 2,       // Close at 2% loss
  "leverage": 2,
  "autoRepay": true
}
```

### Position Creation
When a position is opened:
```typescript
{
  entryPrice: 50000,
  takeProfit: 52500,   // Calculated: 50000 * 1.05
  stopLoss: 49000      // Calculated: 50000 * 0.98
}
```

### Monitoring Loop
```
Every 1 minute:
1. Get all open positions with TP/SL
2. Fetch current price for each
3. Check if price hit TP or SL
4. If hit, close position automatically
5. Update P&L and stats
```

---

## 🔧 Setup

### Option 1: Vercel Cron (Recommended for Production)

**File:** `vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/cron/monitor-positions",
      "schedule": "* * * * *"
    }
  ]
}
```

**Schedule:** Every minute
**Cost:** Free on Vercel

### Option 2: External Cron Service

Use services like:
- **Cron-job.org** (free)
- **EasyCron** (free tier)
- **GitHub Actions** (free)

**Configuration:**
```
URL: https://your-domain.com/api/cron/monitor-positions
Method: GET
Interval: Every 1 minute
Header: Authorization: Bearer YOUR_CRON_SECRET
```

### Option 3: Manual Trigger

Call the endpoint manually:
```bash
curl https://your-domain.com/api/cron/monitor-positions \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 🎯 Example Scenarios

### Scenario 1: LONG Position with Take Profit

**Setup:**
```
Symbol: BTCUSDT
Side: LONG
Entry Price: $50,000
Quantity: 0.001 BTC
Take Profit: 5%
TP Price: $52,500
```

**What Happens:**
```
Minute 1: Price = $50,500 → No action
Minute 2: Price = $51,000 → No action
Minute 3: Price = $52,000 → No action
Minute 4: Price = $52,600 → 🎯 TP HIT!
  
Action:
  ✅ Automatically closes position
  ✅ Sells 0.001 BTC at $52,600
  ✅ Profit: ~$2.60 (5.2% gain)
  ✅ Updates bot stats
```

### Scenario 2: LONG Position with Stop Loss

**Setup:**
```
Symbol: ETHUSDT
Side: LONG
Entry Price: $3,000
Quantity: 0.1 ETH
Stop Loss: 2%
SL Price: $2,940
```

**What Happens:**
```
Minute 1: Price = $2,980 → No action
Minute 2: Price = $2,960 → No action
Minute 3: Price = $2,930 → 🛑 SL HIT!
  
Action:
  ✅ Automatically closes position
  ✅ Sells 0.1 ETH at $2,930
  ✅ Loss: -$7.00 (2.33% loss)
  ✅ Updates bot stats
  ✅ Prevents further losses
```

### Scenario 3: SHORT Position with Take Profit

**Setup:**
```
Symbol: BTCUSDT
Side: SHORT
Entry Price: $50,000
Quantity: 0.001 BTC
Take Profit: 3%
TP Price: $48,500
```

**What Happens:**
```
Minute 1: Price = $49,500 → No action
Minute 2: Price = $49,000 → No action
Minute 3: Price = $48,400 → 🎯 TP HIT!
  
Action:
  ✅ Automatically closes SHORT
  ✅ Buys back 0.001 BTC at $48,400
  ✅ Profit: ~$1.60 (3.2% gain)
  ✅ Auto-repays borrowed amount
```

---

## 📋 Log Output

### Successful TP Hit
```log
🔍 Monitoring positions for TP/SL...
📊 Found 3 positions to monitor
📈 BTCUSDT: Current=$52,600, Entry=$50,000
🎯 Closing position abc-123 - Take Profit hit: 52600 >= 52500 (5.20% profit)
🔄 Auto-closing position BTCUSDT...
Closing MARGIN position with AUTO_REPAY
✅ Margin close order executed
✅ Position closed: Take Profit hit, P&L: 2.60 (5.20%)
✅ Position monitoring completed
```

### SL Hit
```log
🔍 Monitoring positions for TP/SL...
📊 Found 2 positions to monitor
📈 ETHUSDT: Current=$2,930, Entry=$3,000
🎯 Closing position def-456 - Stop Loss hit: 2930 <= 2940 (2.33% loss)
🔄 Auto-closing position ETHUSDT...
✅ Position closed: Stop Loss hit, P&L: -7.00 (2.33%)
✅ Position monitoring completed
```

---

## 🛠️ Files Created

### 1. `src/lib/signal-bot/position-monitor.ts`
Main monitoring logic:
- `monitorPositions()` - Main loop
- `checkTakeProfitStopLoss()` - TP/SL logic
- `closePositionAutomatically()` - Auto-close positions

### 2. `src/app/api/cron/monitor-positions/route.ts`
API endpoint for cron jobs:
- GET endpoint for cron services
- POST endpoint for manual trigger
- Optional authentication

### 3. `vercel.json`
Vercel Cron configuration:
- Runs every minute
- Calls monitoring endpoint

---

## 🔐 Security

### Environment Variable
Set in `.env`:
```env
CRON_SECRET=your-secure-random-string-here
```

### Cron Service Configuration
Add header to cron request:
```
Authorization: Bearer your-secure-random-string-here
```

---

## 🧪 Testing

### Test Locally

1. **Start dev server:**
```bash
npm run dev
```

2. **Open a position with TP/SL:**
- Use signal bot
- Set takeProfit and stopLoss
- Open position

3. **Manually trigger monitoring:**
```bash
curl http://localhost:3000/api/cron/monitor-positions
```

4. **Check logs:**
```
Should see monitoring output in console
```

### Test Take Profit

1. Open a LONG position
2. Wait for price to go up
3. When price hits TP, position closes automatically
4. Check P&L in database

### Test Stop Loss

1. Open a LONG position
2. If price drops to SL
3. Position closes automatically
4. Check loss is limited to SL %

---

## 📊 Database Updates

When TP/SL triggers, these updates happen:

### Position Table
```sql
UPDATE position SET
  status = 'CLOSED',
  exitPrice = currentPrice,
  exitValue = quantity * currentPrice,
  pnl = calculatedPnL,
  pnlPercent = calculatedPercent,
  currentPrice = currentPrice
WHERE id = positionId
```

### Order Table
```sql
INSERT INTO order (
  positionId,
  type = 'EXIT',
  side = 'SELL', -- or 'BUY' for SHORT
  status = 'FILLED',
  pnl = calculatedPnL
)
```

### Bot Table (if bot position)
```sql
UPDATE bot SET
  totalTrades = totalTrades + 1,
  winTrades = winTrades + 1,  -- if pnl > 0
  totalPnl = totalPnl + pnl
WHERE id = botId
```

---

## ⚙️ Configuration Options

### Monitor Frequency

**Current:** Every 1 minute

**To change:**
Edit `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/monitor-positions",
    "schedule": "*/2 * * * *"  // Every 2 minutes
  }]
}
```

**Cron expressions:**
- `* * * * *` - Every minute
- `*/2 * * * *` - Every 2 minutes
- `*/5 * * * *` - Every 5 minutes
- `0 * * * *` - Every hour

### Skip Monitoring for Specific Positions

In bot configuration:
```json
{
  "takeProfit": null,  // Disable take profit
  "stopLoss": null     // Disable stop loss
}
```

Positions without TP/SL won't be monitored.

---

## 💡 Best Practices

### 1. Always Set Stop Loss
```json
{
  "stopLoss": 2,  // Limit losses to 2%
  "takeProfit": 5  // Target 5% profit
}
```

**Why:** Protects your capital from large losses

### 2. Use Reasonable Targets
```
Conservative: TP 3%, SL 1%
Moderate: TP 5%, SL 2%
Aggressive: TP 10%, SL 5%
```

### 3. Enable Auto-Repay for Margin
```json
{
  "autoRepay": true  // Auto-repay loans when closing
}
```

### 4. Monitor Cron Health
- Check logs regularly
- Set up monitoring alerts
- Verify positions are being checked

---

## 🐛 Troubleshooting

### Issue: Positions not closing

**Check:**
1. Is cron job running?
2. Check `/api/cron/monitor-positions` logs
3. Verify TP/SL prices are set correctly
4. Check API keys are valid

**Solution:**
```bash
# Manually trigger to test
curl http://localhost:3000/api/cron/monitor-positions
```

### Issue: Cron not running on Vercel

**Check:**
1. `vercel.json` is in root directory
2. Cron is enabled in Vercel dashboard
3. Check Vercel logs

**Solution:**
Deploy and check Vercel dashboard → Settings → Cron Jobs

### Issue: Price not updating

**Check:**
1. Exchange API keys valid
2. Rate limits not exceeded
3. Symbol format correct

---

## 📈 Monitoring Dashboard (Future Enhancement)

Could add:
- Real-time position tracking UI
- TP/SL visualization on charts
- Email/SMS alerts when positions close
- Performance analytics

---

## ✅ Summary

### What You Get
- ✅ Automatic take profit execution
- ✅ Automatic stop loss protection
- ✅ Works for LONG and SHORT positions
- ✅ Supports SPOT and MARGIN trading
- ✅ Auto-repay for margin positions
- ✅ Detailed logging
- ✅ Bot stats updated automatically

### How It Works
1. Set TP/SL when creating bot
2. Open positions with signal bot
3. Monitor runs every minute
4. Positions close automatically at targets
5. P&L calculated and recorded

### Status
🚀 **READY TO USE**

Just deploy with `vercel.json` and positions will be monitored automatically!

---

_Implemented: November 26, 2025_

