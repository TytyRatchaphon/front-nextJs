module.exports = {
  apps: [
    {
      name: process.env.PM2_APP_NAME || "web_5056",
      // Keep cwd in standalone directory so Next resolves .next/static and public correctly.
      cwd: __dirname,
      script: "server.js",
      interpreter: "node",
      exec_mode: "cluster",
      instances: process.env.WEB_CONCURRENCY || 6,
      watch: false,
      max_memory_restart: "1500M",
      listen_timeout: 10000,
      kill_timeout: 5000,
      env: {
        NODE_ENV: "production",
        PORT: Number(process.env.PORT || 5056),
        HOSTNAME: process.env.HOSTNAME || "0.0.0.0",
      },
      env_development: {
        NODE_ENV: "development",
        PORT: Number(process.env.PORT || 5056),
        HOSTNAME: process.env.HOSTNAME || "0.0.0.0",
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      merge_logs: true,
      time: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
