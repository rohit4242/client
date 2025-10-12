# Docker Quick Start Guide

This guide provides a quick reference for deploying Bytix AI using Docker.

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL database (AWS RDS or external)
- Environment variables configured

## Quick Start (Local Testing)

### 1. Clone and Setup

```bash
# Clone repository
git clone <your-repo-url>
cd bytix-ai

# Copy environment file
cp env.example .env

# Edit .env with your values
nano .env
```

### 2. Configure Environment

Edit `.env` file with your credentials:

```env
DATABASE_URL="postgresql://user:password@host:5432/database"
BETTER_AUTH_SECRET="your-secret-here"  # Generate with: openssl rand -base64 32
BETTER_AUTH_URL="http://localhost"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-secret"
NODE_ENV="production"
```

### 3. Build and Run

```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 4. Run Database Migration

```bash
# Run Prisma migrations
docker-compose exec app npx prisma migrate deploy

# Generate Prisma client (if needed)
docker-compose exec app npx prisma generate
```

### 5. Access Application

- Application: http://localhost
- Health Check: http://localhost/health

## AWS EC2 Deployment

For production deployment on AWS EC2, see [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive instructions.

### Quick EC2 Steps

1. **Launch EC2 Instance**
   - Ubuntu 22.04 LTS
   - t3.medium or larger
   - Open ports: 22, 80, 443

2. **Install Docker**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   ```

3. **Install Docker Compose**
   ```bash
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

4. **Deploy Application**
   ```bash
   # Upload files or clone repo
   cd /home/ubuntu/bytix-ai
   
   # Configure environment
   cp env.example .env
   nano .env
   
   # Run deployment script
   chmod +x deploy.sh
   ./deploy.sh
   ```

## Common Commands

### Container Management

```bash
# Start containers
docker-compose up -d

# Stop containers
docker-compose down

# Restart containers
docker-compose restart

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f app
docker-compose logs -f nginx

# Check container status
docker-compose ps
```

### Database Operations

```bash
# Run migrations
docker-compose exec app npx prisma migrate deploy

# Access Prisma Studio
docker-compose run --rm -p 5555:5555 app npx prisma studio

# Generate Prisma client
docker-compose exec app npx prisma generate

# Database seed (if you have seed scripts)
docker-compose exec app npx prisma db seed
```

### Shell Access

```bash
# Access app container
docker-compose exec app sh

# Access nginx container
docker-compose exec nginx sh

# Run commands in app container
docker-compose exec app node -v
docker-compose exec app npm -v
```

### Building and Cleanup

```bash
# Rebuild containers
docker-compose build --no-cache

# Rebuild and restart
docker-compose up -d --build

# Clean up unused resources
docker system prune -a
docker volume prune

# Remove all containers and volumes
docker-compose down -v
```

### Debugging

```bash
# View last 100 log lines
docker-compose logs --tail=100

# Follow logs for specific service
docker-compose logs -f app

# Check container health
docker inspect bytix-app | grep -A 10 Health

# Test health endpoint
curl http://localhost/health

# Check resource usage
docker stats
```

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `BETTER_AUTH_SECRET` | Yes | Session encryption secret | Generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Yes | Application base URL | `https://yourdomain.com` |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth secret | From Google Cloud Console |
| `NODE_ENV` | Yes | Node environment | `production` |
| `PORT` | No | Application port | `3000` (default) |

## Architecture

```
┌─────────────────┐
│   Internet      │
└────────┬────────┘
         │
    Port 80/443
         │
┌────────▼────────┐
│  Nginx Proxy    │  ← Reverse proxy, SSL termination
└────────┬────────┘
         │
    Port 3000
         │
┌────────▼────────┐
│  Next.js App    │  ← Application container
└────────┬────────┘
         │
┌────────▼────────┐
│  PostgreSQL DB  │  ← External database (RDS/other)
└─────────────────┘
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs for errors
docker-compose logs app

# Verify environment variables
docker-compose config

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Database Connection Failed

```bash
# Test database connection
docker-compose exec app npx prisma db pull

# Verify DATABASE_URL format
echo $DATABASE_URL

# Check network connectivity
docker-compose exec app ping your-db-host
```

### Port Already in Use

```bash
# Check what's using port 80
sudo lsof -i :80

# Stop conflicting service
sudo systemctl stop apache2  # or nginx

# Or change port in docker-compose.yml
ports:
  - "8080:80"  # Use port 8080 instead
```

### Out of Memory

```bash
# Check Docker resources
docker stats

# Increase Docker memory limit (Docker Desktop)
# Settings > Resources > Memory

# On Linux, check system memory
free -h
```

## Production Checklist

- [ ] PostgreSQL database configured (AWS RDS recommended)
- [ ] Environment variables set in `.env`
- [ ] SSL certificate configured (for HTTPS)
- [ ] Domain DNS pointing to EC2 instance
- [ ] Security groups configured (ports 80, 443, 22)
- [ ] Database backups enabled
- [ ] Monitoring setup (CloudWatch)
- [ ] Logs configured and rotated
- [ ] Google OAuth redirect URIs configured
- [ ] BETTER_AUTH_SECRET is strong and unique
- [ ] Regular updates scheduled

## Next Steps

1. For detailed AWS deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)
2. Configure SSL/HTTPS for production
3. Set up monitoring and alerts
4. Configure automated backups
5. Review security best practices

## Support

For issues:
1. Check logs: `docker-compose logs -f`
2. Review error messages
3. Verify environment configuration
4. Consult [DEPLOYMENT.md](./DEPLOYMENT.md) troubleshooting section

