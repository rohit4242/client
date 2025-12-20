# AWS EC2 Setup Guide for Bytix AI

This document provides a step-by-step guide for setting up an AWS EC2 instance suitable for deploying the Bytix AI platform.

## 1. Instance Selection
For a Next.js application with Nginx and Docker, we recommend:
- **Instance Type**: `t3.medium` or better (at least 4GB RAM)
- **OS**: `Ubuntu 22.04 LTS` or `Ubuntu 24.04 LTS`
- **Storage**: `20GB EBS GP3` (minimum)

## 2. Security Group Configuration
Create or modify a Security Group with the following inbound rules:

| Protocol | Port | Source | Description |
| :--- | :--- | :--- | :--- |
| SSH | 22 | Your IP | Admin access |
| HTTP | 80 | 0.0.0.0/0 | Web traffic (redirects to HTTPS) |
| HTTPS | 443 | 0.0.0.0/0 | Secure web traffic |

## 3. Elastic IP (Recommended)
Attach an **Elastic IP** to your instance. This ensures your public IP address remains constant even if the instance is stopped and restarted.

## 4. DNS Setup
Go to your domain registrar (e.g., Route 53, Namecheap, GoDaddy) and create the following records pointing to your EC2 Elastic IP:

- **A Record**: `bytix.ai` -> `[YOUR_EC2_IP]`
- **A Record**: `www.bytix.ai` -> `[YOUR_EC2_IP]`

## 5. Connecting to your Instance
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

Next: [Docker Deployment Guide](./02-Docker-Deployment.md)
