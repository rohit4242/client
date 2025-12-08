---
description: 
---

# Step 1: Update server settings
InstanceType: t3.medium (4GB RAM recommended)
EBS Volume: 20GB minimum

# Step 2: Clean existing install
# Run on EC2:
rm -rf ~/client/.next
rm -rf ~/client/node_modules
pm2 flush
pm2 delete all
sudo apt-get clean
sudo journalctl --vacuum-time=1d

# Step 3: Add swap memory
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Step 4: Clone and setup
cd ~
git clone https://github.com/YOUR_USERNAME/client.git
cd client
npm install
npx prisma generate

# Step 5: Create .env file
nano .env
# Add all your environment variables

# Step 6: Build
npm run build

# Step 7: Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Step 8: Configure NGINX
sudo nano /etc/nginx/sites-available/bytix
# Paste the nginx config (see nginx-bytix.conf)
sudo ln -s /etc/nginx/sites-available/bytix /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Step 9: SSL with Certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
