# 🚀 Signal Bot Leverage - Quick Reference Card

## ⚡ The Formula (Remember This!)

```
Your Capital = Portfolio × Position %
Total Position = Your Capital × Leverage
Borrow Amount = Your Capital × (Leverage - 1)
```

---

## 📊 Quick Example

```
Portfolio: $10,000
Position %: 20%
Leverage: 2x

Your Capital: $10,000 × 20% = $2,000
Total Position: $2,000 × 2 = $4,000
Borrow: $2,000 × (2-1) = $2,000

Result:
✅ Use YOUR $2,000
✅ Borrow $2,000
✅ Control $4,000 position
```

---

## 🎯 Leverage Table

| Leverage | You Use | You Borrow | Total Position | Borrow % |
|----------|---------|------------|----------------|----------|
| 1x | $2,000 | $0 | $2,000 | 0% |
| 2x | $2,000 | $2,000 | $4,000 | 50% |
| 3x | $2,000 | $4,000 | $6,000 | 66.7% |
| 4x | $2,000 | $6,000 | $8,000 | 75% |
| 5x | $2,000 | $8,000 | $10,000 | 80% |

_Assuming position % = 20% of $10k portfolio = $2,000_

---

## ✅ Validation Checks

### 1. Do You Have Enough Capital?
```
Need: Your Capital ($2,000)
Have: Available Balance ($2,500)
Status: ✅ PASS (have enough)
```

### 2. Exchange Borrowing Limit
```
Want to Borrow: $2,000
Exchange Max: $5,000
Status: ✅ PASS (within limit)
```

### 3. Bot's MaxBorrowPercent
```
Borrow: $2,000
Position: $4,000
Percentage: 50%
Bot Max: 50%
Status: ✅ PASS (at limit)
```

---

## ❌ Common Errors

### "Insufficient balance"
```
You need: $2,000
You have: $1,500
Missing: $500

Fix: Add $500 OR reduce position % to 15%
```

### "Exceeds max borrow limit"
```
Need to borrow: $4,000 (66.7%)
Bot max: 50%

Fix: Increase maxBorrowPercent to 67%
     OR reduce leverage to 2x
```

---

## 💰 Profit/Loss with Leverage

### 2x Leverage Example
```
Your Capital: $2,000
Total Position: $4,000 (0.08 BTC @ $50k)
Borrowed: $2,000

Price +10% → $55,000:
  Value: $4,400
  Repay: $2,000
  You: $2,400
  Profit: $400 (20% on your $2,000!)

Price -10% → $45,000:
  Value: $3,600
  Repay: $2,000
  You: $1,600
  Loss: $400 (20% loss!)
```

**Leverage doubles your gains AND losses!**

---

## ⚙️ Bot Configuration

### Conservative
```json
{
  "leverage": 2,
  "maxBorrowPercent": 50,
  "positionPercent": 10
}
```

### Moderate
```json
{
  "leverage": 3,
  "maxBorrowPercent": 70,
  "positionPercent": 15
}
```

### Aggressive ⚠️
```json
{
  "leverage": 5,
  "maxBorrowPercent": 85,
  "positionPercent": 20
}
```

---

## 🧮 Quick Calculator

**Given:** Portfolio = $P, Position% = X%, Leverage = L

```
Your Capital = $P × (X/100)
Total Position = Your Capital × L
Borrow = Your Capital × (L-1)
Borrow % = ((L-1)/L) × 100
```

**Example:** $10k portfolio, 20%, 3x leverage
```
Your Capital = $10,000 × 0.20 = $2,000
Total = $2,000 × 3 = $6,000
Borrow = $2,000 × 2 = $4,000
Borrow % = (2/3) × 100 = 66.7%
```

---

## 📞 Troubleshooting

| Problem | Solution |
|---------|----------|
| Not enough balance | Add funds OR reduce position % |
| Exceeds borrow limit | Increase maxBorrowPercent OR reduce leverage |
| Position too small | Increase position % OR increase leverage |
| Too risky | Decrease leverage OR decrease position % |

---

## 🎯 Best Practices

1. ✅ Start with 2x leverage
2. ✅ Use maxBorrowPercent = 50-70%
3. ✅ Keep position % = 10-20%
4. ✅ Always set stop loss
5. ✅ Enable autoRepay
6. ✅ Monitor margin level
7. ✅ Test with small amounts first

---

## 🚨 Warning Signs

| Leverage | Risk Level | Advice |
|----------|-----------|---------|
| 1-2x | Low ✅ | Safe for beginners |
| 3-4x | Medium ⚠️ | Requires experience |
| 5-10x | High 🔥 | Expert only |
| 10x+ | Extreme 💀 | Avoid unless pro |

---

## 📚 Need More Info?

- **Full Guide**: See `CORRECTED_LEVERAGE_LOGIC.md`
- **Implementation**: See `FINAL_IMPLEMENTATION.md`
- **User Guide**: See `README_MARGIN_TRADING.md`

---

**Remember:** Position % = YOUR capital allocation. Leverage multiplies from there! 🚀

