# Admin User Selection Integration Status

## ✅ Completed Integrations

### 1. Exchanges (100% Complete)
**Files Modified:**
- ✅ `src/app/(admin)/exchanges/page.tsx` - Added selected user check
- ✅ `src/app/(admin)/exchanges/_components/exchanges-client.tsx` - Fetches exchanges for selected user
- ✅ `src/app/(admin)/exchanges/_components/exchange-header.tsx` - Shows selected user info
- ✅ `src/app/(admin)/exchanges/_components/connect-exchange-dialog.tsx` - Accepts userId parameter
- ✅ `src/db/actions/admin/get-exchanges-for-user.ts` - Server action for admin
- ✅ `src/db/actions/exchange/create-exchange.ts` - Accepts userId parameter
- ✅ `src/app/api/exchanges/route.ts` - POST accepts userId in body

**Features:**
- ✅ Shows NoUserSelected warning
- ✅ Displays "Managing exchanges for {name} ({email})"
- ✅ Fetches exchanges for selected user's portfolio
- ✅ Creates exchanges for selected user
- ✅ Reloads when user changes

### 2. Manual Trading (100% Complete)
**Files Modified:**
- ✅ `src/app/(admin)/manual-trading/page.tsx` - Added selected user check
- ✅ `src/app/(admin)/manual-trading/_components/manual-trading-view.tsx` - Accepts selectedUser
- ✅ `src/app/(admin)/manual-trading/_components/exchange-selector.tsx` - Uses userId to fetch exchanges
- ✅ `src/app/(admin)/manual-trading/_components/trading-form.tsx` - Accepts userId and portfolioId
- ✅ `src/app/api/order/create/route.ts` - Accepts userId and portfolioId, recalculates stats

**Features:**
- ✅ Shows NoUserSelected warning
- ✅ Displays "Trading for {name} ({email})"
- ✅ Fetches exchanges for selected user
- ✅ Creates positions for selected user's portfolio
- ✅ Auto-recalculates portfolio stats after order
- ✅ Creates portfolio if doesn't exist

### 3. Core Infrastructure (100% Complete)
**Files Created/Modified:**
- ✅ `src/contexts/selected-user-context.tsx` - Context + LocalStorage
- ✅ `src/db/actions/admin/get-customers.ts` - Fetch all customers
- ✅ `src/db/actions/admin/update-portfolio-stats.ts` - Auto-calculate stats
- ✅ `src/app/(admin)/_components/user-selector.tsx` - Dropdown selector
- ✅ `src/app/(admin)/_components/no-user-selected.tsx` - Warning component
- ✅ `src/app/(admin)/layout.tsx` - SelectedUserProvider wrapper
- ✅ `src/app/(admin)/_components/app-sidebar.tsx` - Integrated user selector

## ⏳ Remaining Work

### 4. Signal Bots (0% Complete)
**Files to Modify:**
- ⏳ `src/app/(admin)/signal-bot/page.tsx`
- ⏳ `src/app/(admin)/signal-bot/_components/signal-bot-client.tsx`
- ⏳ `src/app/(admin)/signal-bot/_components/dialogs/create-signal-bot-dialog.tsx`
- ⏳ `src/db/actions/admin/get-signal-bots-for-user.ts` (create)
- ⏳ `src/app/api/signal-bots/route.ts`

**Required Changes:**
```typescript
// Page
const { selectedUser } = useSelectedUser();
if (!selectedUser) return <NoUserSelected />;
return <SignalBotClient selectedUser={selectedUser} />;

// Client
useQuery({
  queryKey: ["signal-bots", userId],
  queryFn: () => getSignalBotsForUser(userId),
});

// API
const { userId, ...botData } = body;
const targetUserId = userId || session.user.id;
// Create bot for targetUserId's portfolio
```

### 5. Positions (0% Complete)
**Files to Modify:**
- ⏳ `src/app/(admin)/positions/page.tsx`
- ⏳ `src/db/actions/admin/get-positions-for-user.ts` (create)
- ⏳ `src/app/api/positions/route.ts`
- ⏳ `src/app/api/positions/[id]/route.ts` (close position)

**Required Changes:**
```typescript
// Page
const { selectedUser } = useSelectedUser();
if (!selectedUser) return <NoUserSelected />;
const positions = await getPositionsForUser(selectedUser.id);

// API
const { userId } = body;
const targetUserId = userId || session.user.id;
// Get positions for targetUserId's portfolio
// After closing position: recalculatePortfolioStats(targetUserId)
```

### 6. Dashboard (0% Complete)
**Files to Modify:**
- ⏳ `src/app/(admin)/dashboard/page.tsx`
- ⏳ `src/db/actions/admin/get-dashboard-stats-for-user.ts` (create)

**Required Changes:**
```typescript
// Page
const { selectedUser } = useSelectedUser();
if (!selectedUser) {
  return <EmptyDashboard message="Select a customer to view dashboard" />;
}
const stats = await getDashboardStatsForUser(selectedUser.id);

// Show stats for selected user
```

### 7. Additional API Routes

#### Positions API (`/api/positions/[id]/route.ts`)
- ⏳ Update PUT (update position)
- ⏳ Update DELETE (close position)
- ⏳ Call `recalculatePortfolioStats` after changes

#### Signal Bot API (`/api/webhook/signal-bot/route.ts`)
- ⏳ Ensure signal processing uses correct portfolio
- ⏳ Call `recalculatePortfolioStats` after signal execution

#### Orders API (`/api/order/get/route.ts`)
- ⏳ Accept userId parameter
- ⏳ Fetch orders for selected user's portfolio

## Implementation Checklist

For each remaining feature, follow this pattern:

### Pattern 1: Page Component
```typescript
"use client";

import { useSelectedUser } from "@/contexts/selected-user-context";
import { NoUserSelected } from "../_components/no-user-selected";

export default function FeaturePage() {
  const { selectedUser } = useSelectedUser();

  if (!selectedUser) {
    return (
      <div className="space-y-6">
        <div>
          <h1>Feature Name</h1>
          <p>Description</p>
        </div>
        <NoUserSelected />
      </div>
    );
  }

  return <FeatureClient selectedUser={selectedUser} />;
}
```

### Pattern 2: Server Action
```typescript
"use server";

import { isAdmin } from "@/lib/auth-utils";
import db from "@/db";

export async function getDataForUser(userId: string) {
  const admin = await isAdmin();
  if (!admin) throw new Error("Unauthorized");

  const portfolio = await db.portfolio.findFirst({
    where: { userId },
  });

  if (!portfolio) return [];

  return await db.yourModel.findMany({
    where: { portfolioId: portfolio.id },
  });
}
```

### Pattern 3: API Route
```typescript
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const body = await request.json();
  const { userId, ...data } = body;
  const targetUserId = userId || session.user.id;

  let portfolio = await db.portfolio.findFirst({
    where: { userId: targetUserId },
  });

  // Create if doesn't exist
  if (!portfolio && userId) {
    portfolio = await db.portfolio.create({
      data: { userId: targetUserId },
    });
  }

  // Perform action...
  
  // Recalculate stats
  await recalculatePortfolioStats(targetUserId);

  return NextResponse.json(result);
}
```

## Testing Procedure

For each feature:

1. ✅ Select a customer from sidebar
2. ✅ Verify header shows customer name/email
3. ✅ Perform create action
4. ✅ Check database - data associated with correct user
5. ✅ Switch customers
6. ✅ Verify data reloads for new customer
7. ✅ Check customer portal - verify changes visible
8. ✅ Verify portfolio stats updated

## Priority Order

1. ✅ **Exchanges** - DONE
2. ✅ **Manual Trading** - DONE  
3. ⏳ **Signal Bots** - HIGH PRIORITY (automated trading)
4. ⏳ **Positions** - HIGH PRIORITY (view/manage positions)
5. ⏳ **Dashboard** - MEDIUM PRIORITY (overview)
6. ⏳ **API Routes** - MEDIUM PRIORITY (supporting functionality)

## Estimated Remaining Time

- Signal Bots: ~30 minutes
- Positions: ~20 minutes
- Dashboard: ~15 minutes
- API Routes: ~15 minutes

**Total: ~80 minutes** to complete full integration

## Key Benefits

Once complete, admins will be able to:
- ✅ Select any customer from sidebar
- ✅ Create exchanges for that customer
- ✅ Execute trades for that customer
- ⏳ Create bots for that customer
- ⏳ View/manage that customer's positions
- ⏳ See that customer's dashboard stats
- ✅ Auto-update customer's portfolio statistics
- ✅ Customer sees all changes in real-time

## Notes

- All portfolio stats auto-calculate after actions
- Portfolio created automatically if doesn't exist
- Selected user persists in localStorage
- Admin can switch between customers instantly
- Customer portal remains read-only

