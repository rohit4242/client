<!-- c70853fb-429e-4324-8901-930fd02b0570 96a5986e-f1c7-4c5e-abf4-e8275c0ef62d -->
# Fixed Trading Amount Implementation

## Overview

Replace `portfolioPercent` with a fixed amount input where users can specify exact trade size in either quote currency (USDT) or base currency (BTC).

## Changes Required

### 1. Schema Update - [src/db/schema/signal-bot.ts](src/db/schema/signal-bot.ts)

Replace:

```typescript
portfolioPercent: z.number().min(1).max(100).default(20)
```

With:

```typescript
tradeAmount: z.number().positive("Amount must be positive"),
tradeAmountType: z.enum(["QUOTE", "BASE"]).default("QUOTE"), // QUOTE = USDT, BASE = BTC
```

### 2. Create Bot Dialog - [src/components/signal-bot/dialogs/create-bot-dialog.tsx](src/components/signal-bot/dialogs/create-bot-dialog.tsx)

**Replace Portfolio % with:**

- Toggle between "Quote Currency" (e.g., USDT) and "Base Currency" (e.g., BTC)
- Input field for amount
- Real-time validation showing:
  - Current balance of selected asset
  - "Sufficient" or "Insufficient" status
  - For margin: Max borrowable vs required amount

**Validation logic:**

- Spot: Check if `tradeAmount <= availableBalance`
- Margin: Check if `tradeAmount <= (availableBalance + maxBorrowable)`

### 3. Edit Bot Dialog - [src/components/signal-bot/dialogs/edit-bot-dialog.tsx](src/components/signal-bot/dialogs/edit-bot-dialog.tsx)

Same changes as create dialog

### 4. Types Update - [src/types/signal-bot.ts](src/types/signal-bot.ts)

Update interfaces to use `tradeAmount` and `tradeAmountType` instead of `portfolioPercent`

### 5. Fast Executor - [src/lib/signal-bot/fast-executor.ts](src/lib/signal-bot/fast-executor.ts)

Update position size calculation to use fixed amount instead of percentage:

- If `tradeAmountType === "QUOTE"`: Use amount directly as USDT value
- If `tradeAmountType === "BASE"`: Convert to quote value using current price

### 6. API Route - [src/app/api/signal-bots/route.ts](src/app/api/signal-bots/route.ts)

Update to handle new fields and backward compatibility with existing bots

### 7. Database Migration (Manual)

Add new columns to Bot model:

- `tradeAmount: Float`
- `tradeAmountType: String @default("QUOTE")`
- Keep `positionPercent` for backward compatibility (can be deprecated later)

### To-dos

- [ ] Update schema to use tradeAmount and tradeAmountType instead of portfolioPercent
- [ ] Update create dialog with amount input and real-time balance validation
- [ ] Update edit dialog with same amount input changes
- [ ] Update TypeScript types for new amount fields
- [ ] Update fast-executor to calculate position from fixed amount