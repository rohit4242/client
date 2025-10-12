#!/bin/bash

# Bytix AI - EC2 Deployment Script (Nginx + PM2)
# This script sets up the application on a fresh Ubuntu EC2 instance

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="bytix-ai"
APP_DIR="$HOME/$APP_NAME"
NODE_VERSION="20"
DOMAIN="bytix.ai" # Change this to your actual domain

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Bytix AI - EC2 Deployment${NC}"
echo -e "${GREEN}  Nginx + PM2 Setup${NC}"
echo -e "${GREEN}========================================${NC}"

# Function to print colored messages
print_message() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run this script as root. Run as ubuntu user."
    exit 1
fi

print_message "Starting deployment process..."

# Update system packages
print_message "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install essential tools
print_message "Installing essential tools..."
sudo apt-get install -y curl git build-essential

# Install Node.js using nvm
print_message "Installing Node.js ${NODE_VERSION}.x via nvm..."
if [ ! -d "$HOME/.nvm" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install $NODE_VERSION
    nvm use $NODE_VERSION
    nvm alias default $NODE_VERSION
else
    print_info "nvm already installed"
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

# Verify Node.js installation
print_message "Node.js version: $(node -v)"
print_message "npm version: $(npm -v)"

# Install PM2 globally
print_message "Installing PM2..."
npm install -g pm2

# Setup PM2 to start on system boot
print_message "Configuring PM2 startup script..."
pm2 startup systemd -u $USER --hp $HOME | grep -v "PM2" | sudo bash || true

# Install Nginx
print_message "Installing Nginx..."
sudo apt-get install -y nginx

# Clone repository or pull latest changes
if [ ! -d "$APP_DIR" ]; then
    print_message "Please enter your Git repository URL:"
    read -p "Git URL: " GIT_REPO
    print_message "Cloning repository..."
    git clone "$GIT_REPO" "$APP_DIR"
else
    print_message "Application directory exists, pulling latest changes..."
    cd "$APP_DIR"
    git pull origin main || git pull origin master
fi

cd "$APP_DIR"

# Check if .env file exists
if [ ! -f "$APP_DIR/.env" ]; then
    print_warning ".env file not found!"
    print_message "Creating .env file from template..."
    if [ -f "$APP_DIR/env.example" ]; then
        cp "$APP_DIR/env.example" "$APP_DIR/.env"
        print_warning "Please edit .env file with your actual values:"
        print_info "  nano $APP_DIR/.env"
        print_message "Press Enter when you've configured your .env file..."
        read
    else
        print_error "env.example not found. Please create .env manually."
        exit 1
    fi
fi

# Install dependencies
print_message "Installing Node.js dependencies..."
npm install

# Generate Prisma Client
print_message "Generating Prisma Client..."
npx prisma generate

# Run database migrations
print_message "Running database migrations..."
npx prisma migrate deploy

# Build Next.js application
print_message "Building Next.js application (this may take a few minutes)..."
npm run build

# Stop existing PM2 processes
print_message "Stopping existing PM2 processes..."
pm2 delete $APP_NAME 2>/dev/null || true

# Start application with PM2
print_message "Starting application with PM2..."
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Configure Nginx
print_message "Configuring Nginx..."
sudo cp nginx-bytix.conf /etc/nginx/sites-available/$APP_NAME

# Update domain in Nginx config
print_message "Please enter your domain name (e.g., example.com):"
read -p "Domain: " USER_DOMAIN
if [ ! -z "$USER_DOMAIN" ]; then
    sudo sed -i "s/yourdomain.com/$USER_DOMAIN/g" /etc/nginx/sites-available/$APP_NAME
fi

# Enable site
sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/

# Remove default Nginx site
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
print_message "Testing Nginx configuration..."
sudo nginx -t

# Restart Nginx
print_message "Restarting Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# Configure firewall
print_message "Configuring UFW firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
echo "y" | sudo ufw enable || true

# Show application status
print_message "Checking application status..."
pm2 status

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Completed Successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
print_message "Application Information:"
print_info "  - PM2 Process: $APP_NAME"
print_info "  - Application Directory: $APP_DIR"
print_info "  - Node.js Version: $(node -v)"
print_info "  - PM2 Version: $(pm2 -v)"
echo ""
print_message "Access your application:"
print_info "  - Local: http://localhost"
print_info "  - Public: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo 'YOUR_EC2_IP')"
if [ ! -z "$USER_DOMAIN" ]; then
    print_info "  - Domain: http://$USER_DOMAIN"
fi
echo ""
print_message "Useful PM2 Commands:"
print_info "  - View logs: pm2 logs $APP_NAME"
print_info "  - Restart app: pm2 restart $APP_NAME"
print_info "  - Stop app: pm2 stop $APP_NAME"
print_info "  - Monitor: pm2 monit"
print_info "  - Status: pm2 status"
echo ""
print_message "Useful Nginx Commands:"
print_info "  - Test config: sudo nginx -t"
print_info "  - Reload: sudo systemctl reload nginx"
print_info "  - Restart: sudo systemctl restart nginx"
print_info "  - View logs: sudo tail -f /var/log/nginx/error.log"
echo ""
print_warning "Next Steps:"
print_info "  1. Configure your domain DNS (A record) to point to your EC2 IP"
print_info "  2. Wait for DNS propagation (5-30 minutes)"
print_info "  3. Test your application at http://$USER_DOMAIN"
print_info "  4. (Optional) Set up SSL certificate with Let's Encrypt"
echo ""

