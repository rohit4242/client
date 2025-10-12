# Multi-stage Dockerfile for Next.js with Prisma

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies only when needed
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy application source
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js application (remove turbopack for production)
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build || (echo "Build without turbopack" && npx next build)

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copy Next.js build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and generated client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"]

