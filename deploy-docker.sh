#!/bin/bash

# Bytix AI - EC2 Deployment Script (Docker)
# This script sets up the application on a fresh Ubuntu EC2 instance using Docker and Docker Compose
# It replaces the fragility of manual PM2 setups with containerized reliability.

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
DOCKER_COMPOSE_VERSION="v2.24.1" # Update as needed

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Bytix AI - EC2 Docker Deployment${NC}"
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

# Check if running as root (we want to run as user with sudo privileges, not root directly usually, but docker needs sudo)
if [ "$EUID" -eq 0 ]; then 
    print_warning "Running as root. It is recommended to run as the 'ubuntu' user."
fi

print_message "Starting deployment process..."

# 1. Update system
print_message "Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl git ca-certificates gnupg lsb-release

# 2. Install Docker & Docker Compose
if ! command -v docker &> /dev/null; then
    print_message "Installing Docker..."
    # Add Docker's official GPG key:
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    # Set up the repository:
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Add current user to docker group to avoid sudo
    sudo usermod -aG docker $USER
    print_info "Added $USER to docker group. You may need to logout and login for this to take effect."
else
    print_info "Docker is already installed."
fi

# 3. Setup Application Directory
if [ ! -d "$APP_DIR" ]; then
    print_message "Please enter your Git repository URL:"
    read -p "Git URL: " GIT_REPO
    print_message "Cloning repository..."
    git clone "$GIT_REPO" "$APP_DIR"
else
    print_message "Application directory exists. Pulling latest code..."
    cd "$APP_DIR"
    git pull origin main || git pull origin master
fi

cd "$APP_DIR"

# 4. Environment Setup
if [ ! -f "$APP_DIR/.env" ]; then
    print_warning ".env file not found!"
    if [ -f "$APP_DIR/env.example" ]; then
        cp "$APP_DIR/env.example" "$APP_DIR/.env"
        print_warning "Created .env from example. Please edit it now!"
        print_info "Opening editor in 5 seconds..."
        sleep 5
        nano "$APP_DIR/.env"
    else
        print_error "env.example missing. Please create .env manually."
        exit 1
    fi
fi

# 5. SSL / Nginx Prep
# Ensure ssl directory exists for the volume mapping
if [ ! -d "$APP_DIR/ssl" ]; then
    mkdir -p "$APP_DIR/ssl"
    print_info "Created ssl directory for volume mapping."
fi

# Stop any conflicting services (e.g., host nginx)
if systemctl is-active --quiet nginx; then
    print_warning "Host Nginx detected. Stopping and disabling it to free port 80/443 for Docker..."
    sudo systemctl stop nginx
    sudo systemctl disable nginx
fi

# 6. Deploy
print_message "Building and starting containers..."
# Use --build to ensure we rebuild if code changed
sudo docker compose up -d --build

# 7. Check Status
print_message "Checking container status..."
sudo docker compose ps

# 8. Firewall
print_message "Configuring UFW Firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
echo "y" | sudo ufw enable || true

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
print_info "Your app is running in Docker containers."
print_info "View logs with: cd $APP_DIR && sudo docker compose logs -f"
print_info "Manage with: cd $APP_DIR && sudo docker compose down/up"
