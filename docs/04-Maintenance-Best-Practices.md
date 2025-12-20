# Maintenance Best Practices

Keep your deployment secure, fast, and reliable.

## 1. Security Headers
The provided Nginx configuration includes basic security headers. For production, consider enabling HSTS:
```nginx
add_header Strict-Transport-Security "max-age=63072000" always;
```
*Note: Only enable this after you are certain HTTPS is working correctly.*

## 2. Resource Monitoring
AWS CloudWatch provides basic monitoring. Keep an eye on:
- **CPU Utilization**: If consistently above 70%, consider upgrading the instance.
- **Memory Usage**: Next.js builds can be memory-intensive.

## 3. Log Rotation
Docker handles log rotation if configured in `docker-compose.yml`. Our current setup uses default logging. For high-traffic servers, add this to each service:
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## 4. Container Reliability vs PM2

In the provided `docker-compose.yml`, we use `restart: unless-stopped`. 

### Why you don't need PM2:
- **Auto-Restart**: If your application crashes (internal error), Docker will automatically detect the exit and restart the container immediately.
- **Boot Persistence**: If the EC2 instance reboots, Docker will start the containers automatically.
- **Simplicity**: One less layer of management inside the container.

### When PM2 is still useful:
- If you want advanced log management or clustering *inside* a single container (though for Docker, scaling is usually done by running multiple container instances via ECS or K8s).

## 5. Updates
### App Updates
```bash
git pull
docker-compose up -d --build
```

### System Updates
```bash
sudo apt update && sudo apt upgrade -y
```

Next: [Troubleshooting](./05-Troubleshooting.md)
