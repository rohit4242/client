# Quick Start - EC2 Deployment

This is a condensed guide to get your Bytix AI application running on AWS EC2 quickly. For detailed instructions, see [DEPLOY_EC2.md](./DEPLOY_EC2.md).

## Prerequisites

- AWS EC2 instance (Ubuntu 22.04+, t3.small or larger)
- PostgreSQL database URL (RDS, Neon, or Supabase)
- Domain on Namecheap
- Git repository with this code

## 5-Minute Setup

### 1. Configure Security Group

Add these inbound rules to your EC2 security group:
- SSH (22) - Your IP
- HTTP (80) - Anywhere
- HTTPS (443) - Anywhere

### 2. Upload and Run Deployment Script

```bash
# From your local machine
scp -i your-key.pem deploy-pm2.sh ubuntu@YOUR_EC2_IP:/home/ubuntu/

# SSH to EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Run deployment
chmod +x deploy-pm2.sh
./deploy-pm2.sh
```

### 3. Configure Environment

When prompted, enter your Git repository URL and configure `.env`:

```bash
cd ~/bytix-ai
nano .env
```

Required variables:
```bash
DATABASE_URL="postgresql://user:pass@host:5432/db"
BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
BETTER_AUTH_URL="https://yourdomain.com"
GOOGLE_CLIENT_ID="your-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-secret"
NODE_ENV="production"
```

Save (Ctrl+X, Y, Enter) and continue deployment.

### 4. Configure DNS

In Namecheap:
1. Go to Advanced DNS
2. Add A Record: @ → YOUR_EC2_IP
3. Add A Record: www → YOUR_EC2_IP

### 5. Verify

```bash
# Check app status
pm2 status

# View logs
pm2 logs bytix-ai

# Test locally
curl http://localhost/health
```

Access: http://yourdomain.com (after DNS propagates)

## Quick Commands

```bash
# Restart app
pm2 restart bytix-ai

# View logs
pm2 logs bytix-ai --lines 100

# Update app
cd ~/bytix-ai && git pull && npm install && npm run build && pm2 restart bytix-ai

# Reload Nginx
sudo systemctl reload nginx
```

## Add SSL (Optional)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Troubleshooting

**App not starting?**
```bash
pm2 logs bytix-ai
```

**502 Error?**
```bash
pm2 restart bytix-ai
sudo systemctl restart nginx
```

**Can't access via domain?**
- Check DNS with: `nslookup yourdomain.com`
- Wait 5-30 minutes for DNS propagation

## Need Help?

See the complete guide: [DEPLOY_EC2.md](./DEPLOY_EC2.md)

