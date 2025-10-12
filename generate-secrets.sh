#!/bin/bash

# Script to generate secure secrets for Bytix AI deployment

echo "=========================================="
echo "  Bytix AI - Secret Generator"
echo "=========================================="
echo ""

# Check if openssl is available
if ! command -v openssl &> /dev/null; then
    echo "Error: openssl is not installed"
    echo "Please install openssl first:"
    echo "  Ubuntu/Debian: sudo apt-get install openssl"
    echo "  macOS: brew install openssl"
    exit 1
fi

echo "Generating secure secrets..."
echo ""

# Generate BETTER_AUTH_SECRET
echo "BETTER_AUTH_SECRET (copy this to your .env file):"
echo "----------------------------------------"
openssl rand -base64 32
echo ""

# Generate additional secrets if needed
echo "Additional secret (if needed):"
echo "----------------------------------------"
openssl rand -base64 32
echo ""

echo "=========================================="
echo "  Instructions:"
echo "=========================================="
echo "1. Copy the generated BETTER_AUTH_SECRET to your .env file"
echo "2. Keep these secrets secure and never commit them to git"
echo "3. Use different secrets for development and production"
echo ""

