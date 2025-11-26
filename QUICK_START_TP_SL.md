# ⚡ Quick Start: Take Profit & Stop Loss on AWS EC2

## 🚀 Setup in 5 Minutes

### Step 1: Update PM2 Configuration

```bash
# SSH to your EC2
ssh user@your-ec2-instance

# Navigate to project
cd /path/to/bytix/client

# Stop PM2
pm2 stop all
```

### Step 2: Start with New Config

```bash
# Start with ecosystem file
pm2 start ecosystem.config.js

# Save
pm2 save

# Should see 2 processes:
# - bytix-client (your app)
# - position-monitor (runs every minute)
```

### Step 3: Verify It Works

```bash
# Check PM2
pm2 list

# View monitor logs
pm2 logs position-monitor --lines 20

# Should see monitoring activity every minute
```

---

## ✅ That's It!

Your positions will now automatically close at TP/SL targets!

---

## 🧪 Test It

### Test Locally First:

```bash
# On your local machine (Windows)
npm run monitor:positions

# Should see:
============================================================
⏰ Position Monitor Started
============================================================
🔍 Monitoring positions for TP/SL...
📊 Found X positions to monitor
✅ Position monitoring completed
```

### Test on EC2:

```bash
# SSH to EC2
ssh user@your-ec2

# Check logs every minute
pm2 logs position-monitor

# Should see activity like:
[00:00] ⏰ Position Monitor Started
[00:00] 📊 Found 2 positions to monitor
[00:00] 📈 BTCUSDT: Current=$87500, Entry=$87400
[00:00] ✅ Position monitoring completed
```

---

## 📊 Example: Take Profit in Action

### 1. Create Bot with TP/SL
```json
{
  "name": "Test Bot",
  "leverage": 2,
  "positionPercent": 20,
  "takeProfit": 5,     // 5% profit target
  "stopLoss": 2,       // 2% loss limit
  "autoRepay": true
}
```

### 2. Open Position
```
Entry: $50,000
TP: $52,500 (5% higher)
SL: $49,000 (2% lower)
```

### 3. Monitor Tracks It
```log
Minute 1: Price = $50,500 → No action
Minute 2: Price = $51,000 → No action
Minute 3: Price = $52,600 → 🎯 TP HIT!
```

### 4. Auto-Close
```log
🎯 Closing position - Take Profit hit
🔄 Auto-closing position BTCUSDT...
✅ Position closed: P&L: +$2,600 (5.2% profit)
```

---

## 🔍 Monitor What's Happening

### Real-Time Logs
```bash
pm2 logs position-monitor
```

### Check Restart Count
```bash
pm2 show position-monitor

# restart count should = minutes since start
# If not increasing, cron isn't working
```

### Check Last Run
```bash
pm2 logs position-monitor --lines 50 | grep "Monitor Started"
```

---

## ⚙️ Configuration

### Change Monitor Frequency

Edit `ecosystem.config.js`:

```javascript
{
  name: "position-monitor",
  cron_restart: "*/2 * * * *", // Every 2 minutes
}
```

**Cron formats:**
- `* * * * *` - Every minute (recommended)
- `*/2 * * * *` - Every 2 minutes
- `*/5 * * * *` - Every 5 minutes
- `0 * * * *` - Every hour (not recommended)

Then restart:
```bash
pm2 restart position-monitor
pm2 save
```

---

## 🐛 Common Issues

### Monitor Not Running?

```bash
# Check PM2 status
pm2 list

# Restart monitor
pm2 restart position-monitor

# Check for errors
pm2 logs position-monitor --err
```

### Positions Not Closing?

**Check:**
1. TP/SL values are set in position
2. Current price actually hit the target
3. Exchange API working
4. No errors in logs

**Debug:**
```bash
pm2 logs position-monitor | grep "Closing position"
```

### Too Much Logging?

Reduce log level or filter:
```bash
# Only show closures
pm2 logs position-monitor | grep "🎯"
```

---

## 📋 PM2 Commands Cheat Sheet

```bash
# List processes
pm2 list

# Show details
pm2 show position-monitor

# View logs
pm2 logs position-monitor

# Restart
pm2 restart position-monitor

# Stop
pm2 stop position-monitor

# Delete
pm2 delete position-monitor

# Save state
pm2 save

# View last 50 lines
pm2 logs position-monitor --lines 50
```

---

## ✅ Summary

### Files Created:
1. ✅ `ecosystem.config.js` - PM2 configuration
2. ✅ `src/scripts/monitor-positions-cron.ts` - Monitor script
3. ✅ `AWS_EC2_SETUP.md` - Detailed setup guide
4. ✅ `QUICK_START_TP_SL.md` - This quick start

### Setup Steps:
1. ✅ Update PM2 with ecosystem.config.js
2. ✅ Start position monitor
3. ✅ Verify it runs every minute
4. ✅ Test with real position

### What It Does:
- ✅ Monitors positions every minute
- ✅ Closes at take profit targets
- ✅ Closes at stop loss limits
- ✅ Updates P&L automatically
- ✅ Works for margin & spot
- ✅ Auto-repays margin loans

---

## 🎯 Next Steps

1. **Deploy** the ecosystem.config.js to EC2
2. **Start** PM2 with new config
3. **Test** with a small position
4. **Monitor** logs to verify it works
5. **Enjoy** automated TP/SL! 🎉

---

**Your signal bot now has professional-grade take profit and stop loss automation!** 🚀

_Setup Guide for AWS EC2 + PM2_

