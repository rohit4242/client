# Role-Based Routing Documentation

## Overview

This application implements role-based routing to separate admin and customer access. Users are automatically redirected to the appropriate portal based on their role upon login.

## User Roles

The system supports two user roles defined in the database schema:

- **ADMIN**: Full access to admin portal and customer portal
- **CUSTOMER**: Access only to customer portal (default role for new users)

## Directory Structure

```
src/app/
├── (admin)/          # Admin portal - ADMIN role only
│   ├── dashboard/
│   ├── exchanges/
│   ├── manual-trading/
│   ├── positions/
│   ├── signal-bot/
│   └── layout.tsx    # Protected admin layout
│
├── (customer)/       # Customer portal - CUSTOMER and ADMIN roles
│   ├── dashboard/
│   ├── orders/
│   ├── positions/
│   ├── performance/
│   └── layout.tsx    # Protected customer layout
│
└── (auth)/          # Authentication pages
    ├── sign-in/
    └── sign-up/
```

## Authentication Flow

### 1. Login Process

When a user logs in (via email/password or social auth):

1. User submits credentials
2. Authentication is processed via Better Auth
3. User role is fetched from the database
4. User is redirected based on role:
   - **ADMIN** → `/dashboard` (admin portal)
   - **CUSTOMER** → `/customer/dashboard` (customer portal)

### 2. Route Protection

#### Admin Portal (`(admin)` directory)
- **Access**: ADMIN role only
- **Protection**: `AdminLayout` checks user role
- **Redirect**: Non-admin users are redirected to `/customer/dashboard`

```typescript
// src/app/(admin)/layout.tsx
if (user.role !== "ADMIN") {
  redirect("/customer/dashboard");
}
```

#### Customer Portal (`(customer)` directory)
- **Access**: Both CUSTOMER and ADMIN roles
- **Protection**: `CustomerLayout` checks authentication
- **Redirect**: Unauthenticated users are redirected to `/sign-in`

```typescript
// src/app/(customer)/layout.tsx
if (!user) {
  redirect("/sign-in");
}
// Both CUSTOMER and ADMIN can access
```

## Key Files

### 1. Auth Utilities (`src/lib/auth-utils.ts`)

Core authentication functions:

- `getUserWithRole()`: Fetches current user with their role from database
- `isAdmin()`: Check if current user is an admin
- `isCustomer()`: Check if current user is a customer
- `getDashboardUrlByRole()`: Get appropriate dashboard URL based on role

### 2. Login Form (`src/app/(auth)/_components/login-form.tsx`)

Handles role-based redirection after login:

```typescript
const response = await fetch("/api/auth/user-role");
const { role } = await response.json();
const redirectUrl = role === "ADMIN" ? "/dashboard" : "/customer/dashboard";
router.push(redirectUrl);
```

### 3. User Role API (`src/app/api/auth/user-role/route.ts`)

API endpoint to fetch the current user's role:

```typescript
GET /api/auth/user-role
Response: { role: "ADMIN" | "CUSTOMER" }
```

### 4. Layouts

- **Admin Layout** (`src/app/(admin)/layout.tsx`): Enforces ADMIN-only access
- **Customer Layout** (`src/app/(customer)/layout.tsx`): Allows CUSTOMER and ADMIN access

## Access Matrix

| Route | ADMIN | CUSTOMER |
|-------|-------|----------|
| `/dashboard` | ✅ | ❌ (Redirects to `/customer/dashboard`) |
| `/exchanges` | ✅ | ❌ (Redirects to `/customer/dashboard`) |
| `/manual-trading` | ✅ | ❌ (Redirects to `/customer/dashboard`) |
| `/positions` | ✅ | ❌ (Redirects to `/customer/dashboard`) |
| `/signal-bot` | ✅ | ❌ (Redirects to `/customer/dashboard`) |
| `/customer/dashboard` | ✅ | ✅ |
| `/customer/orders` | ✅ | ✅ |
| `/customer/positions` | ✅ | ✅ |
| `/customer/performance` | ✅ | ✅ |

## Implementation Details

### Database Schema

The `User` model includes a `role` field:

```prisma
model User {
  id            String   @id
  name          String
  email         String   @unique
  emailVerified Boolean
  image         String?
  role          UserRole @default(CUSTOMER)
  // ... other fields
}

enum UserRole {
  ADMIN
  CUSTOMER
}
```

### Navigation

- **Admin Portal**: Uses the main navigation config from `src/lib/navigation.ts`
- **Customer Portal**: Uses custom navigation defined in `src/app/(customer)/_components/customer-sidebar.tsx`

## Testing the Implementation

### As Admin

1. Create a user with `role: ADMIN` in the database
2. Login with admin credentials
3. Verify redirect to `/dashboard`
4. Access admin features (exchanges, manual trading, signal bot)
5. Navigate to `/customer/dashboard` to view customer portal

### As Customer

1. Create a user with `role: CUSTOMER` (or sign up - default role)
2. Login with customer credentials
3. Verify redirect to `/customer/dashboard`
4. Attempt to access `/dashboard` → should redirect to `/customer/dashboard`
5. Access customer features (orders, positions, performance)

## Security Considerations

1. **Server-Side Protection**: All route protection is done server-side in layout files
2. **Database Verification**: User role is always fetched from database, not from client
3. **API Protection**: API routes should also verify user role before processing requests
4. **Session Management**: Handled by Better Auth with secure session tokens

## Future Enhancements

1. **Middleware**: Consider adding Next.js middleware for additional route protection
2. **Role Hierarchy**: Implement more granular permissions (e.g., SUPER_ADMIN, MANAGER, etc.)
3. **Permission System**: Add feature-level permissions beyond role-based access
4. **Audit Logging**: Track admin access to customer data
5. **Customer Impersonation**: Allow admins to view customer portal as specific customers

## Troubleshooting

### User redirected to wrong portal
- Verify user role in database
- Clear browser cache and cookies
- Check server logs for authentication errors

### Infinite redirect loop
- Verify layout protection logic
- Check if user role is properly set in database
- Ensure `getUserWithRole()` is working correctly

### TypeScript errors
- Run `npm run build` to check for type errors
- Ensure all imports are correct
- Restart TypeScript language server if needed

