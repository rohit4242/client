# Docker Deployment Guide

This guide covers installing Docker and deploying the Bytix AI application using Docker Compose.

## 1. Install Docker on Ubuntu
Run the following commands on your EC2 instance:

```bash
# Update local packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install -y docker-compose-v2

# Allow your user to run Docker without sudo
sudo usermod -aG docker $USER
# (Logout and login again for this to take effect)
```

## 2. Project Directory Setup
Create a directory for the project and upload/pull your files:

```bash
mkdir -p ~/app/bytix
cd ~/app/bytix
```

Ensure your `.env` file is present and contains production values:
- `DATABASE_URL`: Your production database (e.g., RDS)
- `NEXTAUTH_SECRET`: Generate a random string
- `NEXTAUTH_URL`: `https://bytix.ai`
- `BINANCE_API_KEY`: Your production API key

## 3. Deployment Commands

### Build and Start
```bash
docker-compose up -d --build
```

### View Logs
```bash
docker-compose logs -f app
```

### Stop Services
```bash
docker-compose down
```

### Run Migrations (if using Prisma with Docker)
```bash
docker-compose exec app npx prisma migrate deploy
```

Next: [Nginx and SSL Configuration](./03-Nginx-SSL.md)
