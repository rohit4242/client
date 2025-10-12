# EC2 Deployment Files Summary

## Overview

This document summarizes all the files created for deploying Bytix AI on AWS EC2 without Docker, using Nginx + PM2.

## Created Files

### 1. `deploy-pm2.sh`
**Purpose**: Automated deployment script for EC2 setup

**What it does:**
- Installs Node.js 20.x via nvm
- Installs PM2 process manager globally
- Installs and configures Nginx
- Clones your Git repository
- Sets up environment variables
- Installs dependencies
- Runs Prisma migrations
- Builds the Next.js application
- Starts the app with PM2
- Configures Nginx reverse proxy
- Sets up firewall rules

**How to use:**
```bash
# Upload to EC2
scp -i your-key.pem deploy-pm2.sh ubuntu@YOUR_EC2_IP:/home/ubuntu/

# SSH and run
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
chmod +x deploy-pm2.sh
./deploy-pm2.sh
```

---

### 2. `ecosystem.config.js`
**Purpose**: PM2 process configuration

**What it configures:**
- Application name: bytix-ai
- Entry point: Next.js standalone server
- Environment variables
- Cluster mode with auto-restart
- Log file locations
- Memory limits
- Optional deployment configuration

**How PM2 uses it:**
```bash
# PM2 automatically loads this file
pm2 start ecosystem.config.js --env production
```

---

### 3. `nginx-bytix.conf`
**Purpose**: Nginx reverse proxy configuration

**What it configures:**
- Proxy pass to localhost:3000
- WebSocket support for real-time features
- Rate limiting for API routes
- Static file caching
- Gzip compression
- Security headers
- Logging configuration
- Health check endpoint

**How Nginx uses it:**
```bash
# Automatically copied and enabled by deploy-pm2.sh
# Manual setup:
sudo cp nginx-bytix.conf /etc/nginx/sites-available/bytix-ai
sudo ln -s /etc/nginx/sites-available/bytix-ai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### 4. `DEPLOY_EC2.md`
**Purpose**: Complete deployment documentation

**Sections:**
- Prerequisites checklist
- EC2 instance setup guide
- Database configuration (RDS/Neon/Supabase)
- Domain DNS configuration (Namecheap)
- Step-by-step deployment instructions
- SSL setup with Let's Encrypt
- Management commands (PM2, Nginx, database)
- Troubleshooting guide
- Performance optimization tips
- Backup and recovery procedures

**When to use:**
- First-time deployment
- When you need detailed explanations
- Troubleshooting issues
- Reference for commands

---

### 5. `QUICK_START_EC2.md`
**Purpose**: Condensed quick start guide

**Sections:**
- 5-minute setup instructions
- Essential commands only
- Quick troubleshooting tips

**When to use:**
- You're experienced with deployments
- Quick reference
- Repeat deployments

---

### 6. `env.example` (Updated)
**Purpose**: Environment variables template with production guidance

**What was added:**
- Database URL examples for different providers (RDS, Neon, Supabase)
- Auth secret generation instructions for different platforms
- Production-specific BETTER_AUTH_URL examples
- Google OAuth setup instructions
- Production deployment checklist
- EC2-specific configuration notes

**How to use:**
```bash
# On EC2 instance
cp env.example .env
nano .env
# Fill in your actual values
```

---

## Deployment Architecture

```
Internet
    ↓
[Domain: yourdomain.com]
    ↓
[EC2 Instance Public IP]
    ↓
[Nginx (Port 80/443)]
    ↓ Reverse Proxy
[PM2 Process Manager]
    ↓
[Next.js App (Port 3000)]
    ↓
[PostgreSQL Database]
(RDS/Neon/Supabase)
```

## File Structure on EC2

After deployment, your EC2 instance will have:

```
/home/ubuntu/
├── bytix-ai/                    # Your application
│   ├── .next/                   # Next.js build output
│   │   └── standalone/          # Standalone server
│   │       └── server.js        # Entry point for PM2
│   ├── node_modules/            # Dependencies
│   ├── prisma/                  # Database schema
│   ├── src/                     # Source code
│   ├── logs/                    # PM2 logs
│   │   ├── pm2-out.log
│   │   └── pm2-error.log
│   ├── .env                     # Environment variables
│   ├── ecosystem.config.js      # PM2 config
│   ├── nginx-bytix.conf         # Nginx config
│   └── package.json
│
├── .nvm/                        # Node Version Manager
└── .pm2/                        # PM2 data

/etc/nginx/
├── sites-available/
│   └── bytix-ai                 # Nginx config (copied from project)
└── sites-enabled/
    └── bytix-ai                 # Symlink to sites-available

/var/log/nginx/
├── bytix-access.log             # Nginx access logs
└── bytix-error.log              # Nginx error logs
```

## Deployment Workflow

### Initial Deployment
1. Prepare EC2 instance
2. Configure security group
3. Upload deployment script
4. Run deployment script
5. Configure environment variables
6. Configure DNS
7. Verify deployment
8. (Optional) Setup SSL

### Application Updates
```bash
cd ~/bytix-ai
git pull origin main
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart bytix-ai
```

## Key Technologies

- **Node.js 20.x**: JavaScript runtime
- **Next.js 15**: React framework with standalone output
- **PM2**: Process manager with auto-restart and monitoring
- **Nginx**: Reverse proxy and web server
- **Prisma**: Database ORM with migrations
- **PostgreSQL**: Database (external managed service)
- **Better Auth**: Authentication system
- **Ubuntu 22.04**: Operating system

## Environment Requirements

### Minimum EC2 Instance
- **Type**: t3.small
- **vCPUs**: 2
- **RAM**: 2GB
- **Storage**: 20GB SSD
- **OS**: Ubuntu 22.04 LTS

### Recommended for Production
- **Type**: t3.medium or larger
- **vCPUs**: 2+
- **RAM**: 4GB+
- **Storage**: 40GB+ SSD
- **Load Balancer**: AWS ALB (for high availability)
- **Auto Scaling**: For handling traffic spikes

## Security Considerations

✓ UFW firewall configured
✓ Non-root user (ubuntu)
✓ SSH key authentication
✓ Nginx security headers
✓ Rate limiting on API routes
✓ Environment variables not committed to git
✓ PM2 runs as non-root user
✓ SSL/HTTPS recommended for production

## Cost Estimation (AWS)

**Monthly costs (approximate):**
- EC2 t3.small: $15-20
- RDS db.t3.micro: $13-15
- Data transfer: $5-10
- **Total**: ~$33-45/month

**Free Tier Alternative:**
- EC2 t2.micro (limited, 1GB RAM)
- Neon.tech database (free tier)
- **Total**: ~$0/month (within free tier limits)

## Monitoring

### PM2 Monitoring
```bash
pm2 monit              # Real-time monitoring
pm2 status             # Process status
pm2 logs bytix-ai      # View logs
```

### System Monitoring
```bash
htop                   # System resources
df -h                  # Disk usage
free -h                # Memory usage
```

### Nginx Monitoring
```bash
sudo tail -f /var/log/nginx/bytix-access.log
sudo tail -f /var/log/nginx/bytix-error.log
```

## Backup Strategy

### Database Backups
- RDS: Automated backups enabled
- Neon: Automatic snapshots
- Manual: `pg_dump` commands in DEPLOY_EC2.md

### Code Backups
- Git repository is source of truth
- PM2 saves process configuration

### Environment Variables
```bash
cp ~/bytix-ai/.env ~/backups/.env.backup
```

## Scaling Options

### Vertical Scaling
- Upgrade EC2 instance type
- Increase database capacity

### Horizontal Scaling
- Multiple EC2 instances
- AWS Application Load Balancer
- PM2 cluster mode (multiple Node processes)
- Read replicas for database

### Performance
- Enable PM2 cluster mode in ecosystem.config.js
- Implement Redis for caching
- Use CloudFront CDN for static assets
- Optimize database queries

## Support Resources

- **Full Documentation**: [DEPLOY_EC2.md](./DEPLOY_EC2.md)
- **Quick Start**: [QUICK_START_EC2.md](./QUICK_START_EC2.md)
- **Docker Alternative**: [DEPLOYMENT.md](./DEPLOYMENT.md) (if you prefer Docker)
- **Next.js Docs**: https://nextjs.org/docs
- **PM2 Docs**: https://pm2.keymetrics.io/docs
- **Nginx Docs**: https://nginx.org/en/docs

## Next Steps

1. Read [DEPLOY_EC2.md](./DEPLOY_EC2.md) for detailed instructions
2. Prepare your EC2 instance and database
3. Configure your domain DNS
4. Run the deployment script
5. Set up SSL with Let's Encrypt
6. Monitor your application

## Differences from Docker Deployment

| Aspect | Docker | PM2 + Nginx |
|--------|--------|-------------|
| Setup Complexity | Moderate | Simple |
| Resource Usage | Higher (containers) | Lower (native) |
| Isolation | Full isolation | Process isolation |
| Updates | Rebuild images | npm + restart |
| Scaling | Container orchestration | PM2 cluster mode |
| Learning Curve | Docker knowledge required | Standard Node.js |
| Best For | Complex deployments | Simple deployments |

Choose PM2 + Nginx when:
- You want simpler setup
- You're familiar with Node.js deployments
- You want lower resource overhead
- You don't need container orchestration

---

**Congratulations!** You now have everything needed to deploy Bytix AI on AWS EC2 with Nginx and PM2! 🚀

For questions or issues, refer to the troubleshooting section in [DEPLOY_EC2.md](./DEPLOY_EC2.md).

