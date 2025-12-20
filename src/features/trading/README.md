# Signal Webhook System - Quick Reference

## 📍 Webhook Endpoint

```
POST /api/webhook/signal-bot/{botId}
```

## 📥 Supported Formats

### JSON Format
```json
{
  "action": "ENTER_LONG",
  "symbol": "BTCUSDT",
  "price": 45000,
  "message": "Optional message"
}
```

### String Format
```
ENTER-LONG_BINANCE_BTCUSDT_Name_4M_uuid
```

## 🎯 Valid Actions

- `ENTER_LONG` - Open long position (buy)
- `EXIT_LONG` - Close long position (sell)
- `ENTER_SHORT` - Open short position (sell/borrow)
- `EXIT_SHORT` - Close short position (buy back)

## 📁 File Structure

```
src/
├── app/api/webhook/signal-bot/[botId]/
│   └── route.ts                          # Webhook API endpoint
├── features/trading/
│   ├── actions/
│   │   └── process-signal.ts             # Signal processor (refactored)
│   ├── schemas/
│   │   └── signal.schema.ts              # Validation schemas (NEW)
│   └── utils/
│       └── signal-utils.ts               # Signal utilities (NEW)
└── lib/
    └── api-error-handler.ts              # Error codes (updated)
```

## 🔄 Processing Flow

```
1. Webhook receives signal → Validate format
2. Check bot exists & active
3. Create Signal record (processed: false)
4. Return 202 Accepted immediately
5. Process signal asynchronously
   - Build trading request
   - Execute via trading engine
   - Update signal status
6. Signal record updated (processed: true, positionId or error)
```

## ✅ Response Codes

| Code | Status | Description |
|------|--------|-------------|
| 202 | Accepted | Signal received and processing |
| 400 | Bad Request | Invalid payload format |
| 403 | Forbidden | Bot is inactive |
| 404 | Not Found | Bot not found |
| 500 | Internal Error | Unexpected error |

## 🧪 Quick Test

```bash
# Test with curl
curl -X POST http://localhost:3000/api/webhook/signal-bot/{botId} \
  -H "Content-Type: application/json" \
  -d '{"action":"ENTER_LONG","symbol":"BTCUSDT","price":45000}'
```

## 🔧 TradingView Integration

**Webhook URL:**
```
https://yourdomain.com/api/webhook/signal-bot/{botId}
```

**Alert Message:**
```json
{
  "action": "{{strategy.order.action}}",
  "symbol": "{{ticker}}",
  "price": {{close}},
  "message": "{{strategy.order.comment}}"
}
```

## 📊 Database

Signals are automatically recorded in the `Signal` table:
- `processed` - Processing status
- `processedAt` - When processed
- `positionId` - Associated position (if success)
- `error` - Error message (if failed)

## 🛠️ Key Functions

**Signal Utils (`signal-utils.ts`):**
- `parseWebhookPayload()` - Parse JSON or string format
- `createSignalRecord()` - Create database record
- `markSignalProcessed()` - Update processing status
- `getSignalWithBot()` - Fetch signal with bot info

**Process Signal (`process-signal.ts`):**
- `processSignalAction(signalId)` - Main signal processor

## 📝 Validation

All signals validated with Zod schemas:
- Action must be valid enum value
- Symbol is required and uppercase
- Price is optional positive number
- String format must match regex pattern

## 🚀 Performance

- **Response Time**: <100ms (async processing)
- **Format Support**: JSON + String
- **Database Ops**: 3 queries per signal
- **Concurrency**: Multiple signals processed in parallel

## 📖 Full Documentation

See [walkthrough.md](file:///C:/Users/Coder/.gemini/antigravity/brain/ca186bd8-6a2f-4a09-add4-7105da85bd54/walkthrough.md) for complete implementation details.
