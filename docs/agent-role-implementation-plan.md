# Agent Role and Signal Visibility Implementation

## Overview

Implement a three-tier role system (ADMIN → AGENT → CUSTOMER) where agents can fully manage their assigned customers, and admins control signal visibility and agent management.

## Database Schema Changes

### Update `prisma/schema.prisma`

1. Add `AGENT` to `UserRole` enum
2. Add `agentId` field to `User` model for customer-agent assignment
3. Add `agentCustomers` relation for agents to access their customers
4. Add `isVisibleToCustomer` boolean field to `Signal` model for visibility control
5. Create migration

## Authentication & Authorization

### Update `src/lib/auth-utils.ts`

- Add `AGENT` to `UserRole` type
- Create `isAgent()` helper function
- Create `isAdminOrAgent()` helper function
- Create `getAgentCustomers(agentId)` function to get agent's assigned customers

## Admin Portal Enhancements

### Agent Management Pages

- Create `src/app/(admin)/agents/page.tsx` - List all agents with CRUD operations
- Create `src/app/(admin)/agents/_components/` - Agent list, create/edit forms, customer assignment UI

### Customer Assignment

- Update `src/app/(admin)/_components/user-selector.tsx` - Add agent assignment dropdown
- Create `src/db/actions/admin/assign-customer-to-agent.ts` - Assign/unassign customers to agents
- Create `src/db/actions/admin/get-agents.ts` - Fetch all agents

### Signal Visibility Control

- Update `src/app/(admin)/signal-bot/_components/` - Add visibility toggle per signal for customers
- Create `src/db/actions/admin/update-signal-visibility.ts` - Toggle signal visibility
- Update signal bot components to show visibility status

### Admin Sidebar Navigation

- Update `src/app/(admin)/_components/nav-main.tsx` - Add "Agents" menu item
- Update `src/app/(admin)/_components/app-sidebar.tsx` - Include agent management section

## Agent Portal Creation

### Agent Layout

- Create `src/app/(agent)/layout.tsx` - Similar to admin layout but checks AGENT role
- Create `src/app/(agent)/_components/` - Agent-specific sidebar, navigation components

### Agent Pages (mirror admin pages)

- `src/app/(agent)/dashboard/page.tsx` - Dashboard for assigned customers
- `src/app/(agent)/exchanges/page.tsx` - Manage exchanges for assigned customers
- `src/app/(agent)/positions/page.tsx` - View/manage positions
- `src/app/(agent)/manual-trading/page.tsx` - Execute trades
- `src/app/(agent)/signal-bot/page.tsx` - Manage signal bots (respecting visibility)
- `src/app/(agent)/orders/page.tsx` - View order history

### Customer Selector for Agents

- Create `src/app/(agent)/_components/agent-customer-selector.tsx` - Dropdown showing only assigned customers
- Reuse `SelectedUserProvider` context for consistency

## Database Actions for Agents

### Create agent-specific actions in `src/db/actions/agent/`

- `get-assigned-customers.ts` - Fetch only assigned customers
- `verify-customer-access.ts` - Check if agent has access to specific customer
- All other actions reuse admin actions but with customer access verification

## API Routes Updates

### Middleware for Access Control

- Update existing API routes to check agent permissions
- `src/app/api/exchanges/route.ts` - Verify agent has access to customer
- `src/app/api/positions/route.ts` - Verify agent access
- `src/app/api/signal-bots/route.ts` - Filter signals by visibility + verify access
- `src/app/api/order/route.ts` - Verify agent access

### New API Endpoints

- `src/app/api/admin/agents/route.ts` - CRUD operations for agents (admin only)
- `src/app/api/admin/assign-customer/route.ts` - Assign/unassign customers to agents
- `src/app/api/admin/signal-visibility/route.ts` - Update signal visibility per customer

## Signal Visibility Implementation

### Signal Model Updates

- Update signal queries to respect `isVisibleToCustomer` flag
- Filter signals in bot webhook processing based on visibility
- Update signal bot UI to show visibility indicators

### Admin Controls

- Add visibility toggle in signal bot management
- Show which customers can see each signal
- Bulk visibility update options

## Authentication Flow Updates

### Role-based Redirects

- Update `src/app/layout.tsx` or middleware to redirect by role:
- ADMIN → `/dashboard`
- AGENT → `/(agent)/dashboard`
- CUSTOMER → `/customer/dashboard`

### Sign-up Flow

- Admin creates agent accounts (no public agent signup)
- Send invitation emails to agents with setup instructions

## Testing Considerations

- Test agent can only access assigned customers
- Test admin can manage all agents and customers
- Test signal visibility filters work correctly
- Test customer reassignment between agents
- Test access denial when agent tries to access unassigned customer

## Key Files Summary

- **Schema**: `prisma/schema.prisma`
- **Auth**: `src/lib/auth-utils.ts`
- **Admin Agent Management**: `src/app/(admin)/agents/`
- **Agent Portal**: `src/app/(agent)/` (new directory structure)
- **Database Actions**: `src/db/actions/agent/`, updates to `src/db/actions/admin/`
- **API Routes**: New admin routes for agent/signal management
- **Components**: Signal visibility toggles, agent customer selector