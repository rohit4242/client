# Troubleshooting Guide

Common issues and how to resolve them.

## 1. Nginx: 502 Bad Gateway
**Cause**: The Nginx container started but cannot reach the `app` container.
**System Check**:
- Run `docker-compose ps` to see if `bytix-app` is running.
- Run `docker-compose logs app` to see if it crashed.
- Check if the app is listening on port 3000 (`docker-compose exec app netstat -tulpn`).

## 2. Certbot: Challenge Failed
**Cause**: Let's Encrypt cannot reach `http://bytix.ai/.well-known/acme-challenge/`.
**Fixes**:
- Ensure DNS A records are correct.
- Ensure Port 80 is open in AWS Security Group.
- Check if Nginx is running (`docker-compose ps`).

## 3. Build Memory Errors
**Cause**: Next.js build ran out of RAM (common on small instances).
**Fixes**:
- Increase Swap space on the EC2 instance.
- Upgrade to a `t3.medium`.
- Build locally and push the Docker image to a registry (e.g., ECR, Docker Hub).

## 5. Fresh Start (Clean Up Previous Setup)
If you want to delete everything and start from scratch because of configuration errors:

```bash
# Stop and remove ALL containers, networks, and volumes
sudo docker compose down -v --rmi all

# Optional: Prune everything (careful: this deletes ALL unused docker data)
sudo docker system prune -a --volumes
```

Next, ensure your `docker-compose.yml` is updated and run:
```bash
sudo docker compose up -d --build
```
