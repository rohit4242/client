# 🚀 AWS EC2 Setup for Position Monitoring

## Overview

Since you're using AWS EC2 with PM2, here are 3 methods to run the position monitor:

---

## ✅ Method 1: PM2 Cron (Recommended)

PM2 has built-in cron support that's perfect for this use case.

### Step 1: Update PM2 Configuration

Use the provided `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: "bytix-client",
      script: "npm",
      args: "start",
      instances: 1,
      exec_mode: "fork",
    },
    {
      name: "position-monitor",
      script: "./node_modules/.bin/tsx",
      args: "src/scripts/monitor-positions-cron.ts",
      cron_restart: "* * * * *", // Every minute
      autorestart: false,
      watch: false
    }
  ]
};
```

### Step 2: Start PM2 with Ecosystem File

```bash
# Stop current processes
pm2 stop all

# Start with ecosystem file
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup (auto-start on reboot)
pm2 startup
```

### Step 3: Verify It's Running

```bash
# Check PM2 processes
pm2 list

# Should show:
# bytix-client     - Your Next.js app
# position-monitor - Runs every minute

# View logs
pm2 logs position-monitor --lines 50

# View monitor-specific logs
pm2 logs position-monitor
```

### Step 4: Monitor Activity

```bash
# Real-time logs
pm2 logs position-monitor --lines 100

# Check last runs
pm2 logs position-monitor | grep "Position Monitor Started"
```

---

## ✅ Method 2: Linux Crontab

If you prefer using system cron instead of PM2 cron.

### Step 1: Create Monitor Script

Already created: `src/scripts/monitor-positions-cron.ts`

### Step 2: Make Script Executable

```bash
chmod +x src/scripts/monitor-positions-cron.ts
```

### Step 3: Setup Crontab

```bash
# Open crontab editor
crontab -e

# Add this line (runs every minute)
* * * * * cd /path/to/your/bytix/client && npx tsx src/scripts/monitor-positions-cron.ts >> /var/log/position-monitor.log 2>&1

# Or every 2 minutes
*/2 * * * * cd /path/to/your/bytix/client && npx tsx src/scripts/monitor-positions-cron.ts >> /var/log/position-monitor.log 2>&1
```

### Step 4: Verify Crontab

```bash
# List crontab entries
crontab -l

# Check logs
tail -f /var/log/position-monitor.log
```

---

## ✅ Method 3: API Endpoint + External Cron

Use an external service to hit your API endpoint.

### Step 1: External Cron Services (Free)

**Option A: Cron-job.org**
1. Go to https://cron-job.org
2. Create free account
3. Add new cron job:
   - URL: `https://your-domain.com/api/cron/monitor-positions`
   - Interval: Every 1 minute
   - Add header: `Authorization: Bearer YOUR_SECRET`

**Option B: UptimeRobot**
1. Go to https://uptimerobot.com
2. Create free account
3. Add HTTP(s) monitor:
   - URL: `https://your-domain.com/api/cron/monitor-positions`
   - Interval: Every 1 minute

**Option C: EasyCron**
1. Go to https://www.easycron.com
2. Free tier: Run jobs every 1 minute
3. Setup cron job with your API endpoint

### Step 2: Secure the Endpoint

Add to `.env`:
```env
CRON_SECRET=your-very-secure-random-string-here
```

The API already checks this secret!

---

## 📊 Comparison Table

| Method | Pros | Cons | Difficulty |
|--------|------|------|-----------|
| **PM2 Cron** | ✅ Integrated with PM2<br>✅ Easy to manage<br>✅ Local execution | ⚠️ Requires PM2 restart | Easy |
| **Linux Crontab** | ✅ System-level<br>✅ Very reliable<br>✅ Survives PM2 restarts | ⚠️ Separate from PM2 | Easy |
| **External Service** | ✅ No server config<br>✅ Email alerts available<br>✅ Health monitoring | ⚠️ External dependency<br>⚠️ Network latency | Very Easy |

---

## 🎯 Recommended Setup for AWS EC2

### Use PM2 Cron (Best for your setup)

**Why:**
- Already using PM2
- Keeps everything in one place
- Easy to monitor with `pm2 logs`
- Restarts automatically on failure

**Setup Commands:**
```bash
# 1. Stop current PM2 processes
pm2 stop all

# 2. Delete old processes
pm2 delete all

# 3. Start with ecosystem file
pm2 start ecosystem.config.js

# 4. Save configuration
pm2 save

# 5. Setup auto-startup on server reboot
pm2 startup
# Follow the command it outputs (run as sudo)

# 6. Verify
pm2 list
pm2 logs position-monitor --lines 20
```

---

## 🔍 Monitoring & Debugging

### Check If Monitor Is Running

```bash
# List all PM2 processes
pm2 list

# Should see:
┌────┬─────────────────────┬─────────┬─────────┬──────────┐
│ id │ name                │ mode    │ status  │ restart  │
├────┼─────────────────────┼─────────┼─────────┼──────────┤
│ 0  │ bytix-client        │ fork    │ online  │ 0        │
│ 1  │ position-monitor    │ fork    │ online  │ 60       │
└────┴─────────────────────┴─────────┴─────────┴──────────┘

# restart count for position-monitor should increase every minute
```

### View Monitor Logs

```bash
# Last 50 lines
pm2 logs position-monitor --lines 50

# Follow in real-time
pm2 logs position-monitor

# Filter for closures
pm2 logs position-monitor | grep "Closing position"
```

### Check for Errors

```bash
# Show only errors
pm2 logs position-monitor --err

# Check last error
pm2 logs position-monitor --lines 100 | grep -i error
```

---

## 🧪 Testing

### Test 1: Verify Monitor Works

```bash
# Manually trigger monitor (for testing)
cd /path/to/bytix/client
npx tsx src/scripts/monitor-positions-cron.ts

# Should see:
============================================================
⏰ Position Monitor Started - 2025-11-26T00:00:00.000Z
============================================================
🔍 Monitoring positions for TP/SL...
📊 Found X positions to monitor
✅ Position monitoring completed
```

### Test 2: Test with Real Position

1. **Open a test position:**
   ```bash
   # Send signal with TP/SL
   curl -X POST http://localhost:3000/api/webhook/signal-bot \
     -H "Content-Type: application/json" \
     -d '{
       "action": "ENTER_LONG",
       "symbol": "BTCUSDT",
       "botId": "your-bot-id",
       "secret": "your-secret"
     }'
   ```

2. **Check monitoring logs:**
   ```bash
   pm2 logs position-monitor
   
   # Should show:
   📈 BTCUSDT: Current=$87500, Entry=$87400
   ```

3. **Wait for TP/SL to hit:**
   ```
   When price reaches target:
   🎯 Closing position abc-123 - Take Profit hit: ...
   ✅ Position closed: Take Profit hit, P&L: +4.50
   ```

---

## 📋 Troubleshooting

### Issue: "position-monitor" not in PM2 list

**Solution:**
```bash
pm2 start ecosystem.config.js
pm2 save
```

### Issue: Monitor not running every minute

**Check:**
```bash
pm2 show position-monitor

# Look for:
cron restart: * * * * *
restart time: should increment every minute
```

**Solution:**
```bash
pm2 restart position-monitor
```

### Issue: "tsx: command not found"

**Solution:**
```bash
npm install tsx --save-dev

# Or globally
npm install -g tsx
```

### Issue: Monitor runs but doesn't find positions

**Check:**
1. Positions have `takeProfit` or `stopLoss` set
2. Position status is "OPEN"
3. Exchange API keys are valid

**Debug:**
```bash
# Add more logging
pm2 logs position-monitor --lines 200 | grep "Found"
```

---

## 🔐 Security for API Endpoint

If using external cron service, add to `.env`:

```env
CRON_SECRET=your-secure-random-string
```

Then configure external service to send:
```
Authorization: Bearer your-secure-random-string
```

---

## 📊 Alternative: Hit API Endpoint with Crontab

If you prefer not to use PM2 cron:

```bash
# Edit crontab
crontab -e

# Add (runs every minute)
* * * * * curl -s http://localhost:3000/api/cron/monitor-positions >> /var/log/position-monitor.log 2>&1

# Or with secret
* * * * * curl -s -H "Authorization: Bearer YOUR_SECRET" http://localhost:3000/api/cron/monitor-positions >> /var/log/position-monitor.log 2>&1
```

**Pros:**
- Simple HTTP call
- No additional PM2 process
- Can use public URL

**Cons:**
- Requires Next.js app to be running
- Extra HTTP overhead

---

## 🎯 Recommended Setup for Your AWS EC2

### Quick Start:

```bash
# 1. SSH into your EC2 instance
ssh user@your-ec2-ip

# 2. Navigate to project
cd /path/to/bytix/client

# 3. Install dependencies (if not already)
npm install

# 4. Stop existing PM2
pm2 stop all

# 5. Start with ecosystem
pm2 start ecosystem.config.js

# 6. Save PM2 state
pm2 save

# 7. Setup auto-start on reboot
pm2 startup
# Run the command it outputs

# 8. Check it's working
pm2 list
pm2 logs position-monitor --lines 20
```

### Verify:

```bash
# Should see position-monitor running
pm2 list

# Should see monitoring logs every minute
pm2 logs position-monitor

# Check restart count increases
pm2 show position-monitor
```

---

## 📁 Files for AWS EC2 Setup

### Created:
1. ✅ `ecosystem.config.js` - PM2 configuration
2. ✅ `src/scripts/monitor-positions-cron.ts` - Standalone script
3. ✅ `AWS_EC2_SETUP.md` - This guide

### Already Have:
- ✅ `src/lib/signal-bot/position-monitor.ts` - Core logic
- ✅ `src/app/api/cron/monitor-positions/route.ts` - API endpoint

---

## 🚨 Important Notes

### 1. Resource Usage
The position monitor is very lightweight:
- Runs for ~1-5 seconds
- Uses minimal CPU/RAM
- Safe to run every minute

### 2. Database Connections
Monitor opens/closes DB connections properly:
- No connection leaks
- Safe for production

### 3. Error Handling
If monitor fails:
- Logs the error
- Exits cleanly
- PM2 will restart on next cron schedule
- Doesn't affect main app

---

## ✅ Summary

### For AWS EC2 + PM2:

**Option 1: PM2 Cron (Recommended)**
```bash
pm2 start ecosystem.config.js
pm2 save
```

**Option 2: Linux Crontab**
```bash
crontab -e
# Add: * * * * * npx tsx /path/to/monitor-script.ts
```

**Option 3: External Cron Service**
```
Setup cron-job.org to hit:
https://your-domain/api/cron/monitor-positions
```

---

## 🎉 Next Steps

1. Choose a method (PM2 Cron recommended)
2. Deploy the configuration
3. Verify monitor runs every minute
4. Test with a real position
5. Monitor logs for TP/SL triggers

**Your take profit and stop loss will now work automatically!** 🚀

---

_Setup Guide for AWS EC2 with PM2_
_Updated: November 26, 2025_

