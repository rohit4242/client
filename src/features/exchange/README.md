# Exchange Feature

Complete implementation of the Exchange feature with server actions, React Query hooks, and Zod validation.

## Overview

The Exchange feature manages Binance API connections for users. It provides:
- CRUD operations for exchanges
- Balance synchronization with Binance
- Portfolio value tracking (spot + margin)
- Type-safe data validation

## Architecture

```
exchange/
├── actions/              # Server actions
│   ├── get-exchanges.ts  # Fetch all exchanges
│   ├── get-exchange.ts   # Fetch single exchange
│   ├── create-exchange.ts # Create new exchange
│   ├── update-exchange.ts # Update exchange
│   ├── delete-exchange.ts # Delete exchange
│   └── sync-exchange.ts   # Sync balance with Binance
├── hooks/                # React Query hooks
│   ├── use-exchanges-query.ts
│   ├── use-exchange-query.ts
│   ├── use-create-exchange-mutation.ts
│   ├── use-update-exchange-mutation.ts
│   ├── use-delete-exchange-mutation.ts
│   └── use-sync-exchange-mutation.ts
├── schemas/              # Zod validation schemas
│   └── exchange.schema.ts
├── types/                # TypeScript types
│   └── exchange.types.ts
└── index.ts              # Public exports
```

## Usage

### Fetching Exchanges

```typescript
import { useExchangesQuery } from "@/features/exchange";

function ExchangeList() {
  const { data, isLoading, error } = useExchangesQuery();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  const exchanges = data?.exchanges ?? [];
  
  return (
    <div>
      {exchanges.map(exchange => (
        <div key={exchange.id}>{exchange.name}</div>
      ))}
    </div>
  );
}
```

### Creating an Exchange

```typescript
import { useCreateExchangeMutation, type CreateExchangeInput } from "@/features/exchange";

function CreateExchangeForm() {
  const createMutation = useCreateExchangeMutation();
  
  const handleSubmit = (data: CreateExchangeInput) => {
    createMutation.mutate(data);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button 
        type="submit" 
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? "Creating..." : "Create Exchange"}
      </button>
    </form>
  );
}
```

### Updating an Exchange

```typescript
import { useUpdateExchangeMutation, type UpdateExchangeInput } from "@/features/exchange";

function EditExchangeForm({ exchangeId }: { exchangeId: string }) {
  const updateMutation = useUpdateExchangeMutation();
  
  const handleSubmit = (data: Omit<UpdateExchangeInput, "id">) => {
    updateMutation.mutate({ ...data, id: exchangeId });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### Deleting an Exchange

```typescript
import { useDeleteExchangeMutation } from "@/features/exchange";

function DeleteExchangeButton({ exchangeId }: { exchangeId: string }) {
  const deleteMutation = useDeleteExchangeMutation();
  
  const handleDelete = () => {
    if (confirm("Are you sure?")) {
      deleteMutation.mutate({ id: exchangeId });
    }
  };
  
  return (
    <button 
      onClick={handleDelete}
      disabled={deleteMutation.isPending}
    >
      Delete
    </button>
  );
}
```

### Syncing Exchange Balance

```typescript
import { useSyncExchangeMutation } from "@/features/exchange";

function SyncExchangeButton({ exchangeId }: { exchangeId: string }) {
  const syncMutation = useSyncExchangeMutation();
  
  const handleSync = () => {
    syncMutation.mutate({ id: exchangeId });
  };
  
  return (
    <button 
      onClick={handleSync}
      disabled={syncMutation.isPending}
    >
      {syncMutation.isPending ? "Syncing..." : "Sync Balance"}
    </button>
  );
}
```

## Features

### ✅ Type Safety
- All types inferred from Zod schemas
- Runtime validation for inputs
- Compile-time type checking

### ✅ Automatic Cache Management
- Queries are automatically cached
- Mutations invalidate related queries
- Optimized refetching

### ✅ Error Handling
- Standardized error responses
- User-friendly error messages
- Toast notifications

### ✅ Loading States
- Built-in loading indicators
- Disable buttons during mutations
- Loading toasts for sync operation

### ✅ Admin Support
- Admins can create exchanges for customers
- Selected user context supported
- Portfolio auto-creation

## API Reference

### Hooks

#### `useExchangesQuery(options?)`
Fetch all exchanges for current user.

**Options:**
- `staleTime?: number` - Staleness threshold (default: 30s)
- `enabled?: boolean` - Enable/disable query (default: true)
- `refetchInterval?: number | false` - Auto-refetch interval (default: 60s)

**Returns:**
- `data.exchanges` - Array of exchanges
- `isLoading` - Loading state
- `error` - Error object
- `refetch` - Manual refetch function

#### `useExchangeQuery(id, options?)`
Fetch single exchange by ID.

**Parameters:**
- `id: string | undefined` - Exchange ID
- `options` - Same as useExchangesQuery

**Returns:** Same as useExchangesQuery but with single exchange

#### `useCreateExchangeMutation()`
Create new exchange.

**Returns:**
- `mutate(data: CreateExchangeInput)` - Execute mutation
- `isPending` - Loading state
- `isSuccess` - Success state
- `error` - Error object

#### `useUpdateExchangeMutation()`
Update existing exchange.

#### `useDeleteExchangeMutation()`
Delete exchange.

#### `useSyncExchangeMutation()`
Sync exchange balance with Binance.

### Types

```typescript
interface CreateExchangeInput {
  name: string;
  apiKey: string;
  apiSecret: string;
  positionMode: "One_Way" | "Hedge";
  userId?: string; // For admin use
}

interface UpdateExchangeInput {
  id: string;
  name?: string;
  apiKey?: string;
  apiSecret?: string;
  positionMode?: "One_Way" | "Hedge";
  isActive?: boolean;
}

interface ExchangeClient {
  id: string;
  portfolioId: string;
  name: string;
  apiKey: string;
  apiSecret: string;
  positionMode: "One_Way" | "Hedge";
  isActive: boolean;
  spotValue: number;
  marginValue: number;
  totalValue: number;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

## Migration Guide

If you're migrating from the old API pattern:

### Before (Old Pattern)
```typescript
// ❌ Old way with API routes
const [exchanges, setExchanges] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchExchanges() {
    const res = await fetch("/api/exchanges");
    const data = await res.json();
    setExchanges(data);
    setLoading(false);
  }
  fetchExchanges();
}, []);
```

### After (New Pattern)
```typescript
// ✅ New way with React Query
const { data, isLoading } = useExchangesQuery();
const exchanges = data?.exchanges ?? [];
```

### Benefits of New Pattern
1. **No manual state management** - React Query handles it
2. **Automatic caching** - No redundant requests
3. **Background refetching** - Data stays fresh
4. **Error handling** - Built-in error states
5. **Loading states** - Automatic loading indicators
6. **Type safety** - Full TypeScript support

## Next Steps

After creating all features, update components to use these hooks and remove old API routes.
