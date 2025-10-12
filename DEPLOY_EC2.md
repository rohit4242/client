# AWS EC2 Deployment Guide - Nginx + PM2

Complete guide for deploying Bytix AI on AWS EC2 without Docker, using Nginx as a reverse proxy and PM2 as the process manager.

## Table of Contents

- [Prerequisites](#prerequisites)
- [EC2 Setup](#ec2-setup)
- [Database Setup](#database-setup)
- [Domain Configuration](#domain-configuration)
- [Deployment Steps](#deployment-steps)
- [SSL Setup (Optional)](#ssl-setup-optional)
- [Management Commands](#management-commands)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required

- AWS Account with EC2 access
- Managed PostgreSQL database (AWS RDS, Neon.tech, Supabase, etc.)
- Domain registered on Namecheap
- Git repository with your code (GitHub, GitLab, etc.)
- SSH client (PuTTY for Windows, or built-in SSH for Mac/Linux)

### Recommended EC2 Instance

- **Type**: t3.small or larger (minimum 2GB RAM)
- **OS**: Ubuntu 22.04 LTS
- **Storage**: 20GB+ SSD
- **vCPUs**: 2+

---

## EC2 Setup

### 1. Launch EC2 Instance

1. Go to **AWS Console** → **EC2** → **Launch Instance**
2. Choose **Ubuntu Server 22.04 LTS**
3. Select instance type: **t3.small** or larger
4. Configure storage: **20GB** or more
5. Create or select a **Key Pair** (download and save the .pem file)

### 2. Configure Security Group

Create or modify security group with these inbound rules:

| Type  | Protocol | Port Range | Source    | Description      |
|-------|----------|------------|-----------|------------------|
| SSH   | TCP      | 22         | Your IP   | SSH access       |
| HTTP  | TCP      | 80         | 0.0.0.0/0 | HTTP traffic     |
| HTTPS | TCP      | 443        | 0.0.0.0/0 | HTTPS traffic    |

**Important**: For SSH, use "My IP" for better security instead of 0.0.0.0/0

### 3. Allocate Elastic IP (Recommended)

1. Go to **EC2** → **Elastic IPs** → **Allocate Elastic IP address**
2. Associate it with your EC2 instance
3. This ensures your IP doesn't change if you restart the instance

### 4. Connect to Your Instance

**For Mac/Linux:**
```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

**For Windows (PowerShell):**
```powershell
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

**For Windows (PuTTY):**
- Convert .pem to .ppk using PuTTYgen
- Use PuTTY to connect with the .ppk key

---

## Database Setup

### Option 1: AWS RDS (Recommended for Production)

1. Go to **RDS** → **Create database**
2. Choose **PostgreSQL**
3. Select **Free tier** or **Production** template
4. Configure:
   - **DB instance identifier**: bytix-db
   - **Master username**: postgres
   - **Master password**: (set a strong password)
   - **DB instance class**: db.t3.micro (free tier) or larger
   - **Storage**: 20GB minimum
5. Configure connectivity:
   - **VPC**: Same as your EC2 instance
   - **Public access**: No (if in same VPC) or Yes (if different VPC)
   - **VPC security group**: Allow PostgreSQL (5432) from EC2 security group
6. Create database
7. Get connection endpoint from RDS console

**Connection String Format:**
```
postgresql://postgres:YOUR_PASSWORD@your-rds-endpoint.region.rds.amazonaws.com:5432/bytix
```

### Option 2: Neon.tech (Free Tier Available)

1. Go to [neon.tech](https://neon.tech)
2. Sign up for free account
3. Create a new project
4. Copy the connection string
5. Use the connection string in your `.env` file

### Option 3: Supabase (Free Tier Available)

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Settings** → **Database**
4. Copy the connection string (use "Connection pooling" for production)
5. Use the connection string in your `.env` file

---

## Domain Configuration

### Namecheap DNS Setup

1. Log in to [Namecheap](https://www.namecheap.com)
2. Go to **Domain List** → Click **Manage** on your domain
3. Navigate to **Advanced DNS** tab
4. Add/Edit these records:

**A Record:**
| Type | Host | Value              | TTL       |
|------|------|--------------------|-----------|
| A    | @    | YOUR_EC2_PUBLIC_IP | Automatic |
| A    | www  | YOUR_EC2_PUBLIC_IP | Automatic |

5. Click **Save All Changes**
6. Wait for DNS propagation (typically 5-30 minutes, can take up to 48 hours)

**Verify DNS Propagation:**
```bash
# Check if DNS is pointing to your server
nslookup yourdomain.com
dig yourdomain.com
```

Or use online tools:
- https://dnschecker.org
- https://www.whatsmydns.net

---

## Deployment Steps

### Step 1: Prepare Your Repository

Ensure your repository has these files:
- `package.json` and `package-lock.json`
- `prisma/schema.prisma`
- `ecosystem.config.js` (provided in this guide)
- `nginx-bytix.conf` (provided in this guide)
- `deploy-pm2.sh` (provided in this guide)
- `env.example`

Push all changes to your Git repository (GitHub/GitLab):
```bash
git add .
git commit -m "Add deployment files"
git push origin main
```

### Step 2: Upload Deployment Script

From your local machine, upload the deployment script to EC2:

```bash
# Make sure you're in your project directory
scp -i your-key.pem deploy-pm2.sh ubuntu@YOUR_EC2_IP:/home/ubuntu/
```

### Step 3: Connect to EC2 and Run Deployment

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Make the script executable
chmod +x deploy-pm2.sh

# Run the deployment script
./deploy-pm2.sh
```

The script will:
1. Install Node.js 20.x via nvm
2. Install PM2 globally
3. Install and configure Nginx
4. Clone your Git repository
5. Prompt you for your Git repository URL
6. Set up environment variables
7. Install dependencies
8. Run database migrations
9. Build the Next.js application
10. Start the app with PM2
11. Configure Nginx as reverse proxy

### Step 4: Configure Environment Variables

When the script pauses, edit your `.env` file:

```bash
cd ~/bytix-ai
nano .env
```

**Required Environment Variables:**

```bash
# Database (from RDS/Neon/Supabase)
DATABASE_URL="postgresql://user:password@host:5432/database"

# Better Auth (generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="https://yourdomain.com"

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Node Environment
NODE_ENV="production"
```

**Generate Auth Secret:**
```bash
openssl rand -base64 32
```

Save and exit: `Ctrl+X`, then `Y`, then `Enter`

Press `Enter` to continue the deployment script.

### Step 5: Verify Deployment

After deployment completes, verify the application:

```bash
# Check PM2 status
pm2 status

# View application logs
pm2 logs bytix-ai

# Check Nginx status
sudo systemctl status nginx

# Test the application
curl http://localhost/health
```

**Access Your Application:**
- Local: http://localhost
- Public IP: http://YOUR_EC2_IP
- Domain: http://yourdomain.com (after DNS propagates)

---

## SSL Setup (Optional)

### Using Let's Encrypt with Certbot

1. **Install Certbot:**
```bash
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx
```

2. **Obtain SSL Certificate:**
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

3. **Follow the prompts:**
   - Enter your email address
   - Agree to Terms of Service
   - Choose whether to redirect HTTP to HTTPS (recommended: Yes)

4. **Auto-renewal:**
Certbot automatically sets up auto-renewal. Test it:
```bash
sudo certbot renew --dry-run
```

5. **Update Environment Variable:**
```bash
nano ~/bytix-ai/.env
```
Change:
```bash
BETTER_AUTH_URL="https://yourdomain.com"
```

6. **Restart PM2:**
```bash
cd ~/bytix-ai
pm2 restart bytix-ai
```

**Access with HTTPS:**
- https://yourdomain.com

---

## Management Commands

### PM2 Commands

```bash
# View all running processes
pm2 status

# View logs (live)
pm2 logs bytix-ai

# View last 100 lines of logs
pm2 logs bytix-ai --lines 100

# Restart application
pm2 restart bytix-ai

# Stop application
pm2 stop bytix-ai

# Start application
pm2 start bytix-ai

# Delete process from PM2
pm2 delete bytix-ai

# Monitor CPU/Memory usage
pm2 monit

# Save current PM2 process list
pm2 save

# View detailed info
pm2 show bytix-ai
```

### Nginx Commands

```bash
# Test Nginx configuration
sudo nginx -t

# Reload Nginx (apply config changes)
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# Stop Nginx
sudo systemctl stop nginx

# Start Nginx
sudo systemctl start nginx

# Check Nginx status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# View access logs
sudo tail -f /var/log/nginx/access.log
```

### Application Updates

**Method 1: Manual Update**
```bash
cd ~/bytix-ai
git pull origin main
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart bytix-ai
```

**Method 2: Using PM2 Deploy (after configuring ecosystem.config.js)**
```bash
# From your local machine
pm2 deploy production update
```

### Database Migrations

```bash
cd ~/bytix-ai

# Generate migration
npx prisma migrate dev --name migration_name

# Deploy migrations to production
npx prisma migrate deploy

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# View migration status
npx prisma migrate status
```

---

## Troubleshooting

### Application Not Starting

**Check PM2 logs:**
```bash
pm2 logs bytix-ai --lines 100
```

**Common issues:**
- Missing environment variables
- Database connection failed
- Port 3000 already in use
- Node modules not installed

**Solution:**
```bash
cd ~/bytix-ai
nano .env  # Verify all variables are set
pm2 restart bytix-ai
```

### Cannot Access via Domain

**Check DNS propagation:**
```bash
nslookup yourdomain.com
```

**Check Nginx:**
```bash
sudo nginx -t
sudo systemctl status nginx
```

**Check if Nginx is listening:**
```bash
sudo netstat -tlnp | grep nginx
```

**Verify domain in Nginx config:**
```bash
sudo cat /etc/nginx/sites-enabled/bytix-ai | grep server_name
```

### 502 Bad Gateway Error

**This means Nginx can't reach your application.**

**Check if app is running:**
```bash
pm2 status
curl http://localhost:3000/health
```

**Check logs:**
```bash
pm2 logs bytix-ai
sudo tail -f /var/log/nginx/error.log
```

**Restart services:**
```bash
pm2 restart bytix-ai
sudo systemctl restart nginx
```

### Database Connection Failed

**Verify connection string:**
```bash
cd ~/bytix-ai
cat .env | grep DATABASE_URL
```

**Test database connection:**
```bash
npx prisma db pull
```

**Check security groups:**
- RDS security group must allow connections from EC2
- Port 5432 must be open

### Out of Memory

**Increase swap space:**
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**Check memory usage:**
```bash
free -h
pm2 monit
```

### Port 3000 Already in Use

**Find what's using the port:**
```bash
sudo lsof -i :3000
```

**Kill the process:**
```bash
sudo kill -9 <PID>
```

### PM2 Not Starting on Boot

**Reconfigure startup:**
```bash
pm2 unstartup
pm2 startup
# Run the command that PM2 outputs
pm2 save
```

### SSL Certificate Issues

**Check certificate status:**
```bash
sudo certbot certificates
```

**Renew certificate manually:**
```bash
sudo certbot renew
sudo systemctl reload nginx
```

### Viewing All Logs

**Application logs:**
```bash
pm2 logs bytix-ai --lines 200
```

**Nginx access logs:**
```bash
sudo tail -f /var/log/nginx/bytix-access.log
```

**Nginx error logs:**
```bash
sudo tail -f /var/log/nginx/bytix-error.log
```

**System logs:**
```bash
sudo journalctl -u nginx -f
```

---

## Performance Optimization

### Enable PM2 Cluster Mode

Edit `ecosystem.config.js`:
```javascript
instances: 'max',  // Use all CPU cores
exec_mode: 'cluster',
```

Then:
```bash
pm2 reload bytix-ai
```

### Enable Nginx Caching

Add to nginx config before server block:
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m use_temp_path=off;
```

### Monitor Performance

```bash
# CPU and memory usage
pm2 monit

# Detailed metrics
pm2 plus  # Creates PM2 Plus account for advanced monitoring
```

---

## Backup and Recovery

### Backup Database

```bash
# Create backup directory
mkdir -p ~/backups

# Backup database (adjust connection string)
pg_dump $DATABASE_URL > ~/backups/bytix-$(date +%Y%m%d).sql
```

### Backup Environment Variables

```bash
cp ~/bytix-ai/.env ~/backups/.env.backup
```

### Restore Database

```bash
psql $DATABASE_URL < ~/backups/bytix-YYYYMMDD.sql
```

---

## Monitoring and Alerts

### Setup PM2 Plus (Optional)

PM2 Plus provides advanced monitoring:
```bash
pm2 plus
# Follow the prompts to create an account
```

Features:
- Real-time monitoring
- Email/Slack alerts
- Error tracking
- Performance metrics

---

## Support and Resources

- **Next.js Documentation**: https://nextjs.org/docs
- **PM2 Documentation**: https://pm2.keymetrics.io/docs
- **Nginx Documentation**: https://nginx.org/en/docs
- **Prisma Documentation**: https://www.prisma.io/docs

---

## Quick Reference Card

```bash
# SSH to Server
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Application Directory
cd ~/bytix-ai

# View Logs
pm2 logs bytix-ai

# Restart App
pm2 restart bytix-ai

# Update App
git pull && npm install && npm run build && pm2 restart bytix-ai

# Nginx Reload
sudo systemctl reload nginx

# View Errors
sudo tail -f /var/log/nginx/error.log
```

---

**Congratulations!** Your Bytix AI application is now deployed on AWS EC2 with Nginx and PM2! 🚀

