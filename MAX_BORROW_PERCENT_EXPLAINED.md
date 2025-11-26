# 🎯 MaxBorrowPercent - How It Works

## 📊 Correct Understanding

`maxBorrowPercent` is **a percentage of the exchange's maximum borrowable amount**, NOT a percentage of your position size.

---

## 💡 The Logic

```
Exchange Max Borrowable = 100 USDT (from Binance API)
Bot maxBorrowPercent = 50%

Bot's Max Borrow Limit = 100 × 50% = 50 USDT

Result: Bot can only borrow up to 50 USDT
```

---

## 🎯 Real Example

### Setup
```
Exchange says: "You can borrow up to 100 USDT"
Bot setting: maxBorrowPercent = 50%
```

### Calculation
```
Step 1: Get exchange max
  Exchange Max Borrowable = 100 USDT

Step 2: Apply bot's percentage
  Bot Max Borrow Limit = 100 × 50% = 50 USDT

Step 3: Check your trade
  Your trade needs to borrow = 30 USDT
  Bot limit = 50 USDT
  Status: ✅ APPROVED (30 < 50)
```

---

## 📊 Different Scenarios

### Scenario 1: Within Limit ✅
```
Exchange Max: 100 USDT
Bot maxBorrowPercent: 50%
Bot Limit: 50 USDT

Your Trade Needs: 30 USDT
Result: ✅ APPROVED
```

### Scenario 2: Exceeds Limit ❌
```
Exchange Max: 100 USDT
Bot maxBorrowPercent: 50%
Bot Limit: 50 USDT

Your Trade Needs: 70 USDT
Result: ❌ REJECTED
Error: "Cannot borrow 70 USDT. Bot's max borrow limit 
       is 50 USDT (50% of exchange's 100 USDT max)"
```

### Scenario 3: Conservative Setting
```
Exchange Max: 100 USDT
Bot maxBorrowPercent: 30%
Bot Limit: 30 USDT

Your Trade Needs: 40 USDT
Result: ❌ REJECTED
```

### Scenario 4: Aggressive Setting
```
Exchange Max: 100 USDT
Bot maxBorrowPercent: 80%
Bot Limit: 80 USDT

Your Trade Needs: 70 USDT
Result: ✅ APPROVED
```

---

## 🔧 Complete Example with Full Context

### Your Bot Configuration
```json
{
  "portfolio": 10000,
  "positionPercent": 20,
  "leverage": 2,
  "maxBorrowPercent": 50
}
```

### Step-by-Step Execution

#### Step 1: Calculate Position
```
Your Capital = $10,000 × 20% = $2,000
Total Position = $2,000 × 2 = $4,000
Amount to Borrow = $2,000
```

#### Step 2: Check Exchange Limit
```
API Call: getMaxBorrowable("USDT")
Exchange Response: 100 USDT
```

#### Step 3: Calculate Bot's Limit
```
Bot Max Borrow = 100 USDT × 50% = 50 USDT
```

#### Step 4: Validate
```
Need to Borrow: $2,000 USDT
Bot's Limit: 50 USDT
Exchange Limit: 100 USDT

Check: $2,000 > 50 USDT?
Result: ❌ REJECTED!
```

#### What Happened?
Your trade needs $2,000 USDT, but:
- Exchange allows 100 USDT max
- Bot only allows 50% of that = 50 USDT
- Your trade exceeds bot's 50 USDT limit

#### Solutions
1. **Increase maxBorrowPercent**: Set to 100% to use full exchange limit
2. **Reduce leverage**: Use 1x instead of 2x
3. **Reduce position %**: Use 10% instead of 20%
4. **Add more capital**: So you don't need to borrow as much

---

## 🎯 Why This Approach?

### Risk Management
```
Exchange says you CAN borrow 1000 USDT
But should you use ALL of it? NO!

maxBorrowPercent = Safety limit
- 30% = Very Conservative
- 50% = Moderate
- 70% = Aggressive
- 100% = Use full exchange limit (risky!)
```

### Benefits
1. **Controlled Risk**: Don't max out borrowing
2. **Buffer Room**: Leave space for market moves
3. **Interest Management**: Less borrowing = less interest
4. **Liquidation Safety**: More room before liquidation

---

## 📊 Recommended Settings

### Conservative (Low Risk)
```json
{
  "maxBorrowPercent": 30,
  "leverage": 2
}

If exchange allows 100 USDT:
  Bot allows: 30 USDT
```

### Moderate (Medium Risk)
```json
{
  "maxBorrowPercent": 50,
  "leverage": 3
}

If exchange allows 100 USDT:
  Bot allows: 50 USDT
```

### Aggressive (High Risk)
```json
{
  "maxBorrowPercent": 80,
  "leverage": 5
}

If exchange allows 100 USDT:
  Bot allows: 80 USDT
```

---

## 🧪 Test Your Understanding

### Question 1
```
Exchange Max Borrowable: 200 USDT
Bot maxBorrowPercent: 40%
Trade needs to borrow: 60 USDT

Will it be approved?
```

<details>
<summary>Answer</summary>

```
Bot Limit = 200 × 40% = 80 USDT
Trade Needs = 60 USDT
60 < 80: ✅ APPROVED
```
</details>

### Question 2
```
Exchange Max Borrowable: 50 USDT
Bot maxBorrowPercent: 60%
Trade needs to borrow: 40 USDT

Will it be approved?
```

<details>
<summary>Answer</summary>

```
Bot Limit = 50 × 60% = 30 USDT
Trade Needs = 40 USDT
40 > 30: ❌ REJECTED

Even though exchange allows 50 USDT,
bot only allows 30 USDT (60% of 50)
```
</details>

### Question 3
```
Exchange Max Borrowable: 1000 USDT
Bot maxBorrowPercent: 25%
Trade needs to borrow: 300 USDT

Will it be approved?
```

<details>
<summary>Answer</summary>

```
Bot Limit = 1000 × 25% = 250 USDT
Trade Needs = 300 USDT
300 > 250: ❌ REJECTED

Solution: Increase maxBorrowPercent to at least 30%
```
</details>

---

## 🔍 Log Output Example

When you run your bot, you'll see:

```
Borrow limits: {
  exchangeMaxBorrowable: '100.00 USDT',
  botMaxBorrowPercent: '50%',
  botMaxBorrowLimit: '50.00 USDT',
  amountNeeded: '30.00 USDT'
}

✅ Borrow validation passed - borrowing 30.00 USDT
```

Or if rejected:

```
Borrow limits: {
  exchangeMaxBorrowable: '100.00 USDT',
  botMaxBorrowPercent: '50%',
  botMaxBorrowLimit: '50.00 USDT',
  amountNeeded: '70.00 USDT'
}

❌ Error: Cannot borrow 70.00 USDT. Bot's max borrow limit 
   is 50.00 USDT (50% of exchange's 100.00 USDT max). 
   Increase maxBorrowPercent, reduce leverage, or reduce position size.
```

---

## 📋 Quick Reference

| maxBorrowPercent | Risk Level | Use Case |
|------------------|-----------|----------|
| 10-30% | Very Low | Super safe, learning |
| 30-50% | Low | Conservative trading |
| 50-70% | Medium | Standard trading |
| 70-90% | High | Aggressive trading |
| 90-100% | Very High | Expert only |

---

## ✅ Summary

### The Formula
```
Bot Max Borrow Limit = Exchange Max Borrowable × (maxBorrowPercent / 100)
```

### Validation
```
if (amountToBorrow > botMaxBorrowLimit) {
  REJECT TRADE
}
```

### Why It's Better
- ✅ Controls risk exposure
- ✅ Leaves buffer room
- ✅ Prevents maxing out borrowing
- ✅ Reduces liquidation risk
- ✅ Easier to understand

### Example in One Line
**"If Binance says I can borrow 100 USDT, and my bot's maxBorrowPercent is 50%, then my bot will only borrow up to 50 USDT."**

---

**This is the correct and safer approach to margin trading!** 🎯

_Updated: November 25, 2025_

