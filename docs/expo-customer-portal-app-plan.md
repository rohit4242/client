# Expo Customer Portal Mobile App

## Tech Stack

**Core Framework:**

- Expo SDK 52+ (latest stable)
- React Native with TypeScript
- Expo Router (file-based navigation)

**Styling:**

- NativeWind v4 (TailwindCSS for React Native)
- React Native Reanimated for animations
- Expo Linear Gradient

**State & Data:**

- TanStack Query v5 (API data fetching & caching)
- Zustand (global state: auth, user preferences)
- AsyncStorage (persistent storage)

**Authentication:**

- Better Auth client integration (matching web app)
- Expo SecureStore (token storage)
- Biometric authentication (FaceID/TouchID)

**Charts & Visualizations:**

- Victory Native (performance charts)
- React Native SVG (custom indicators)

**Real-time & Notifications:**

- WebSocket (live price updates via existing API)
- Expo Notifications (push notifications for signals)
- Polling fallback for positions/orders

**Additional Libraries:**

- Axios (HTTP client with interceptors)
- Zod (validation matching web schemas)
- date-fns (date formatting)
- React Hook Form (form management)

## Project Structure

```
bytix-mobile/
├── app/                          # Expo Router screens
│   ├── (auth)/                   # Auth flow (login, signup)
│   ├── (tabs)/                   # Main app tabs
│   │   ├── dashboard.tsx
│   │   ├── orders.tsx
│   │   ├── positions.tsx
│   │   └── performance.tsx
│   ├── _layout.tsx              # Root layout
│   └── index.tsx                # Entry redirect
├── components/                   # Reusable components
│   ├── ui/                      # Base UI components
│   ├── charts/                  # Chart components
│   └── portfolio/               # Domain components
├── lib/
│   ├── api/                     # API client & endpoints
│   ├── auth/                    # Auth utilities
│   ├── stores/                  # Zustand stores
│   └── utils.ts                 # Helpers
├── hooks/                       # Custom React hooks
├── types/                       # TypeScript types
└── constants/                   # App constants
```

## Implementation Steps

### 1. Project Initialization

- Create new Expo app with TypeScript template: `npx create-expo-app@latest bytix-mobile --template`
- Install core dependencies: `nativewind`, `expo-router`, `@tanstack/react-query`
- Setup NativeWind configuration (tailwind.config.js, babel.config.js)
- Configure TypeScript paths in tsconfig.json

### 2. API Integration Layer

- Create Axios instance with base URL (your AWS API endpoint)
- Implement interceptors for auth tokens and error handling
- Create typed API client functions matching existing endpoints:
  - `GET /api/auth/user-role`
  - `GET /api/positions` (with filters)
  - `GET /api/order/get`
  - `POST /api/order/create`
  - Add endpoints for portfolio stats, chart data, signals
- Setup TanStack Query with query keys and cache configuration

### 3. Authentication System

- Create Better Auth React Native client (adapt from `auth-client.ts`)
- Build Zustand auth store (user, token, isAuthenticated)
- Implement SecureStore for persistent token storage
- Create auth guard for protected routes
- Build login/signup screens with form validation (React Hook Form + Zod)
- Add biometric authentication option (Expo LocalAuthentication)
- Implement Google OAuth flow (Expo AuthSession)

### 4. Core UI Components

- Build design system with NativeWind:
  - Button (variants: primary, secondary, ghost)
  - Card (with gradients for stats)
  - Input (with validation states)
  - Badge (status indicators)
  - Avatar (user profile)
  - Table/List (for orders/positions)
  - Loading states (skeletons)
  - Pull-to-refresh component
- Create reusable layout components (SafeArea, Container, Header)

### 5. Dashboard Screen

- Implement portfolio stats cards (balance, PnL, win rate, ROI)
- Create performance chart with Victory Native (line chart for balance over time)
- Build recent positions list (last 5 positions)
- Build recent signals list (last 5 signals)
- Add sync balance button
- Implement pull-to-refresh
- Use TanStack Query for data fetching with 30s stale time

### 6. Orders Screen

- Create orders table/list with infinite scroll
- Implement filters (status, symbol, date range)
- Add order details modal (bottom sheet with Reanimated)
- Show order execution details
- Use TanStack Query with pagination

### 7. Positions Screen

- Build positions table/list with real-time updates
- Implement filters (status, symbol, exchange)
- Create position details modal with live PnL
- Add close position action (with confirmation)
- Color-coded profit/loss indicators
- Poll positions every 10s when screen is active

### 8. Performance Screen

- Build comprehensive stats overview
- Create trading statistics cards (total trades, win rate, best trade, etc.)
- Implement time period selector (1W, 1M, 3M, 1Y, ALL)
- Add Victory Native charts:
  - Portfolio value line chart
  - Win/Loss bar chart
  - Asset distribution pie chart
- Show monthly/yearly breakdowns

### 9. Real-time Features

- Setup WebSocket connection for live prices (or polling fallback)
- Create price ticker hook with Zustand store for live prices
- Implement position updates (poll every 10s)
- Add optimistic updates for order creation
- Handle connection status (offline banner)

### 10. Push Notifications

- Setup Expo Notifications
- Request permissions on app start
- Register device for push tokens
- Handle notification taps (deep linking to positions)
- Local notifications for price alerts (optional)
- Background fetch for position updates

### 11. Navigation & Layout

- Setup Expo Router file-based routing
- Create bottom tab navigator with custom icons
- Implement auth flow navigation (redirect logic)
- Add header with user avatar and settings
- Create settings screen (logout, preferences, theme)
- Deep linking configuration for notifications

### 12. Performance Optimizations

- Implement React.memo for list items
- Use FlashList instead of FlatList for large lists
- Add image caching with Expo Image
- Optimize chart rendering (limit data points)
- Implement lazy loading for screens
- Add error boundaries
- Setup Hermes engine (default in Expo)

### 13. Polish & Production

- Add loading states for all API calls
- Implement error handling with toast messages
- Create offline support (cached data display)
- Add haptic feedback for interactions
- Implement pull-to-refresh on all screens
- Add app icon and splash screen
- Configure app.json (name, slug, version, orientation: portrait)
- Setup EAS Build for iOS/Android builds

## Key Files to Create

**Configuration:**

- `app.json` - Expo configuration
- `tailwind.config.js` - NativeWind styling
- `babel.config.js` - Babel with NativeWind plugin

**Core Setup:**

- `lib/api/client.ts` - Axios instance with interceptors
- `lib/api/endpoints.ts` - Typed API functions
- `lib/auth/auth-client.ts` - Better Auth React Native client
- `lib/stores/auth-store.ts` - Zustand auth store
- `lib/stores/price-store.ts` - Zustand live price store
- `lib/query-client.ts` - TanStack Query configuration

**Screens:**

- `app/(auth)/login.tsx`
- `app/(auth)/signup.tsx`
- `app/(tabs)/dashboard.tsx`
- `app/(tabs)/orders.tsx`
- `app/(tabs)/positions.tsx`
- `app/(tabs)/performance.tsx`
- `app/_layout.tsx` - Root layout with query provider

**Hooks:**

- `hooks/useAuth.ts` - Auth hook
- `hooks/usePortfolioStats.ts` - TanStack Query hook
- `hooks/usePositions.ts` - TanStack Query hook
- `hooks/useOrders.ts` - TanStack Query hook
- `hooks/useLivePrice.ts` - Live price WebSocket/polling

## API Endpoint Mapping

Reuse existing backend endpoints:

- **Auth:** `POST /api/auth/[...all]` (login, signup, session)
- **User:** `GET /api/auth/user-role`
- **Portfolio:** Create `GET /api/customer/portfolio-stats`
- **Positions:** `GET /api/positions?userId=X&limit=50`
- **Orders:** `GET /api/order/get?userId=X&limit=100`
- **Signals:** Create `GET /api/customer/recent-signals?limit=10`
- **Chart Data:** Create `GET /api/customer/chart-data?period=1M`
- **Create Order:** `POST /api/order/create`
- **Close Position:** `POST /api/positions/[id]/close`

## Environment Variables

Create `.env`:

```
EXPO_PUBLIC_API_URL=https://your-aws-api.com
EXPO_PUBLIC_WS_URL=wss://your-aws-api.com
EXPO_PUBLIC_BETTER_AUTH_URL=https://your-aws-api.com
```

## Dependencies to Install

```json
{
  "dependencies": {
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "react-native": "~0.76.0",
    "nativewind": "^4.0.0",
    "tailwindcss": "^3.4.0",
    "@tanstack/react-query": "^5.85.0",
    "zustand": "^5.0.0",
    "axios": "^1.7.0",
    "zod": "^3.23.0",
    "react-hook-form": "^7.53.0",
    "@hookform/resolvers": "^3.9.0",
    "expo-secure-store": "~14.0.0",
    "expo-local-authentication": "~15.0.0",
    "expo-notifications": "~0.29.0",
    "expo-auth-session": "~6.0.0",
    "expo-web-browser": "~14.0.0",
    "react-native-reanimated": "~3.16.0",
    "victory-native": "^37.0.0",
    "react-native-svg": "^15.8.0",
    "date-fns": "^4.1.0",
    "@shopify/flash-list": "^1.7.0",
    "expo-linear-gradient": "~14.0.0",
    "expo-image": "~2.0.0",
    "expo-haptics": "~14.0.0",
    "@react-native-async-storage/async-storage": "^2.1.0"
  }
}
```

## Testing & Deployment

- Test on iOS simulator and Android emulator
- Test real devices for biometrics and notifications
- Setup EAS Build: `npx eas-cli@latest build --platform all`
- Configure app signing for both platforms
- Submit to App Store and Google Play Store