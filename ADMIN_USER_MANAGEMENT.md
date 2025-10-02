# Admin User Management Documentation

## Overview

Admins can manage multiple customers through the admin portal. A user selector component allows admins to choose which customer they want to perform actions for.

## Features

### 1. User Selector Component

Located in the admin sidebar, the user selector displays:

- **Selected Customer**: Shows avatar, name, and email
- **Customer List**: Dropdown with all customers
- **Search/Filter**: Quick keyboard shortcuts (⌘1, ⌘2, etc.)
- **Portfolio Status**: Badge showing if customer has a portfolio
- **Add Customer**: Quick link to add new customers

### 2. Selected User Context

The selected user is stored in:
- **React Context**: For component access
- **LocalStorage**: Persists across sessions

#### Usage in Components

```typescript
import { useSelectedUser } from "@/contexts/selected-user-context";

function MyComponent() {
  const { selectedUser, setSelectedUser, clearSelectedUser } = useSelectedUser();
  
  if (!selectedUser) {
    return <NoUserSelected />;
  }
  
  // Use selectedUser.id for admin actions
}
```

## Admin Actions

All admin actions now require a selected customer:

### Server Actions

Location: `src/db/actions/admin/`

#### 1. **Get Customers**
```typescript
getCustomers(): Promise<Customer[]>
```
- Returns all users with CUSTOMER role
- Includes portfolio status
- Ordered by creation date (newest first)

#### 2. **Create Portfolio**
```typescript
createCustomerPortfolio(userId: string): Promise<string | null>
```
- Creates a portfolio for a customer
- Returns portfolio ID on success
- Checks if portfolio already exists

#### 3. **Recalculate Portfolio Stats**
```typescript
recalculatePortfolioStats(userId: string): Promise<boolean>
```
- Recalculates all portfolio statistics
- Called after position/order changes
- Updates:
  - Total P&L and percentage
  - Win/Loss counts and rate
  - Average win/loss amounts
  - Largest win/loss
  - Profit factor
  - Time-based P&L (daily/weekly/monthly)
  - Current balance

## Data Flow

```
Admin Selects Customer
    ↓
User Stored in Context + LocalStorage
    ↓
Admin Performs Action (Create Position, Execute Order, etc.)
    ↓
Action uses selectedUser.id
    ↓
Database Updated for Selected Customer
    ↓
Portfolio Statistics Recalculated
    ↓
Customer Sees Updated Data in Customer Portal
```

## Portfolio Statistics Auto-Calculation

When admin performs actions, the system automatically updates:

### After Creating Position
- `activeTrades` count increases
- `totalTrades` count increases
- Current balance adjusted

### After Closing Position
- P&L calculated and added to `totalPnl`
- Win/Loss counts updated
- `winRate` recalculated
- `avgWinAmount` / `avgLossAmount` updated
- `largestWin` / `largestLoss` checked and updated
- `profitFactor` recalculated
- `activeTrades` count decreases
- Time-based P&L updated based on timestamp

### After Order Execution
- Position entry/exit prices updated
- P&L recalculated
- Fill percentage tracked

### After Bot Signal Processed
- Position created/closed based on signal
- All position-related stats updated

## Customer Model Structure

```typescript
interface Customer {
  id: string;              // User ID
  name: string;            // Display name
  email: string;           // Email address
  image: string | null;    // Profile image
  createdAt: string;       // Account creation date
  hasPortfolio: boolean;   // Portfolio exists
  portfolioId?: string;    // Portfolio ID (if exists)
}
```

## Security

### Admin Authorization

All admin actions check:
```typescript
const admin = await isAdmin();
if (!admin) {
  throw new Error("Unauthorized: Admin access required");
}
```

### User Validation

Actions validate:
- Customer exists in database
- Customer has CUSTOMER role
- Portfolio belongs to customer

## UI Components

### User Selector (`user-selector.tsx`)

Features:
- Avatar display (image or generated)
- Customer name and email
- Portfolio status badge
- Keyboard shortcuts
- Scroll area for many customers
- Selected indicator (checkmark)

### No User Selected (`no-user-selected.tsx`)

Shows when:
- No customer selected
- Admin navigates to action page

Displays:
- Warning alert
- Instructions to select customer

## Integration Points

### Admin Dashboard
- Shows warning if no user selected
- Displays selected customer name
- Can create positions/orders for selected user

### Manual Trading
- Requires selected user
- Creates positions for selected customer
- Updates their portfolio stats

### Exchanges
- Links exchanges to selected customer's portfolio
- API keys stored per customer

### Signal Bots
- Creates bots for selected customer
- Signals processed for their portfolio

### Positions
- Shows positions for selected customer
- Can close positions for them
- Updates their P&L

## Best Practices

### For Admins

1. **Always Select Customer First**
   - Select from sidebar before performing actions
   - Verify correct customer is selected
   - Check portfolio status

2. **Create Portfolio if Needed**
   - New customers may not have portfolio
   - Click "Create Portfolio" button
   - Initial balance can be set

3. **Monitor Statistics**
   - Statistics auto-update after actions
   - Check P&L and win rate
   - Review performance metrics

4. **Switch Customers**
   - Click user selector dropdown
   - Choose different customer
   - All subsequent actions affect new customer

### For Developers

1. **Use Context**
   ```typescript
   const { selectedUser } = useSelectedUser();
   ```

2. **Check Selection**
   ```typescript
   if (!selectedUser) {
     return <NoUserSelected />;
   }
   ```

3. **Pass User ID to Actions**
   ```typescript
   await createPosition({
     userId: selectedUser.id,
     portfolioId: selectedUser.portfolioId,
     // ... other params
   });
   ```

4. **Recalculate Stats**
   ```typescript
   await recalculatePortfolioStats(selectedUser.id);
   ```

## Example: Creating a Position

```typescript
"use client";

import { useSelectedUser } from "@/contexts/selected-user-context";
import { NoUserSelected } from "@/app/(admin)/_components/no-user-selected";
import { createPosition } from "@/db/actions/admin/create-position";
import { recalculatePortfolioStats } from "@/db/actions/admin/update-portfolio-stats";

export function CreatePositionPage() {
  const { selectedUser } = useSelectedUser();

  if (!selectedUser) {
    return <NoUserSelected />;
  }

  const handleCreatePosition = async (data: PositionData) => {
    // Create position for selected user
    const position = await createPosition({
      userId: selectedUser.id,
      portfolioId: selectedUser.portfolioId!,
      ...data,
    });

    if (position) {
      // Recalculate portfolio statistics
      await recalculatePortfolioStats(selectedUser.id);
      
      // Show success message
      toast.success("Position created successfully");
    }
  };

  return (
    <div>
      <h1>Create Position for {selectedUser.name}</h1>
      {/* Position form */}
    </div>
  );
}
```

## Future Enhancements

1. **Bulk Actions**: Perform actions for multiple customers
2. **Customer Search**: Search customers by name/email
3. **Customer Filters**: Filter by portfolio status, balance, etc.
4. **Quick Stats**: Show customer stats in selector
5. **Recent Customers**: Quick access to recently managed customers
6. **Customer Notes**: Add notes/tags for customers
7. **Notification Settings**: Configure alerts per customer

## Troubleshooting

### Issue: No customers showing
**Solution**: 
- Check database for users with CUSTOMER role
- Verify admin authorization
- Check console for errors

### Issue: Portfolio not found
**Solution**:
- Create portfolio for customer
- Use `createCustomerPortfolio(userId)`
- Verify portfolio ID in database

### Issue: Stats not updating
**Solution**:
- Call `recalculatePortfolioStats(userId)` after actions
- Check positions/orders are saved correctly
- Verify database timestamps

### Issue: Selected user lost on refresh
**Solution**:
- Context loads from localStorage
- Check browser localStorage
- May need to reselect after logout/login

