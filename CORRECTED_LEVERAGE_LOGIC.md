# ✅ CORRECTED Leverage & Borrowing Logic

## 🎯 The Correct Formula

```
Your Capital Allocation = Portfolio Value × Position %
Total Position Size = Your Capital × Leverage
Amount to Borrow = Your Capital × (Leverage - 1)
```

## 📊 Key Principle

**`positionPercent` defines how much of YOUR OWN capital to allocate.**
- NOT the total position size
- NOT what's available in your account
- EXACTLY the percentage of portfolio you're risking

**`leverage` multiplies the position from your allocated capital.**

---

## 💡 Example 1: Basic 2x Leverage

### Setup
```
Portfolio: $10,000
Position %: 20%
Leverage: 2x
Available USDT: $2,500
```

### Calculation
```
Step 1: Your Capital Allocation
  = $10,000 × 20%
  = $2,000 ← You must use EXACTLY this much

Step 2: Total Position Size
  = $2,000 × 2
  = $4,000 ← This is how much BTC you'll control

Step 3: Amount to Borrow
  = $2,000 × (2 - 1)
  = $2,000 ← You borrow this amount

Step 4: Verify Balance
  You have: $2,500 ✅
  You need: $2,000 ✅
  Extra: $500 (stays in account)

Result:
  ✅ Use YOUR $2,000
  ✅ Borrow $2,000
  ✅ Buy $4,000 worth of BTC
  ✅ Extra $500 stays unused
```

---

## 💡 Example 2: Higher Leverage

### Setup
```
Portfolio: $10,000
Position %: 20%
Leverage: 3x
Available USDT: $2,500
```

### Calculation
```
Step 1: Your Capital = $10,000 × 20% = $2,000

Step 2: Total Position = $2,000 × 3 = $6,000

Step 3: Borrow = $2,000 × (3 - 1) = $4,000

Step 4: Borrow % Check
  Borrow: $4,000
  Position: $6,000
  Percentage: 66.7%

If maxBorrowPercent = 50%:
  ❌ REJECTED (66.7% > 50%)
  
If maxBorrowPercent = 70%:
  ✅ APPROVED (66.7% < 70%)
```

---

## 💡 Example 3: No Leverage (1x)

### Setup
```
Portfolio: $10,000
Position %: 20%
Leverage: 1x
Available USDT: $2,500
```

### Calculation
```
Step 1: Your Capital = $10,000 × 20% = $2,000

Step 2: Total Position = $2,000 × 1 = $2,000

Step 3: Borrow = $2,000 × (1 - 1) = $0

Result:
  ✅ Use YOUR $2,000
  ✅ Borrow $0
  ✅ Buy $2,000 worth of BTC
  ✅ No leverage, no borrowing
```

---

## 💡 Example 4: Not Enough Capital

### Setup
```
Portfolio: $10,000
Position %: 20%
Leverage: 2x
Available USDT: $1,500
```

### Calculation
```
Step 1: Your Capital Needed = $10,000 × 20% = $2,000

Step 2: Check Balance
  You have: $1,500
  You need: $2,000
  Missing: $500

Result:
  ❌ REJECTED
  Error: "Insufficient balance. Need $2,000 USDT 
         but only have $1,500 available"

Solutions:
  1. Add $500 to your account
  2. Reduce position % to 15% ($1,500)
  3. Reduce leverage (won't help in this case)
```

---

## 📈 Leverage vs Borrow Percentage Table

| Leverage | Formula | Borrow % of Position |
|----------|---------|---------------------|
| 1x | 0 × Your Capital | 0% |
| 2x | 1 × Your Capital | 50% |
| 3x | 2 × Your Capital | 66.7% |
| 4x | 3 × Your Capital | 75% |
| 5x | 4 × Your Capital | 80% |
| 10x | 9 × Your Capital | 90% |

**Formula:** `Borrow % = ((Leverage - 1) / Leverage) × 100`

---

## 🎯 Real Trading Example

### Scenario: Opening a Leveraged LONG

```
Portfolio: $10,000
Position %: 20%
Leverage: 2x
Max Borrow %: 50%
Available: $2,500 USDT
BTC Price: $50,000
```

### Step-by-Step

```
1. Calculate allocation
   Your Capital = $10,000 × 20% = $2,000
   
2. Apply leverage
   Total Position = $2,000 × 2 = $4,000
   
3. Calculate borrow
   Borrow = $2,000 × 1 = $2,000
   
4. Verify you have capital
   Need: $2,000
   Have: $2,500 ✅
   
5. Verify borrow limit
   Borrow: $2,000
   Position: $4,000
   Percentage: 50%
   Max Allowed: 50% ✅
   
6. Calculate quantity
   Quantity = $4,000 / $50,000 = 0.08 BTC
   
7. Execute
   ✅ Place order for 0.08 BTC
   ✅ Use $2,000 of your USDT
   ✅ Borrow $2,000 USDT
   ✅ Total: $4,000 position
```

### Position Created
```
Symbol: BTCUSDT
Side: LONG
Quantity: 0.08 BTC
Entry Price: $50,000
Entry Value: $4,000
Your Capital: $2,000
Borrowed: $2,000 USDT
Leverage: 2x
Side Effect: MARGIN_BUY
```

### If Price Goes Up 10%
```
New Price: $55,000
Position Value: 0.08 × $55,000 = $4,400
Repay Borrowed: $2,000
Your Remaining: $2,400
Your Profit: $400 (20% gain!)
```

### If Price Goes Down 10%
```
New Price: $45,000
Position Value: 0.08 × $45,000 = $3,600
Repay Borrowed: $2,000
Your Remaining: $1,600
Your Loss: $400 (20% loss!)
```

**Leverage amplifies BOTH gains and losses!**

---

## 🔧 Code Implementation

### LONG Position
```typescript
// Calculate YOUR capital allocation
const yourCapitalAllocation = (portfolioValue * positionPercent) / 100;

// Apply leverage
const leverage = bot.leverage || 1;
const totalPositionSize = yourCapitalAllocation * leverage;

// Calculate borrow amount
const amountToBorrow = yourCapitalAllocation * (leverage - 1);

// Verify balance
if (availableBalance < yourCapitalAllocation) {
  throw new Error("Insufficient balance");
}

// Verify borrow limit
const borrowPercentage = (amountToBorrow / totalPositionSize) * 100;
if (borrowPercentage > maxBorrowPercent) {
  throw new Error("Exceeds max borrow limit");
}

// Calculate quantity
const quantity = totalPositionSize / currentPrice;
```

### SHORT Position
```typescript
// Calculate YOUR capital allocation
const yourCapitalAllocation = (portfolioValue * positionPercent) / 100;

// Apply leverage
const leverage = bot.leverage || 1;
const totalPositionSize = yourCapitalAllocation * leverage;

// Calculate quantity needed
const totalQuantityNeeded = totalPositionSize / currentPrice;

// Your base asset allocation
const yourBaseAssetAllocation = yourCapitalAllocation / currentPrice;

// Borrow base asset
const baseAssetToBorrow = yourBaseAssetAllocation * (leverage - 1);

// Verify balance (need base asset for shorts)
if (availableBaseAsset < yourBaseAssetAllocation) {
  throw new Error("Insufficient base asset");
}

// Verify borrow limit
const borrowPercentage = (baseAssetToBorrow / totalQuantityNeeded) * 100;
if (borrowPercentage > maxBorrowPercent) {
  throw new Error("Exceeds max borrow limit");
}
```

---

## ⚠️ Important Notes

### 1. Position % is YOUR Capital
- `20%` means use 20% of YOUR portfolio
- NOT 20% of available balance
- NOT 20% of total position including leverage

### 2. Available Balance > Capital Needed
- You might have $5,000 available
- But if position % is 20% of $10k = $2,000
- You only use $2,000 (extra $3,000 stays)

### 3. Leverage Multiplies Position
- Your capital: $2,000
- 2x leverage: $4,000 position
- 3x leverage: $6,000 position
- 5x leverage: $10,000 position

### 4. Borrow = Capital × (Leverage - 1)
- Simple formula
- No complex calculations
- Predictable borrowing

### 5. MaxBorrowPercent is of TOTAL Position
- Not of your capital
- Not of borrowed amount
- Of the final position size

---

## 🧪 Test Your Understanding

### Question 1
```
Portfolio: $20,000
Position %: 10%
Leverage: 4x
Max Borrow %: 75%

What happens?
```

<details>
<summary>Answer</summary>

```
Your Capital = $20,000 × 10% = $2,000
Total Position = $2,000 × 4 = $8,000
Borrow = $2,000 × 3 = $6,000
Borrow % = 75%

Result: ✅ APPROVED (exactly at limit)
```
</details>

### Question 2
```
Portfolio: $15,000
Position %: 15%
Leverage: 3x
Max Borrow %: 60%
Available: $3,000

What happens?
```

<details>
<summary>Answer</summary>

```
Your Capital = $15,000 × 15% = $2,250
Total Position = $2,250 × 3 = $6,750
Borrow = $2,250 × 2 = $4,500
Borrow % = 66.7%

Check Balance: $3,000 > $2,250 ✅
Check Borrow Limit: 66.7% > 60% ❌

Result: ❌ REJECTED (exceeds 60% limit)
Need maxBorrowPercent of at least 67%
```
</details>

### Question 3
```
Portfolio: $10,000
Position %: 25%
Leverage: 2x
Max Borrow %: 50%
Available: $2,000

What happens?
```

<details>
<summary>Answer</summary>

```
Your Capital = $10,000 × 25% = $2,500
Total Position = $2,500 × 2 = $5,000
Borrow = $2,500 × 1 = $2,500
Borrow % = 50%

Check Balance: $2,000 < $2,500 ❌

Result: ❌ REJECTED (insufficient balance)
Need $2,500 but only have $2,000
```
</details>

---

## ✅ Summary

### The Simple Formula
```
Your Capital = Portfolio × Position %
Total Position = Your Capital × Leverage
Borrow Amount = Your Capital × (Leverage - 1)
```

### Three Validations
1. ✅ Do you have enough capital?
2. ✅ Can exchange lend that much?
3. ✅ Is it within maxBorrowPercent?

### Key Takeaway
**Position % defines YOUR capital allocation.**
**Leverage multiplies the position from there.**
**Simple, predictable, and easy to understand!**

---

_Implementation Complete: November 25, 2025_

