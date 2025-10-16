# Agent Portal Data Isolation Fix

## Problem

When an agent selected a customer in the agent portal, the system was showing the agent's own data (bots, exchanges, positions) instead of the selected customer's data.

**Root Cause**: The `getSelectedUser()` function in `src/lib/selected-user-server.ts` only worked for admins. When an agent selected a customer, the function returned `null`, causing all API endpoints to fall back to the logged-in user's data (the agent's data).

## Solution

Updated `getSelectedUser()` to support both admins and agents with proper security checks.

### Key Changes

**File**: `src/lib/selected-user-server.ts`

#### Before (Admin Only)
```typescript
export async function getSelectedUser() {
  const admin = await isAdmin();
  
  if (!admin) {
    return null; // ❌ Agents couldn't select users
  }
  
  // ... fetch selected customer
}
```

#### After (Admin & Agent Support)
```typescript
export async function getSelectedUser() {
  const admin = await isAdmin();
  const agent = await isAgent();
  
  // Only admins and agents can select users
  if (!admin && !agent) {
    return null;
  }
  
  // If agent, verify the selected user is assigned to them
  if (agent) {
    const currentUser = await getUserWithRole();
    
    const user = await db.user.findUnique({
      where: {
        id: selectedUserId,
        role: "CUSTOMER",
        agentId: currentUser.id, // ✅ Security: Must be assigned
      },
    });
    
    return user;
  }
  
  // Admin can select any customer
  // ... existing admin logic
}
```

## Security Features

### 1. **Agent Assignment Verification**
When an agent selects a customer, the system verifies at the database level that the customer is actually assigned to that agent using:
```typescript
agentId: currentUser.id
```

### 2. **Data Isolation by Role**
- **Admins**: Can select and view any customer's data
- **Agents**: Can only select and view customers assigned to them
- **Customers**: Cannot select other users

### 3. **Automatic API Protection**
All API endpoints that use `getSelectedUser()` now automatically enforce agent-customer assignments:

- `/api/signal-bots` - Signal bots
- `/api/exchanges` - Exchange accounts
- `/api/positions` - Trading positions
- `/api/order` - Orders
- `/api/trading` - Manual trading

## How It Works

### Admin Flow
1. Admin selects a customer from the dropdown
2. Selection stored in cookie: `selected_user_id`
3. `getSelectedUser()` retrieves any customer by ID
4. API returns that customer's data

### Agent Flow
1. Agent selects an assigned customer from dropdown
2. Selection stored in cookie: `selected_user_id`
3. `getSelectedUser()` verifies:
   - User exists
   - User has `CUSTOMER` role
   - User's `agentId` matches current agent's ID ✅
4. If verified, API returns customer's data
5. If not verified, returns `null` → API uses agent's own data

## Testing

### Test Agent Data Isolation

1. **Create test users:**
   ```sql
   -- Agent
   UPDATE "user" SET role = 'AGENT' WHERE email = 'agent@test.com';
   
   -- Customer 1 (assigned to agent)
   UPDATE "user" SET "agentId" = 'agent-id' WHERE email = 'customer1@test.com';
   
   -- Customer 2 (not assigned)
   UPDATE "user" SET "agentId" = NULL WHERE email = 'customer2@test.com';
   ```

2. **Login as agent**
3. **Verify dropdown only shows assigned customers:**
   - ✅ Should see customer1
   - ❌ Should NOT see customer2

4. **Select customer1**
5. **Navigate to Signal Bot page**
6. **Verify:**
   - ✅ Shows customer1's bots
   - ❌ Does NOT show agent's personal bots
   - ❌ Does NOT show customer2's bots

### Expected Behavior

| Scenario | Result |
|----------|--------|
| Agent selects assigned customer | Shows customer's data ✅ |
| Agent selects unassigned customer | Cannot select (not in dropdown) ❌ |
| Agent manually changes cookie to unassigned customer ID | API returns null → shows agent's own data 🔒 |
| Admin selects any customer | Shows customer's data ✅ |

## Impact

This fix ensures:

✅ **Data Privacy**: Agents can only access data for their assigned customers  
✅ **Security**: Database-level verification prevents unauthorized access  
✅ **Correct Behavior**: Agent portal shows selected customer's data, not agent's data  
✅ **Role Separation**: Clear distinction between admin and agent capabilities  

## Files Modified

- `src/lib/selected-user-server.ts` - Added agent support with security checks

## No Additional Changes Needed

All API endpoints already use `getSelectedUser()`, so they automatically benefit from this fix:
- ✅ Signal bots work correctly
- ✅ Exchanges work correctly
- ✅ Positions work correctly
- ✅ Manual trading works correctly
- ✅ Orders work correctly

## Summary

The fix was a single-file change that added agent support to the `getSelectedUser()` function with proper security verification. This ensures agents can only view data for their assigned customers, maintaining proper data isolation in the multi-tenant system.

