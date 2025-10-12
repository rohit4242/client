module.exports = {
  apps: [
    {
      name: 'bytix-ai',
      script: './node_modules/.next/standalone/server.js',
      cwd: './',
      instances: 1,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      log_type: 'json',
      time: true,
    },
  ],

  deploy: {
    production: {
      user: 'ubuntu',
      host: 'YOUR_EC2_IP',
      ref: 'origin/main',
      repo: 'YOUR_GIT_REPO',
      path: '/home/ubuntu/bytix-ai',
      'post-deploy': 'npm install && npx prisma generate && npx prisma migrate deploy && npm run build && pm2 reload ecosystem.config.js --env production',
    },
  },
};

