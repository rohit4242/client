module.exports = {
  apps: [
    {
      name: "bytix-client",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
    },
    {
      name: "position-monitor",
      script: "./node_modules/.bin/tsx",
      args: "src/scripts/monitor-positions-cron.ts",
      cron_restart: "* * * * *", // Run every minute
      autorestart: false, // Don't restart on completion
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
