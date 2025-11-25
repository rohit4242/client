# Manual Trading Refactoring - Testing Guide

## Overview

The trading system has been refactored to use a service-layer architecture. This guide will help you test all functionality to ensure everything works correctly.

## What Changed

### Before
- Separate API routes: `/api/order/create` (spot) and `/api/margin/order/create` (margin)
- Duplicated logic in forms and API routes
- Tight coupling between UI and business logic

### After
- **New unified API**: `/api/trading/order` (handles both spot and margin)
- **Old APIs still work**: They now use the new service internally (backward compatible)
- **Reusable services**: Can be called from UI, signal bot, or any automation
- **Service layer**: `src/lib/services/order-service.ts` - main orchestrator

## File Changes

### New Files Created
```
src/lib/services/
├── order-service.ts           # Main order orchestrator
├── position-service.ts        # Position management
├── exchange/
│   ├── types.ts              # Shared types
│   ├── binance-spot.ts       # Spot order execution
│   └── binance-margin.ts     # Margin order execution
├── validators/
│   └── balance-validator.ts  # Balance validation
├── README.md                 # Service documentation
└── SIGNAL_BOT_INTEGRATION.md # Signal bot guide

src/app/api/trading/order/
└── route.ts                  # New unified API route
```

### Updated Files
```
src/app/api/order/create/route.ts         # Now uses order-service
src/app/api/margin/order/create/route.ts  # Now uses order-service
```

### Unchanged (Still Work As-Is)
```
src/components/trading/forms/spot-trading-form.tsx
src/components/trading/forms/margin-trading-form.tsx
All UI components and hooks
Signal bot webhook
```

## Testing Checklist

### 1. Spot Trading Tests

#### Test 1.1: Market Buy with Total Amount (quoteOrderQty)
- [ ] Navigate to Manual Trading page
- [ ] Select Spot trading
- [ ] Select an asset (e.g., BTCUSDT)
- [ ] Click BUY
- [ ] Click MARKET
- [ ] Enter a Total amount in USDT (e.g., 20 USDT)
- [ ] Verify cost breakdown shows correctly
- [ ] Click "Buy BTC" button
- [ ] **Expected**: Order executes successfully
- [ ] Verify position appears in positions list
- [ ] Check database: Position and Order records created with accountType=SPOT

#### Test 1.2: Market Buy with Quantity
- [ ] Select Spot trading
- [ ] Select BTC/USDT
- [ ] Click BUY
- [ ] Click MARKET
- [ ] Enter Amount (quantity) instead of Total (e.g., 0.001 BTC)
- [ ] Click "Buy BTC"
- [ ] **Expected**: Order executes successfully

#### Test 1.3: Market Sell
- [ ] Select Spot trading
- [ ] Ensure you have some BTC balance
- [ ] Select BTC/USDT
- [ ] Click SELL
- [ ] Click MARKET
- [ ] Enter Amount to sell
- [ ] Click "Sell BTC"
- [ ] **Expected**: Order executes successfully

#### Test 1.4: Limit Buy
- [ ] Select Spot trading
- [ ] Click BUY
- [ ] Click LIMIT
- [ ] Enter Quantity and Price (below current price for buy)
- [ ] Click "Buy BTC"
- [ ] **Expected**: Limit order placed successfully

#### Test 1.5: Limit Sell
- [ ] Click SELL
- [ ] Click LIMIT
- [ ] Enter Quantity and Price (above current price for sell)
- [ ] Click "Sell BTC"
- [ ] **Expected**: Limit order placed successfully

### 2. Margin Trading Tests

#### Test 2.1: Market Buy - NO_SIDE_EFFECT
- [ ] Navigate to Manual Trading page
- [ ] Select Margin trading
- [ ] Select an asset
- [ ] Click BUY
- [ ] Select "No Auto Borrow/Repay" from Side Effect dropdown
- [ ] Enter Total amount
- [ ] **Expected**: Only works if you have sufficient margin balance
- [ ] Check database: accountType=MARGIN, sideEffectType=NO_SIDE_EFFECT

#### Test 2.2: Market Buy - MARGIN_BUY (Auto Borrow)
- [ ] Select Margin trading
- [ ] Click BUY
- [ ] Select "Auto Borrow" from Side Effect dropdown
- [ ] Enter Total amount (more than your balance)
- [ ] See explanation: "If you don't have enough USDT, it will be automatically borrowed"
- [ ] Click "Buy BTC"
- [ ] **Expected**: Order executes even with insufficient balance
- [ ] Binance automatically borrows the missing amount
- [ ] Check Binance margin account for borrowed amount

#### Test 2.3: Market Sell - MARGIN_BUY (Short Selling)
- [ ] Select Margin trading
- [ ] Click SELL
- [ ] Select "Auto Borrow" from Side Effect dropdown
- [ ] See explanation: "You'll borrow BTC to sell it (SHORT position)"
- [ ] Enter Amount to short
- [ ] Click "Sell BTC"
- [ ] **Expected**: Order executes (borrows BTC to sell)
- [ ] Creates a short position
- [ ] Check Binance margin account for borrowed BTC

#### Test 2.4: Market Sell - AUTO_REPAY
- [ ] Have some borrowed USDT in margin account
- [ ] Select Margin trading
- [ ] Click SELL
- [ ] Select "Auto Repay" from Side Effect dropdown
- [ ] Enter Amount to sell
- [ ] Click "Sell BTC"
- [ ] **Expected**: Sell proceeds automatically repay USDT debt

#### Test 2.5: Margin Limit Orders
- [ ] Test limit buy with each side effect type
- [ ] Test limit sell with each side effect type
- [ ] **Expected**: All work correctly

### 3. Error Handling Tests

#### Test 3.1: Insufficient Balance (Spot)
- [ ] Try to buy more than your balance allows
- [ ] **Expected**: Clear error message: "Insufficient USDT balance"

#### Test 3.2: Insufficient Balance (Margin - NO_SIDE_EFFECT)
- [ ] Try margin buy with insufficient balance and NO_SIDE_EFFECT
- [ ] **Expected**: Clear error about insufficient balance

#### Test 3.3: Invalid Order (Below Minimum)
- [ ] Try to place an order below minimum notional
- [ ] **Expected**: Error message with minimum amount

#### Test 3.4: API Key Issues
- [ ] If possible, test with invalid API keys
- [ ] **Expected**: Clear error about authentication

### 4. API Compatibility Tests

#### Test 4.1: Old Spot API Still Works
```bash
# Test the old spot API endpoint
curl -X POST http://localhost:3000/api/order/create \
  -H "Content-Type: application/json" \
  -d '{
    "exchange": {...},
    "order": {
      "symbol": "BTCUSDT",
      "side": "BUY",
      "type": "MARKET",
      "quoteOrderQty": "20"
    },
    "userId": "...",
    "portfolioId": "..."
  }'
```
- [ ] **Expected**: Works correctly, returns success

#### Test 4.2: Old Margin API Still Works
```bash
# Test the old margin API endpoint
curl -X POST http://localhost:3000/api/margin/order/create \
  -H "Content-Type: application/json" \
  -d '{
    "exchange": {...},
    "order": {
      "symbol": "BTCUSDT",
      "side": "BUY",
      "type": "MARKET",
      "quoteOrderQty": "20",
      "sideEffectType": "MARGIN_BUY"
    },
    "userId": "...",
    "portfolioId": "..."
  }'
```
- [ ] **Expected**: Works correctly, returns success

#### Test 4.3: New Unified API Works
```bash
# Test the new unified API endpoint
curl -X POST http://localhost:3000/api/trading/order \
  -H "Content-Type: application/json" \
  -d '{
    "exchange": {...},
    "order": {
      "symbol": "BTCUSDT",
      "side": "BUY",
      "type": "MARKET",
      "quoteOrderQty": "20"
    },
    "userId": "...",
    "portfolioId": "..."
  }'
```
- [ ] **Expected**: Works correctly, returns success

### 5. Database Verification

After each successful test, verify in database:

#### Check Position Table
```sql
SELECT 
  id, symbol, side, type, status, 
  accountType, sideEffectType, source,
  entryPrice, quantity, entryValue
FROM Position 
ORDER BY createdAt DESC 
LIMIT 5;
```
- [ ] accountType is correct (SPOT or MARGIN)
- [ ] sideEffectType is correct
- [ ] source is MANUAL
- [ ] All fields populated correctly

#### Check Order Table
```sql
SELECT 
  id, positionId, symbol, side, type, 
  status, accountType, sideEffectType,
  price, quantity, value
FROM Order 
ORDER BY createdAt DESC 
LIMIT 5;
```
- [ ] Linked to correct position
- [ ] accountType matches position
- [ ] orderId from Binance populated
- [ ] status is FILLED

### 6. UI Verification

#### Check Portfolio Stats
- [ ] Navigate to portfolio/dashboard
- [ ] Verify total value updated
- [ ] Verify P&L calculations
- [ ] Verify position counts

#### Check Position List
- [ ] Positions appear immediately after order
- [ ] Correct icons for SPOT vs MARGIN
- [ ] Correct side (LONG/SHORT)
- [ ] Can close positions

### 7. Signal Bot Compatibility

#### Test 7.1: Existing Webhook Still Works
```bash
curl -X POST http://localhost:3000/api/webhook/signal-bot \
  -H "Content-Type: application/json" \
  -d '{
    "action": "ENTER_LONG",
    "symbol": "BTCUSDT",
    "price": 50000,
    "botId": "your-bot-id",
    "secret": "your-secret"
  }'
```
- [ ] **Expected**: Signal processed successfully
- [ ] Position created via signal bot

## Performance Testing

### Compare Before/After
1. Time 10 manual orders before refactoring
2. Time 10 manual orders after refactoring
3. **Expected**: Similar or better performance (no extra API calls)

### Check Console Logs
- [ ] Look for service logs: `[Order Service]`, `[Spot Service]`, `[Margin Service]`
- [ ] Verify execution flow is clear and logical
- [ ] No duplicate API calls to Binance

## Common Issues & Solutions

### Issue: "Failed to create position"
- **Cause**: Database connection issue
- **Solution**: Check database connection, restart dev server

### Issue: "Insufficient balance"
- **Cause**: Not enough funds in account
- **Solution**: Add funds or test with smaller amount

### Issue: "Invalid webhook secret"
- **Cause**: Signal bot webhook secret mismatch
- **Solution**: Verify webhook secret in bot configuration

### Issue: Order succeeds but UI doesn't update
- **Cause**: Cache not revalidated
- **Solution**: Hard refresh page (Ctrl+Shift+R)

## Rollback Plan

If critical issues are found:

1. The old API routes are still working (they use new service internally)
2. To fully rollback, revert these commits:
   - Service layer creation
   - API route updates
3. Forms don't need changes (they just call API endpoints)

## Success Criteria

✅ All spot trading scenarios work
✅ All margin trading scenarios work  
✅ Error handling is clear and helpful
✅ Database records are correct
✅ Signal bot still works
✅ Performance is same or better
✅ No new bugs introduced

## Next Steps After Testing

Once all tests pass:

1. **Optional**: Update forms to call new `/api/trading/order` instead of old endpoints
2. **Optional**: Migrate signal bot to use `executeOrder()` service directly
3. **Optional**: Add more validation in balance-validator
4. **Future**: Add isolated margin support
5. **Future**: Add more order types (stop-loss, OCO, etc.)

## Support

If you encounter issues:
1. Check console logs for detailed errors
2. Check database for any orphaned records
3. Verify Binance API credentials
4. Check network tab for API responses

