# Migration Guide: User Role Management System

This guide explains how to apply the database changes for the new user role management and agent portal system.

## Database Migration

### Step 1: Generate Prisma Migration

Run the following command to generate a new migration based on the schema changes:

```bash
npx prisma migrate dev --name add_agent_role_and_assignments
```

This will:
- Add the `AGENT` role to the `UserRole` enum
- Add `agentId` field to the `User` model
- Create the self-referencing relationship for agent-customer assignments

### Step 2: Verify Migration

The migration will create SQL similar to:

```sql
-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'AGENT';

-- AlterTable
ALTER TABLE "user" ADD COLUMN "agentId" TEXT;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_agentId_fkey" 
  FOREIGN KEY ("agentId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

### Step 3: Apply Migration

If using a production database, use:

```bash
npx prisma migrate deploy
```

## Post-Migration Steps

### 1. Update Existing Users

All existing users will have the `CUSTOMER` role by default. You may want to:

1. **Promote your admin user:**
   ```sql
   UPDATE "user" SET role = 'ADMIN' WHERE email = 'your-admin@email.com';
   ```

2. **Create test agent users:**
   ```sql
   UPDATE "user" SET role = 'AGENT' WHERE email = 'agent@example.com';
   ```

### 2. Assign Customers to Agents

You can assign customers to agents through:
- The admin UI at `/users`
- Direct SQL:
  ```sql
  UPDATE "user" 
  SET "agentId" = 'agent-user-id' 
  WHERE email = 'customer@example.com';
  ```

## Testing the New Features

### Test Admin Portal

1. Login as an admin user
2. Navigate to `/users`
3. Test changing user roles
4. Test assigning customers to agents

### Test Agent Portal

1. Create or promote a user to AGENT role
2. Assign some customers to this agent
3. Login as the agent
4. Verify you're redirected to `/agent/dashboard`
5. Verify you only see assigned customers in the selector

### Test Role-Based Redirects

Test that the root page (`/`) redirects correctly:
- Admin → `/dashboard`
- Agent → `/agent/dashboard`
- Customer → `/customer/dashboard`

## Rollback (if needed)

If you need to rollback the migration:

```bash
npx prisma migrate resolve --rolled-back <migration-name>
```

Then manually remove the `AGENT` enum value and `agentId` column:

```sql
-- Remove foreign key
ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "user_agentId_fkey";

-- Remove column
ALTER TABLE "user" DROP COLUMN IF EXISTS "agentId";

-- Note: Removing enum values requires recreating the enum
-- This is more complex and may require downtime
```

## Troubleshooting

### Issue: Enum already exists

If you get an error that the AGENT value already exists, the migration was partially applied. Run:

```bash
npx prisma migrate resolve --applied <migration-name>
```

### Issue: Foreign key constraint errors

Make sure no `agentId` references non-existent users before applying the migration.

## Architecture Summary

### New Features

1. **Three-tier role system**: ADMIN, AGENT, CUSTOMER
2. **Agent-Customer assignments**: One agent can manage multiple customers
3. **Agent Portal**: Separate portal at `/agent/*` with limited access
4. **User Management UI**: Admin can change roles and assign agents at `/users`

### API Endpoints

- `GET /api/admin/users` - Get all users
- `PATCH /api/admin/users/[userId]/role` - Update user role
- `PATCH /api/admin/users/[userId]/assign-agent` - Assign customer to agent

### Server Actions

- `getAllUsers()` - Get all users with role and agent info
- `getAllAgents()` - Get all users with AGENT role
- `updateUserRole()` - Change user role
- `assignCustomerToAgent()` - Assign/unassign customer to agent
- `getAssignedCustomers()` - Get customers assigned to current agent

## Support

If you encounter any issues during migration, please check:
1. Prisma schema syntax
2. Database connection
3. Existing data constraints
4. TypeScript compilation errors

