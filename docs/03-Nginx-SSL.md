# Nginx and SSL Configuration

We use Nginx as a reverse proxy and Certbot to manage Let's Encrypt SSL certificates.

## 1. Initial Certificate Generation
Before HTTPS can work, you must generate the certificates. run this command after starting your containers:

```bash
# Verify the service exists first
docker compose ps

# Generate certificates
sudo docker compose run --rm certbot certonly --webroot --webroot-path /var/www/certbot -d bytix.ai -d www.bytix.ai
```

## 2. Applied Configuration
The `nginx-bytix.conf` is mounted to `/etc/nginx/nginx.conf` in the Nginx container. It handles:
- **HTTP (80)**: Redirects all traffic to HTTPS, except for Certbot challenges.
- **HTTPS (443)**: Proxies traffic to the `app` container on port 3000.

### Reloading Nginx
If you make changes to `nginx-bytix.conf`, reload the container:
```bash
docker compose restart nginx
```

## 3. Auto-Renewal Setup
Add a cron job to automatically renew your certificates:

```bash
# Open crontab
crontab -e

# Add this line (runs at 3:00 AM every day)
0 3 * * * docker compose -f /home/ubuntu/app/bytix/docker-compose.yml run --rm certbot renew && docker compose -f /home/ubuntu/app/bytix/docker-compose.yml restart nginx
```

Next: [Maintenance Best Practices](./04-Maintenance-Best-Practices.md)
