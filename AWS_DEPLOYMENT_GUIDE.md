# ☁️ AWS EC2 Docker Deployment Guide for Bytix AI

This guide describes the **recommended best practice** path for deploying Bytix AI to AWS EC2 using Docker. This approach replaces manual dependency management (PM2) with containerized reliability.

## 🌟 Why Docker?
- **Consistency**: The app runs exactly the same on your machine as it does on the server.
- **Reliability**: Automatic restarts, isolation from system updates, and no "it works on my machine" bugs.
- **Security**: The application runs in an isolated container, not directly on the host OS.
- **Maintenance**: Upgrading Node.js or changing dependencies requires no server changes, just a new image.

---

## 🛠️ Prerequisites
1. **AWS Account**: Access to launch EC2 instances.
2. **Domain Name**: Purchased (e.g., via Namecheap or Route53).
3. **SSH Client**: Terminal (Mac/Linux) or PuTTY/PowerShell (Windows).

---

## 📦 Step-by-Step Deployment

### 1. Launch EC2 Instance
- **AMI**: Ubuntu Server 24.04 LTS (HVM)
- **Instance Type**: `t3.small` (Recommended minimum for Next.js + Bot). `t3.micro` may run out of RAM during build.
- **Storage**: 20GB+ gp3
- **Security Group (Firewall)**:
    - Allow **SSH** (Port 22) -> My IP
    - Allow **HTTP** (Port 80) -> Anywhere (0.0.0.0/0)
    - Allow **HTTPS** (Port 443) -> Anywhere (0.0.0.0/0)

### 2. Connect to Instance
```bash
ssh -i "your-key.pem" ubuntu@your-public-ip
```

### 3. Clone & Setup
Run the following commands on the server:

```bash
# 1. Clone your repository
git clone https://github.com/your-username/bytix-client.git bytix
cd bytix

# 2. Run the Docker Deployment Script
# This script installs Docker, sets up the environment, and starts the app.
chmod +x deploy-docker.sh
./deploy-docker.sh
```

*(Note: The script will ask you to configure your `.env` file if it's missing. Paste your production variables there using the `nano` editor).*

### 4. Setup SSL (HTTPS)
We will use **Certbot** on the host to obtain a certificate and map it to the Nginx Docker container.

```bash
# 1. Install Certbot
sudo apt-get install -y certbot

# 2. Stop Docker temporarily to let Certbot bind port 80
sudo docker compose down

# 3. Obtain Certificate
# Replace example.com with your actual domain
sudo certbot certonly --standalone -d example.com -d www.example.com

# 4. Restart Docker
sudo docker compose up -d
```

> **Note**: The `docker-compose.yml` is already configured to look for certificates in `./ssl`. You may need to copy them or symlink them, but the easiest way is to modify `docker-compose.yml` to mount the live letsencrypt path if you are comfortable, OR just copy them:
```bash
# 5. Restart Docker
sudo cp /etc/letsencrypt/live/example.com/fullchain.pem ./ssl/fullchain.pem
sudo cp /etc/letsencrypt/live/example.com/privkey.pem ./ssl/privkey.pem

# Switch to SSL Configuration
cp nginx-ssl.conf nginx.conf

sudo docker compose restart nginx
```

### 5. Setup Position Monitor (Cron)
Instead of running a separate container for the cron script, we will use the **Host System Cron** to trigger your Next.js API route. This is lightweight and reliable.

1. **Ensure `.env` has a secret**:
   ```env
   CRON_SECRET=your_long_random_password
   ```

2. **Edit Host Crontab**:
   ```bash
   crontab -e
   ```

3. **Add the entry (runs every minute)**:
   ```bash
   # Hit the local Docker API every minute
   * * * * * curl -s -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/monitor-positions >> /tmp/cron.log 2>&1
   ```

---

## 🔄 Updating the App
When you have new code changes:

```bash
# 1. Pull latest code
git pull

# 2. Rebuild and Restart (Zero downtime deployment not guaranteed with this simple setup, but fast)
sudo docker compose up -d --build
```

---

## 🔍 Monitoring & Logs

**View Application Logs**:
```bash
# Follow logs for all services
sudo docker compose logs -f

# View just the app
sudo docker compose logs -f app

# View Nginx access logs
sudo docker compose logs -f nginx
```

**Check Resource Usage**:
```bash
sudo docker stats
```

---

## 🤖 CI/CD (Optional Best Practice)
To automate deployment via GitHub Actions, add a file `.github/workflows/deploy.yml`:

```yaml
name: Deploy to EC2
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ubuntu
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd ~/bytix
            git pull
            sudo docker compose up -d --build
```
This automatically deploys your code whenever you push to main!
