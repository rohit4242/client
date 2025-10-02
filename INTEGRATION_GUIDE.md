# Admin Selected User Integration Guide

## Overview

This guide shows how to integrate the selected user context into admin pages and actions. All admin features should use the selected customer's ID when performing operations.

## Pattern for Admin Pages

### 1. Page Component Structure

```typescript
"use client";

import { useSelectedUser } from "@/contexts/selected-user-context";
import { NoUserSelected } from "../_components/no-user-selected";

export default function AdminPage() {
  const { selectedUser } = useSelectedUser();

  // Show warning if no user selected
  if (!selectedUser) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Page Title</h1>
          <p className="text-muted-foreground">Description</p>
        </div>
        <NoUserSelected />
      </div>
    );
  }

  // Pass selectedUser to client component
  return <PageClient selectedUser={selectedUser} />;
}
```

### 2. Client Component with User Context

```typescript
"use client";

import { useState, useEffect } from 'react';
import { Customer } from '@/db/actions/admin/get-customers';
import { getDataForUser } from '@/db/actions/admin/get-data-for-user';

interface PageClientProps {
  selectedUser: Customer;
}

export function PageClient({ selectedUser }: PageClientProps) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const result = await getDataForUser(selectedUser.id);
      setData(result);
      setLoading(false);
    }
    loadData();
  }, [selectedUser.id]); // Reload when user changes

  return (
    <div>
      <h1>Managing: {selectedUser.name}</h1>
      {/* Your UI */}
    </div>
  );
}
```

## Server Actions Pattern

### Create Server Action for User

```typescript
"use server";

import { isAdmin } from "@/lib/auth-utils";
import db from "@/db";

export async function getDataForUser(userId: string) {
  try {
    // Check admin authorization
    const admin = await isAdmin();
    if (!admin) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Get user's portfolio
    const portfolio = await db.portfolio.findFirst({
      where: { userId },
    });

    if (!portfolio) {
      return [];
    }

    // Query data for this portfolio
    const data = await db.yourModel.findMany({
      where: {
        portfolioId: portfolio.id,
      },
    });

    return data;
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}
```

### Create/Update Action with User ID

```typescript
"use server";

import { isAdmin } from "@/lib/auth-utils";
import db from "@/db";
import { recalculatePortfolioStats } from "./update-portfolio-stats";

export async function createItemForUser(
  userId: string,
  data: ItemData
): Promise<boolean> {
  try {
    const admin = await isAdmin();
    if (!admin) {
      throw new Error("Unauthorized");
    }

    // Get user's portfolio
    const portfolio = await db.portfolio.findFirst({
      where: { userId },
    });

    if (!portfolio) {
      throw new Error("Portfolio not found");
    }

    // Create item
    await db.yourModel.create({
      data: {
        ...data,
        portfolioId: portfolio.id,
      },
    });

    // Recalculate stats
    await recalculatePortfolioStats(userId);

    return true;
  } catch (error) {
    console.error("Error:", error);
    return false;
  }
}
```

## API Routes Pattern

### Accept userId in Request Body

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import db from "@/db";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get userId from body (for admin) or use session user
    const body = await request.json();
    const { userId, ...itemData } = body;
    const targetUserId = userId || session.user.id;

    // Get portfolio
    let portfolio = await db.portfolio.findFirst({
      where: { userId: targetUserId },
    });

    // Create if doesn't exist
    if (!portfolio) {
      portfolio = await db.portfolio.create({
        data: { userId: targetUserId },
      });
    }

    // Create item
    const item = await db.yourModel.create({
      data: {
        ...itemData,
        portfolioId: portfolio.id,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}
```

## Client Action Pattern

### Pass userId to API

```typescript
import axios from "axios";

export const createItem = async (
  itemData: ItemData,
  userId?: string
) => {
  try {
    // Include userId in payload if provided (admin)
    const payload = userId 
      ? { ...itemData, userId }
      : itemData;
    
    const response = await axios.post("/api/your-endpoint", payload);
    return response.data;
  } catch (error) {
    return { error: "Failed to create item" };
  }
};
```

## Integration Checklist

For each admin feature, ensure:

- [ ] Page checks for selected user
- [ ] Shows NoUserSelected component if none
- [ ] Displays selected user name/email in header
- [ ] Fetches data for selected user's portfolio
- [ ] Reloads data when selected user changes
- [ ] Passes userId to all server actions
- [ ] Passes userId to all API calls
- [ ] Updates portfolio stats after modifications
- [ ] Handles portfolio creation if needed

## Example: Complete Integration (Exchanges)

### 1. Page Component

```typescript
// src/app/(admin)/exchanges/page.tsx
"use client";

import { useSelectedUser } from "@/contexts/selected-user-context";
import { NoUserSelected } from "../_components/no-user-selected";
import { ExchangesClient } from './_components/exchanges-client';

export default function ExchangesPage() {
  const { selectedUser } = useSelectedUser();

  if (!selectedUser) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exchange Accounts</h1>
          <p className="text-muted-foreground">
            Connect and manage exchange accounts
          </p>
        </div>
        <NoUserSelected />
      </div>
    );
  }

  return <ExchangesClient selectedUser={selectedUser} />;
}
```

### 2. Client Component

```typescript
// src/app/(admin)/exchanges/_components/exchanges-client.tsx
"use client";

import { useState, useEffect } from 'react';
import { Customer } from '@/db/actions/admin/get-customers';
import { getExchangesForUser } from '@/db/actions/admin/get-exchanges-for-user';

interface ExchangesClientProps {
  selectedUser: Customer;
}

export function ExchangesClient({ selectedUser }: ExchangesClientProps) {
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadExchanges() {
      setLoading(true);
      const data = await getExchangesForUser(selectedUser.id);
      setExchanges(data);
      setLoading(false);
    }
    loadExchanges();
  }, [selectedUser.id]);

  const handleExchangeAdded = (exchange) => {
    setExchanges(prev => [exchange, ...prev]);
  };

  return (
    <div>
      <h1>Exchanges for {selectedUser.name}</h1>
      {/* UI */}
    </div>
  );
}
```

### 3. Server Action

```typescript
// src/db/actions/admin/get-exchanges-for-user.ts
"use server";

import { isAdmin } from "@/lib/auth-utils";
import db from "@/db";

export async function getExchangesForUser(userId: string) {
  const admin = await isAdmin();
  if (!admin) throw new Error("Unauthorized");

  const portfolio = await db.portfolio.findFirst({
    where: { userId },
  });

  if (!portfolio) return [];

  const exchanges = await db.exchange.findMany({
    where: { portfolioId: portfolio.id },
  });

  return exchanges;
}
```

### 4. Create Action

```typescript
// src/db/actions/exchange/create-exchange.ts
export const createExchange = async (
  exchange: ExchangeData,
  userId?: string
) => {
  const payload = userId 
    ? { ...exchange, userId }
    : exchange;
  
  const response = await axios.post("/api/exchanges", payload);
  return response.data;
};
```

### 5. API Route

```typescript
// src/app/api/exchanges/route.ts
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const body = await request.json();
  const { userId, ...exchangeData } = body;
  const targetUserId = userId || session.user.id;

  let portfolio = await db.portfolio.findFirst({
    where: { userId: targetUserId },
  });

  const exchange = await db.exchange.create({
    data: {
      ...exchangeData,
      portfolioId: portfolio.id,
    },
  });

  return NextResponse.json(exchange);
}
```

## Testing

1. **Select a customer** from the user selector
2. **Verify the header** shows the selected customer's name
3. **Perform an action** (create/update/delete)
4. **Check database** to ensure data is associated with correct user
5. **Switch customers** and verify data reloads
6. **Check customer portal** to see if changes are reflected

## Common Pitfalls

1. **Forgetting to check for selected user** - Always check `if (!selectedUser)` 
2. **Not reloading on user change** - Include `selectedUser.id` in useEffect dependency
3. **Using session.user.id instead of targetUserId** - In APIs, use the userId from body
4. **Not creating portfolio** - Always check and create portfolio if needed
5. **Forgetting to recalculate stats** - Call `recalculatePortfolioStats` after changes

## Next Steps

Apply this pattern to:
- Manual Trading
- Signal Bots  
- Positions
- Dashboard
- All other admin features

Each feature should follow the same pattern for consistency.

