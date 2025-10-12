This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Features

### 🚀 Real-time Price Updates (WebSocket)
- **WebSocket-based live prices** - ~100ms latency for real-time crypto prices
- **Auto-reconnection** - Seamless reconnection on connection drops
- **Price animations** - Visual feedback with green/red flashes on price changes
- See `WEBSOCKET_LIVE_PRICES.md` and `WEBSOCKET_INTEGRATION_COMPLETE.md` for details

### 📊 Trading Features
- Manual trading with real-time market data
- Signal bot for automated trading
- Position management with live P&L tracking
- Exchange integration (Binance)
- Portfolio tracking and analytics

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deployment

### Docker Deployment (AWS EC2)

This project includes Docker support for production deployment on AWS EC2:

- **Quick Start**: See [DOCKER_QUICKSTART.md](./DOCKER_QUICKSTART.md) for quick deployment instructions
- **Full Guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive AWS EC2 deployment guide

**Key Features:**
- Multi-stage Docker build for optimized image size
- Nginx reverse proxy with WebSocket support
- Health checks and auto-restart policies
- Production-ready security configurations
- SSL/HTTPS support

**Quick Deploy:**
```bash
# Configure environment
cp env.example .env
nano .env

# Build and run
docker-compose up -d

# Run migrations
docker-compose exec app npx prisma migrate deploy
```

### Deploy on Vercel

Alternatively, you can deploy on the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
