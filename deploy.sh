#!/bin/bash

# Bytix AI - Deployment Script for AWS EC2
# This script automates the deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="bytix-ai"
APP_DIR="/home/ubuntu/${APP_NAME}"
DOCKER_COMPOSE_FILE="docker-compose.yml"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Bytix AI - Deployment Script${NC}"
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

# Check if .env file exists
if [ ! -f "$APP_DIR/.env" ]; then
    print_error ".env file not found!"
    print_message "Please create a .env file based on .env.example"
    print_message "Copy .env.example to .env and fill in your values:"
    print_message "  cp .env.example .env"
    print_message "  nano .env"
    exit 1
fi

print_message "Starting deployment process..."

# Navigate to app directory
cd "$APP_DIR" || exit 1

# Pull latest changes from git (optional - uncomment if using git)
# print_message "Pulling latest code from repository..."
# git pull origin master || print_warning "Git pull failed or not a git repository"

# Stop running containers
print_message "Stopping existing containers..."
docker-compose down || print_warning "No containers to stop"

# Remove old images (optional - helps save space)
print_message "Cleaning up old Docker images..."
docker image prune -f || true

# Build new images
print_message "Building Docker images..."
docker-compose build --no-cache

# Run database migrations
print_message "Running database migrations..."
docker-compose run --rm app npx prisma migrate deploy || print_error "Migration failed!"

# Generate Prisma client
print_message "Generating Prisma client..."
docker-compose run --rm app npx prisma generate || print_error "Prisma generate failed!"

# Start containers
print_message "Starting containers..."
docker-compose up -d

# Wait for containers to be healthy
print_message "Waiting for containers to be healthy..."
sleep 10

# Check container status
print_message "Checking container status..."
docker-compose ps

# Show logs
print_message "Recent logs:"
docker-compose logs --tail=50

# Health check
print_message "Performing health check..."
sleep 5
if curl -f http://localhost/health > /dev/null 2>&1; then
    print_message "${GREEN}✓ Health check passed!${NC}"
else
    print_error "Health check failed!"
    print_message "Checking application logs..."
    docker-compose logs --tail=100 app
    exit 1
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
print_message "Application is running at:"
print_message "  - Local: http://localhost"
print_message "  - Public: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo 'YOUR_EC2_IP')"
echo ""
print_message "Useful commands:"
print_message "  - View logs: docker-compose logs -f"
print_message "  - Restart: docker-compose restart"
print_message "  - Stop: docker-compose down"
print_message "  - Shell access: docker-compose exec app sh"
echo ""

