# Signal Bot Margin Trading - Test Scenarios

## Quick Verification Tests

These test scenarios can be used to verify the margin trading functionality is working correctly.

## Scenario 1: Sufficient Balance (No Borrowing Needed)

### Configuration
```json
{
  "botName": "Test Bot 1 - No Borrow",
  "accountType": "MARGIN",
  "marginType": "CROSS",
  "symbol": "BTCUSDT",
  "currentPrice": 50000,
  "portfolioValue": 10000,
  "positionPercent": 10,
  "leverage": 2,
  "maxBorrowPercent": 50,
  "availableUSDT": 2500
}
```

### Expected Calculations
```
Step 1: Calculate base position value
  Base Position Value = $10,000 × 10% = $1,000

Step 2: Apply leverage
  Leveraged Position Value = $1,000 × 2 = $2,000

Step 3: Check available balance
  Available USDT = $2,500
  Required USDT = $2,000
  
Step 4: Calculate borrowing need
  Borrow Amount = max(0, $2,000 - $2,500) = $0

Step 5: Validate borrow limit
  Max Allowed Borrow = $2,000 × 50% = $1,000
  Actual Borrow = $0
  Status: ✅ PASS (within limit)

Step 6: Calculate quantity
  Quantity = $2,000 / $50,000 = 0.04 BTC
```

### Expected Result
- ✅ Order should execute successfully
- Side Effect: `NO_SIDE_EFFECT` or `AUTO_REPAY` (depending on autoRepay setting)
- Position Quantity: 0.04 BTC
- Entry Value: $2,000
- Borrowed Amount: $0
- Borrowed Asset: null or "USDT"

---

## Scenario 2: Partial Borrowing (Within Limit)

### Configuration
```json
{
  "botName": "Test Bot 2 - Partial Borrow",
  "accountType": "MARGIN",
  "marginType": "CROSS",
  "symbol": "BTCUSDT",
  "currentPrice": 50000,
  "portfolioValue": 10000,
  "positionPercent": 20,
  "leverage": 2,
  "maxBorrowPercent": 50,
  "availableUSDT": 2500
}
```

### Expected Calculations
```
Step 1: Calculate base position value
  Base Position Value = $10,000 × 20% = $2,000

Step 2: Apply leverage
  Leveraged Position Value = $2,000 × 2 = $4,000

Step 3: Check available balance
  Available USDT = $2,500
  Required USDT = $4,000
  
Step 4: Calculate borrowing need
  Borrow Amount = $4,000 - $2,500 = $1,500

Step 5: Validate borrow limit
  Max Allowed Borrow = $4,000 × 50% = $2,000
  Actual Borrow = $1,500
  Borrow Percentage = ($1,500 / $4,000) × 100% = 37.5%
  Status: ✅ PASS (37.5% < 50%)

Step 6: Calculate quantity
  Quantity = $4,000 / $50,000 = 0.08 BTC
```

### Expected Result
- ✅ Order should execute successfully
- Side Effect: `MARGIN_BUY` or `AUTO_BORROW_REPAY`
- Position Quantity: 0.08 BTC
- Entry Value: $4,000
- Borrowed Amount: $1,500 USDT
- Borrowed Asset: "USDT"

---

## Scenario 3: Exceeds Borrow Limit (Should Fail)

### Configuration
```json
{
  "botName": "Test Bot 3 - Exceeds Limit",
  "accountType": "MARGIN",
  "marginType": "CROSS",
  "symbol": "BTCUSDT",
  "currentPrice": 50000,
  "portfolioValue": 10000,
  "positionPercent": 20,
  "leverage": 3,
  "maxBorrowPercent": 50,
  "availableUSDT": 1500
}
```

### Expected Calculations
```
Step 1: Calculate base position value
  Base Position Value = $10,000 × 20% = $2,000

Step 2: Apply leverage
  Leveraged Position Value = $2,000 × 3 = $6,000

Step 3: Check available balance
  Available USDT = $1,500
  Required USDT = $6,000
  
Step 4: Calculate borrowing need
  Borrow Amount = $6,000 - $1,500 = $4,500

Step 5: Validate borrow limit
  Max Allowed Borrow = $6,000 × 50% = $3,000
  Actual Borrow = $4,500
  Borrow Percentage = ($4,500 / $6,000) × 100% = 75%
  Status: ❌ FAIL (75% > 50%)
```

### Expected Result
- ❌ Order should be REJECTED
- Error Message: "Borrow amount 4500.00000000 USDT exceeds bot's max borrow limit of 50% (3000.00000000 USDT)"
- No position created
- No order executed

---

## Scenario 4: SHORT Position with Borrowing

### Configuration
```json
{
  "botName": "Test Bot 4 - Short",
  "accountType": "MARGIN",
  "marginType": "CROSS",
  "symbol": "BTCUSDT",
  "currentPrice": 50000,
  "portfolioValue": 10000,
  "positionPercent": 10,
  "leverage": 2,
  "maxBorrowPercent": 60,
  "availableBTC": 0.01
}
```

### Expected Calculations
```
Step 1: Calculate base position value
  Base Position Value = $10,000 × 10% = $1,000

Step 2: Apply leverage
  Leveraged Position Value = $1,000 × 2 = $2,000

Step 3: Calculate BTC quantity needed
  BTC Quantity Needed = $2,000 / $50,000 = 0.04 BTC

Step 4: Check available balance
  Available BTC = 0.01 BTC
  Required BTC = 0.04 BTC
  
Step 5: Calculate borrowing need
  Borrow Amount = 0.04 - 0.01 = 0.03 BTC

Step 6: Validate borrow limit
  Max Allowed Borrow = 0.04 × 60% = 0.024 BTC
  Actual Borrow = 0.03 BTC
  Borrow Percentage = (0.03 / 0.04) × 100% = 75%
  Status: ❌ FAIL (75% > 60%)
```

### Expected Result
- ❌ Order should be REJECTED
- Error Message: "Borrow amount 0.03000000 BTC exceeds bot's max borrow limit of 60% (0.02400000 BTC)"
- No position created
- No order executed

---

## Scenario 5: SHORT Position Within Limit

### Configuration
```json
{
  "botName": "Test Bot 5 - Short Success",
  "accountType": "MARGIN",
  "marginType": "CROSS",
  "symbol": "BTCUSDT",
  "currentPrice": 50000,
  "portfolioValue": 10000,
  "positionPercent": 10,
  "leverage": 2,
  "maxBorrowPercent": 80,
  "availableBTC": 0.015
}
```

### Expected Calculations
```
Step 1: Calculate base position value
  Base Position Value = $10,000 × 10% = $1,000

Step 2: Apply leverage
  Leveraged Position Value = $1,000 × 2 = $2,000

Step 3: Calculate BTC quantity needed
  BTC Quantity Needed = $2,000 / $50,000 = 0.04 BTC

Step 4: Check available balance
  Available BTC = 0.015 BTC
  Required BTC = 0.04 BTC
  
Step 5: Calculate borrowing need
  Borrow Amount = 0.04 - 0.015 = 0.025 BTC

Step 6: Validate borrow limit
  Max Allowed Borrow = 0.04 × 80% = 0.032 BTC
  Actual Borrow = 0.025 BTC
  Borrow Percentage = (0.025 / 0.04) × 100% = 62.5%
  Status: ✅ PASS (62.5% < 80%)
```

### Expected Result
- ✅ Order should execute successfully
- Side Effect: `MARGIN_BUY`
- Position Quantity: 0.04 BTC (SHORT)
- Entry Value: $2,000
- Borrowed Amount: 0.025 BTC
- Borrowed Asset: "BTC"

---

## Scenario 6: High Leverage with Conservative Borrow Limit

### Configuration
```json
{
  "botName": "Test Bot 6 - High Leverage",
  "accountType": "MARGIN",
  "marginType": "CROSS",
  "symbol": "ETHUSDT",
  "currentPrice": 3000,
  "portfolioValue": 10000,
  "positionPercent": 10,
  "leverage": 5,
  "maxBorrowPercent": 30,
  "availableUSDT": 800
}
```

### Expected Calculations
```
Step 1: Calculate base position value
  Base Position Value = $10,000 × 10% = $1,000

Step 2: Apply leverage
  Leveraged Position Value = $1,000 × 5 = $5,000

Step 3: Check available balance
  Available USDT = $800
  Required USDT = $5,000
  
Step 4: Calculate borrowing need
  Borrow Amount = $5,000 - $800 = $4,200

Step 5: Validate borrow limit
  Max Allowed Borrow = $5,000 × 30% = $1,500
  Actual Borrow = $4,200
  Borrow Percentage = ($4,200 / $5,000) × 100% = 84%
  Status: ❌ FAIL (84% > 30%)
```

### Expected Result
- ❌ Order should be REJECTED
- Error Message: "Borrow amount 4200.00000000 USDT exceeds bot's max borrow limit of 30% (1500.00000000 USDT)"
- Recommendation: Either increase maxBorrowPercent to at least 85%, reduce leverage, or add more funds

---

## Scenario 7: Spot Trading (No Leverage Allowed)

### Configuration
```json
{
  "botName": "Test Bot 7 - Spot",
  "accountType": "SPOT",
  "symbol": "BTCUSDT",
  "currentPrice": 50000,
  "portfolioValue": 10000,
  "positionPercent": 10,
  "leverage": 3,
  "availableUSDT": 1000
}
```

### Expected Calculations
```
Step 1: Calculate base position value
  Base Position Value = $10,000 × 10% = $1,000

Step 2: Force leverage to 1x (spot limitation)
  Leverage = 1 (forced, regardless of config)
  Position Value = $1,000 × 1 = $1,000

Step 3: Check available balance
  Available USDT = $1,000
  Required USDT = $1,000
  
Step 4: Calculate quantity
  Quantity = $1,000 / $50,000 = 0.02 BTC
```

### Expected Result
- ✅ Order should execute successfully
- Position Quantity: 0.02 BTC
- Entry Value: $1,000
- Leverage: 1 (forced)
- Borrowed Amount: 0
- Account Type: SPOT

---

## Integration Test Checklist

### Pre-Test Setup
- [ ] Create test bot with known configuration
- [ ] Fund test account with known amounts
- [ ] Verify exchange connection is active
- [ ] Enable test bot

### During Test
- [ ] Send webhook signal
- [ ] Check logs for calculation details
- [ ] Verify position created in database
- [ ] Check borrowed amounts are tracked
- [ ] Verify side effect type is correct

### Post-Test Validation
- [ ] Position values match calculations
- [ ] Borrowed amounts recorded correctly
- [ ] Interest tracking initialized
- [ ] Bot stats updated
- [ ] Exchange balance reflects trade

### Error Scenarios to Test
- [ ] Insufficient exchange balance
- [ ] Exceeds max borrowable (exchange limit)
- [ ] Exceeds maxBorrowPercent (bot limit)
- [ ] Invalid symbol
- [ ] Inactive bot
- [ ] Invalid webhook secret
- [ ] Duplicate position (already open)

---

## Manual Testing Steps

### 1. Setup Test Bot
```bash
# Create bot via UI or API with:
- accountType: MARGIN
- marginType: CROSS
- leverage: 2
- maxBorrowPercent: 50
- positionPercent: 10
- stopLoss: 2
- takeProfit: 5
```

### 2. Fund Account
```bash
# Ensure test account has:
- Some USDT for collateral
- Not enough for full leveraged position
- This will trigger borrowing
```

### 3. Send Test Signal
```bash
curl -X POST https://your-domain.com/api/webhook/signal-bot \
  -H "Content-Type: application/json" \
  -d '{
    "action": "ENTER_LONG",
    "symbol": "BTCUSDT",
    "botId": "your-bot-id",
    "secret": "your-secret"
  }'
```

### 4. Check Response
```json
{
  "success": true,
  "signalId": "signal-id",
  "positionId": "position-id",
  "action": "ENTER_LONG",
  "symbol": "BTCUSDT",
  "price": 50000,
  "message": "Margin LONG position opened..."
}
```

### 5. Verify Database
```sql
SELECT 
  id,
  symbol,
  side,
  quantity,
  entryValue,
  leverage,
  borrowedAmount,
  borrowedAsset,
  sideEffectType
FROM position
WHERE id = 'position-id';
```

### 6. Check Logs
Look for these log entries:
```
Position calculation: {...}
Order calculation result: {...}
Margin order details: {...}
Margin order result: {...}
```

---

## Common Issues & Solutions

### Issue 1: "Insufficient borrowable amount"
**Cause**: Not enough collateral in account
**Solution**: 
- Add more funds to margin account
- Reduce leverage
- Reduce position percentage

### Issue 2: "Exceeds max borrow limit"
**Cause**: Trying to borrow more than maxBorrowPercent allows
**Solution**:
- Increase maxBorrowPercent
- Reduce leverage
- Add more own funds
- Reduce position percentage

### Issue 3: borrowedAmount always 0
**Cause**: Using old code or position has sufficient balance
**Solution**:
- Verify code is updated
- Check available balance (might have enough)
- Review calculation logs

### Issue 4: Wrong side effect type
**Cause**: Logic issue in side effect selection
**Solution**:
- Check autoRepay setting
- Verify borrowAmount > 0
- Review logs for side effect determination

---

## Success Criteria

A successful implementation should:
1. ✅ Calculate leverage correctly
2. ✅ Check available balance accurately
3. ✅ Calculate borrow amount precisely
4. ✅ Enforce maxBorrowPercent limit
5. ✅ Validate against exchange limits
6. ✅ Select correct side effect type
7. ✅ Track borrowed amounts
8. ✅ Record borrowed asset
9. ✅ Handle errors gracefully
10. ✅ Log all calculations for debugging

---

**Next Steps**: Run through each scenario and verify expected results match actual results.

