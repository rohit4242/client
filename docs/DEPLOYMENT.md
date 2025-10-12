# Bytix AI - AWS EC2 Deployment Guide

This guide provides step-by-step instructions for deploying the Bytix AI trading platform on AWS EC2 using Docker and Nginx.

## Table of Contents

- [Prerequisites](#prerequisites)
- [AWS EC2 Setup](#aws-ec2-setup)
- [Database Setup](#database-setup)
- [Server Configuration](#server-configuration)
- [Application Deployment](#application-deployment)
- [SSL/HTTPS Setup](#sslhttps-setup)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before starting, ensure you have:

- AWS account with appropriate permissions
- Domain name (optional, for SSL/HTTPS)
- PostgreSQL database (AWS RDS or external)
- Google OAuth credentials (for social login)
- Basic knowledge of Linux, Docker, and AWS

## AWS EC2 Setup

### 1. Launch EC2 Instance

1. **Log in to AWS Console** and navigate to EC2
2. **Click "Launch Instance"**
3. **Configure instance:**
   - **Name:** bytix-ai-production
   - **AMI:** Ubuntu Server 22.04 LTS
   - **Instance Type:** t3.medium (minimum) or t3.large (recommended)
   - **Key Pair:** Create new or select existing
   - **Network Settings:**
     - Allow SSH (port 22) from your IP
     - Allow HTTP (port 80) from anywhere
     - Allow HTTPS (port 443) from anywhere
   - **Storage:** 30 GB gp3 (minimum)
4. **Launch instance**

### 2. Connect to EC2 Instance

```bash
# Replace with your key file and instance IP
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### 3. Update System

```bash
sudo apt update && sudo apt upgrade -y
```

## Database Setup

### Option 1: AWS RDS (Recommended)

1. **Create RDS PostgreSQL Instance:**
   - Engine: PostgreSQL 15+
   - Template: Production or Dev/Test
   - DB Instance: db.t3.micro (minimum) or db.t3.small (recommended)
   - Storage: 20 GB minimum, enable autoscaling
   - VPC: Same as EC2 or configure security groups

2. **Security Group Configuration:**
   - Allow inbound PostgreSQL (port 5432) from EC2 security group

3. **Note Connection Details:**
   ```
   Endpoint: your-db.region.rds.amazonaws.com
   Port: 5432
   Database name: bytix
   Username: postgres
   Password: your-secure-password
   ```

4. **Connection String Format:**
   ```
   postgresql://username:password@endpoint:5432/database
   ```

### Option 2: External PostgreSQL

If using an external PostgreSQL database:
- Ensure it's accessible from your EC2 instance
- Configure firewall rules to allow connections
- Use the appropriate connection string

## Server Configuration

### 1. Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in for group changes to take effect
exit
```

Reconnect to your instance:
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

Verify Docker installation:
```bash
docker --version
```

### 2. Install Docker Compose

```bash
# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

### 3. Install Git (if needed)

```bash
sudo apt install git -y
```

## Application Deployment

### 1. Clone Repository

```bash
# Create app directory
mkdir -p /home/ubuntu/bytix-ai
cd /home/ubuntu/bytix-ai

# Clone your repository
git clone https://github.com/your-username/bytix-ai.git .

# Or upload files manually using SCP
# scp -i your-key.pem -r ./bytix-client ubuntu@your-ec2-ip:/home/ubuntu/bytix-ai/
```

### 2. Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit environment variables
nano .env
```

**Required environment variables:**

```env
# Database - Use your RDS or external database connection string
DATABASE_URL="postgresql://username:password@your-db-endpoint:5432/bytix"

# Better Auth - Generate secret with: openssl rand -base64 32
BETTER_AUTH_SECRET="your-generated-secret-key"

# Application URL - Use your domain or EC2 public IP
BETTER_AUTH_URL="http://your-ec2-ip"  # or https://yourdomain.com

# Google OAuth - Get from Google Cloud Console
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Environment
NODE_ENV="production"
```

**Generate secrets:**
```bash
# Generate BETTER_AUTH_SECRET
openssl rand -base64 32
```

### 3. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URIs:
   - `http://your-ec2-ip/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/callback/google` (if using domain)
4. Copy Client ID and Client Secret to `.env`

### 4. Make Deploy Script Executable

```bash
chmod +x deploy.sh
```

### 5. Run Deployment

```bash
./deploy.sh
```

The script will:
- Build Docker images
- Run database migrations
- Start the application with Nginx
- Perform health checks

### 6. Verify Deployment

```bash
# Check running containers
docker-compose ps

# Check logs
docker-compose logs -f

# Test application
curl http://localhost/health
```

Access your application:
- Local: `http://localhost`
- Public: `http://YOUR_EC2_PUBLIC_IP`

## SSL/HTTPS Setup

### 1. Configure Domain DNS

Point your domain to your EC2 instance:
- Create an A record pointing to your EC2 public IP
- Wait for DNS propagation (can take up to 48 hours)

### 2. Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 3. Update Nginx Configuration

```bash
# Stop containers
docker-compose down

# Update nginx.conf to include your domain
nano nginx.conf
```

Change the `server_name` line:
```nginx
server_name yourdomain.com www.yourdomain.com;
```

### 4. Obtain SSL Certificate

```bash
# Restart containers
docker-compose up -d

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 5. Auto-Renewal Setup

```bash
# Test renewal
sudo certbot renew --dry-run

# Certificate will auto-renew via cron
```

### 6. Update Environment Variables

```bash
nano .env
```

Update `BETTER_AUTH_URL`:
```env
BETTER_AUTH_URL="https://yourdomain.com"
```

Restart containers:
```bash
docker-compose restart
```

## Monitoring and Maintenance

### View Application Logs

```bash
# All logs
docker-compose logs -f

# App logs only
docker-compose logs -f app

# Nginx logs only
docker-compose logs -f nginx

# Last 100 lines
docker-compose logs --tail=100
```

### Container Management

```bash
# View running containers
docker-compose ps

# Restart containers
docker-compose restart

# Stop containers
docker-compose down

# Start containers
docker-compose up -d

# Rebuild and restart
docker-compose up -d --build
```

### Database Management

```bash
# Run migrations
docker-compose run --rm app npx prisma migrate deploy

# Access Prisma Studio
docker-compose run --rm -p 5555:5555 app npx prisma studio

# Generate Prisma client
docker-compose run --rm app npx prisma generate

# Reset database (CAREFUL! This deletes all data)
docker-compose run --rm app npx prisma migrate reset
```

### Shell Access

```bash
# Access app container shell
docker-compose exec app sh

# Access nginx container shell
docker-compose exec nginx sh

# Run commands in app container
docker-compose exec app node -v
```

### System Monitoring

```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check Docker resource usage
docker stats

# Check system logs
sudo journalctl -xe
```

### Backup Database

```bash
# If using RDS, enable automated backups in AWS console
# Manual snapshot:
# 1. Go to RDS Console
# 2. Select your database
# 3. Actions > Take snapshot

# For external database, use pg_dump:
docker-compose exec app npx prisma db push --skip-generate
```

## Troubleshooting

### Application Won't Start

1. **Check logs:**
   ```bash
   docker-compose logs app
   ```

2. **Common issues:**
   - Database connection failed: Verify `DATABASE_URL` in `.env`
   - Port already in use: Check if another service is using port 80/443
   - Build errors: Try rebuilding: `docker-compose build --no-cache`

### Database Connection Issues

1. **Verify connection string:**
   ```bash
   echo $DATABASE_URL
   ```

2. **Test database connection:**
   ```bash
   docker-compose run --rm app npx prisma db pull
   ```

3. **Check RDS security groups:**
   - Ensure EC2 security group has access to RDS
   - Verify RDS is publicly accessible (if needed)

### Cannot Access Application

1. **Check AWS security group:**
   - Port 80 (HTTP) should be open from 0.0.0.0/0
   - Port 443 (HTTPS) should be open from 0.0.0.0/0

2. **Check Nginx:**
   ```bash
   docker-compose logs nginx
   curl http://localhost/health
   ```

3. **Verify containers are running:**
   ```bash
   docker-compose ps
   ```

### SSL Certificate Issues

1. **Check Certbot logs:**
   ```bash
   sudo journalctl -u certbot
   ```

2. **Manual renewal:**
   ```bash
   sudo certbot renew --force-renewal
   ```

3. **Verify DNS:**
   ```bash
   nslookup yourdomain.com
   ```

### Performance Issues

1. **Check resource usage:**
   ```bash
   docker stats
   htop  # Install with: sudo apt install htop
   ```

2. **Increase EC2 instance size** if needed

3. **Optimize Prisma queries** in application code

4. **Enable database query logging:**
   ```bash
   # Add to .env
   DATABASE_URL="postgresql://...?connect_timeout=30&pool_timeout=30"
   ```

### Out of Disk Space

1. **Clean Docker resources:**
   ```bash
   docker system prune -a
   docker volume prune
   ```

2. **Check disk usage:**
   ```bash
   du -sh /*
   df -h
   ```

3. **Increase EBS volume size** in AWS console

## Updating the Application

### Deploy New Version

```bash
cd /home/ubuntu/bytix-ai

# Pull latest code (if using git)
git pull origin master

# Run deployment script
./deploy.sh
```

### Manual Update

```bash
# Stop containers
docker-compose down

# Rebuild images
docker-compose build --no-cache

# Run migrations
docker-compose run --rm app npx prisma migrate deploy

# Start containers
docker-compose up -d
```

## Security Best Practices

1. **Keep system updated:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Use strong passwords** for database and secrets

3. **Restrict SSH access:**
   - Use key-based authentication only
   - Disable password authentication
   - Limit source IPs in security group

4. **Enable AWS CloudWatch** for monitoring

5. **Set up automated backups** for RDS

6. **Use AWS Secrets Manager** for sensitive credentials (optional)

7. **Regular security audits:**
   ```bash
   # Update dependencies
   npm audit
   npm audit fix
   ```

## Cost Optimization

1. **Use reserved instances** for predictable workloads
2. **Enable EBS volume auto-scaling**
3. **Use RDS reserved instances** for production databases
4. **Set up CloudWatch alarms** for cost monitoring
5. **Consider spot instances** for non-production environments

## Support

For issues or questions:
- Check application logs: `docker-compose logs -f`
- Review this documentation
- Check AWS service health dashboard
- Contact your development team

---

**Last Updated:** January 2025
**Version:** 1.0.0

