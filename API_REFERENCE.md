# API Reference - User Role Management System

## Server Actions

### Admin Actions

#### `getAllUsers()`
**Location**: `src/db/actions/admin/get-all-users.ts`

Returns all users in the system with their role, agent, and portfolio information.

```typescript
interface UserWithAgent {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: "ADMIN" | "AGENT" | "CUSTOMER";
  createdAt: string;
  hasPortfolio: boolean;
  portfolioId?: string;
  agentId?: string | null;
  agentName?: string | null;
  customerCount?: number; // For agents: count of assigned customers
}

const users: UserWithAgent[] = await getAllUsers();
```

**Requirements**: 
- Must be called by an admin user
- Throws error if unauthorized

---

#### `getAllAgents()`
**Location**: `src/db/actions/admin/get-all-users.ts`

Returns all users with AGENT role.

```typescript
interface Agent {
  id: string;
  name: string;
  email: string;
  customerCount: number;
}

const agents: Agent[] = await getAllAgents();
```

**Requirements**: 
- Must be called by an admin user
- Returns empty array if unauthorized

---

#### `updateUserRole()`
**Location**: `src/db/actions/admin/update-user-role.ts`

Changes a user's role with automatic cleanup of relationships.

```typescript
const result = await updateUserRole(
  userId: string,
  newRole: "ADMIN" | "AGENT" | "CUSTOMER"
);

// Returns: { success: boolean; error?: string }
```

**Behavior**:
- If changing from AGENT to another role: Unassigns all their customers
- If changing from CUSTOMER to another role: Unassigns from their agent
- Revalidates `/users` and `/dashboard` paths

**Requirements**: 
- Must be called by an admin user
- User must exist

---

#### `assignCustomerToAgent()`
**Location**: `src/db/actions/admin/assign-customer-to-agent.ts`

Assigns or unassigns a customer to/from an agent.

```typescript
const result = await assignCustomerToAgent(
  customerId: string,
  agentId: string | null  // null to unassign
);

// Returns: { success: boolean; error?: string }
```

**Validation**:
- Customer must have CUSTOMER role
- Agent must have AGENT role
- Both users must exist

**Requirements**: 
- Must be called by an admin user

---

### Agent Actions

#### `getAssignedCustomers()`
**Location**: `src/db/actions/agent/get-assigned-customers.ts`

Returns only the customers assigned to the current agent.

```typescript
interface AssignedCustomer {
  id: string;
  name: string;
  email: string;
  image: string | null;
  createdAt: string;
  hasPortfolio: boolean;
  portfolioId?: string;
}

const customers: AssignedCustomer[] = await getAssignedCustomers();
```

**Requirements**: 
- Must be called by an agent user
- Returns empty array if unauthorized or no customers assigned

---

## API Endpoints

### Admin Endpoints

#### GET `/api/admin/users`

Get all users with their role and assignment information.

**Response**:
```json
[
  {
    "id": "user-123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "CUSTOMER",
    "agentId": "agent-456",
    "agentName": "Jane Agent",
    "hasPortfolio": true,
    "portfolioId": "portfolio-789",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "customerCount": 0
  }
]
```

**Authorization**: Admin only (403 if not admin)

---

#### PATCH `/api/admin/users/[userId]/role`

Update a user's role.

**Request Body**:
```json
{
  "role": "AGENT"  // "ADMIN" | "AGENT" | "CUSTOMER"
}
```

**Response**:
```json
{
  "success": true
}
```

**Error Response**:
```json
{
  "error": "Invalid role specified"
}
```

**Authorization**: Admin only (403 if not admin)

---

#### PATCH `/api/admin/users/[userId]/assign-agent`

Assign a customer to an agent or unassign them.

**Request Body**:
```json
{
  "agentId": "agent-123"  // or null to unassign
}
```

**Response**:
```json
{
  "success": true
}
```

**Error Response**:
```json
{
  "error": "Customer not found"
}
```

**Authorization**: Admin only (403 if not admin)

---

## Helper Functions

### Auth Helpers
**Location**: `src/lib/auth-utils.ts`

#### `getUserWithRole()`
Returns the current authenticated user with their role.

```typescript
const user = await getUserWithRole();
// Returns: UserWithRole | null

interface UserWithRole {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "AGENT" | "CUSTOMER";
  image?: string | null;
}
```

---

#### `isAdmin()`
Check if current user is an admin.

```typescript
const admin = await isAdmin();
// Returns: boolean
```

---

#### `isAgent()`
Check if current user is an agent.

```typescript
const agent = await isAgent();
// Returns: boolean
```

---

#### `isCustomer()`
Check if current user is a customer.

```typescript
const customer = await isCustomer();
// Returns: boolean
```

---

## Usage Examples

### Example 1: Admin Changing User Role

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function RoleChangeButton({ userId, currentRole }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRoleChange = async (newRole: string) => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      toast.success("Role updated successfully");
      router.refresh();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={() => handleRoleChange("AGENT")}>
      Promote to Agent
    </button>
  );
}
```

---

### Example 2: Agent Viewing Assigned Customers

```tsx
import { getAssignedCustomers } from "@/db/actions/agent/get-assigned-customers";

export default async function AgentDashboard() {
  const customers = await getAssignedCustomers();

  return (
    <div>
      <h1>My Customers ({customers.length})</h1>
      {customers.map((customer) => (
        <div key={customer.id}>
          {customer.name} - {customer.email}
        </div>
      ))}
    </div>
  );
}
```

---

### Example 3: Admin Assigning Customer to Agent

```tsx
"use client";

import { useState } from "react";

export function AssignAgentButton({ customerId }) {
  const [loading, setLoading] = useState(false);

  const assignToAgent = async (agentId: string) => {
    setLoading(true);
    
    try {
      const response = await fetch(
        `/api/admin/users/${customerId}/assign-agent`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentId }),
        }
      );

      if (!response.ok) throw new Error("Failed to assign");
      
      alert("Customer assigned successfully!");
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={() => assignToAgent("agent-id")}>
      Assign to Agent
    </button>
  );
}
```

---

### Example 4: Protected Route in Agent Portal

```tsx
import { redirect } from "next/navigation";
import { isAgent } from "@/lib/auth-utils";

export default async function AgentPage() {
  const agent = await isAgent();

  if (!agent) {
    redirect("/dashboard"); // or appropriate page
  }

  return <div>Agent-only content</div>;
}
```

---

## Database Queries

### Direct Prisma Queries

If you need to perform custom queries:

#### Get all customers assigned to a specific agent

```typescript
import db from "@/db";

const customers = await db.user.findMany({
  where: {
    role: "CUSTOMER",
    agentId: "agent-id-here",
  },
  include: {
    portfolios: true,
  },
});
```

---

#### Get agent with all their customers

```typescript
import db from "@/db";

const agent = await db.user.findUnique({
  where: {
    id: "agent-id",
    role: "AGENT",
  },
  include: {
    customers: {
      where: { role: "CUSTOMER" },
      include: {
        portfolios: true,
      },
    },
  },
});
```

---

#### Count customers per agent

```typescript
import db from "@/db";

const agents = await db.user.findMany({
  where: { role: "AGENT" },
  select: {
    id: true,
    name: true,
    _count: {
      select: { customers: true },
    },
  },
});

// Results: [{ id: "...", name: "...", _count: { customers: 5 } }, ...]
```

---

## Error Handling

All server actions follow this pattern:

```typescript
try {
  // Check authorization
  const isAuthorized = await isAdmin();
  if (!isAuthorized) {
    return { success: false, error: "Unauthorized" };
  }

  // Perform operation
  // ...

  return { success: true };
} catch (error) {
  console.error("Error:", error);
  return { success: false, error: "Operation failed" };
}
```

All API endpoints follow this pattern:

```typescript
try {
  // Check authorization
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    );
  }

  // Perform operation
  // ...

  return NextResponse.json({ success: true });
} catch (error) {
  return NextResponse.json(
    { error: "Operation failed" },
    { status: 500 }
  );
}
```

---

## Testing

### Test Admin Functions

```bash
# 1. Create a test user and promote to admin
# In Prisma Studio or SQL:
UPDATE "user" SET role = 'ADMIN' WHERE email = 'admin@test.com';

# 2. Create test agent
UPDATE "user" SET role = 'AGENT' WHERE email = 'agent@test.com';

# 3. Assign customer to agent (via admin UI or SQL)
UPDATE "user" SET "agentId" = 'agent-user-id' WHERE email = 'customer@test.com';
```

### Test API Endpoints

```bash
# Get all users (replace with actual auth token)
curl http://localhost:3000/api/admin/users \
  -H "Cookie: your-auth-cookie"

# Update user role
curl -X PATCH http://localhost:3000/api/admin/users/USER_ID/role \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{"role":"AGENT"}'

# Assign customer to agent
curl -X PATCH http://localhost:3000/api/admin/users/CUSTOMER_ID/assign-agent \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{"agentId":"AGENT_ID"}'
```

---

## Common Patterns

### Pattern 1: Role-Based Component Rendering

```tsx
import { getUserWithRole } from "@/lib/auth-utils";

export default async function DashboardLayout({ children }) {
  const user = await getUserWithRole();

  return (
    <div>
      {user?.role === "ADMIN" && <AdminHeader />}
      {user?.role === "AGENT" && <AgentHeader />}
      {user?.role === "CUSTOMER" && <CustomerHeader />}
      {children}
    </div>
  );
}
```

### Pattern 2: Conditional Navigation

```tsx
const navigationItems = user.role === "AGENT" 
  ? agentNavigationConfig 
  : adminNavigationConfig;
```

### Pattern 3: Data Fetching Based on Role

```tsx
const customers = user.role === "ADMIN"
  ? await getCustomers() // All customers
  : await getAssignedCustomers(); // Only assigned
```

---

## Mobile API Endpoints

### `/api/mobile/login` - Mobile User Login

**Method**: POST

**Description**: Authenticates a user by email for mobile applications and returns user details with portfolio information.

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Success Response (200)**:
```json
{
  "user": {
    "id": "clx1234567890",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "CUSTOMER",
    "image": "https://example.com/profile.jpg",
    "portfolios": [
      {
        "id": "portfolio-uuid",
        "name": "Main Portfolio",
        "currentBalance": 10000.50
      }
    ]
  }
}
```

**Error Responses**:

- **400 Bad Request** - Invalid or missing email
```json
{
  "error": "Email is required"
}
```
or
```json
{
  "error": "Invalid email format"
}
```

- **404 Not Found** - User does not exist
```json
{
  "error": "User not found"
}
```

- **500 Internal Server Error** - Server error
```json
{
  "error": "Internal Server Error"
}
```

**Notes**:
- This is a public endpoint (no authentication required)
- If user exists but has no portfolio, returns empty portfolios array
- Returns all portfolios associated with the user
- Suitable for mobile app login flows

**Example Usage** (React Native):
```typescript
async function loginUser(email: string) {
  const response = await fetch('https://your-domain.com/api/mobile/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  const data = await response.json();
  return data.user;
}
```

---

This API reference covers all the main functions and endpoints for the user role management system. For implementation details, see `IMPLEMENTATION_SUMMARY.md`.

