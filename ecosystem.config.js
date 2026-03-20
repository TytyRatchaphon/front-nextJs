module.exports = {
  apps: [
    {
      name: 'web_3009',
      script: 'server.js', // ใช้ server.js ที่ได้จากการ build output: 'standalone' จะเบากว่าและเร็วกว่า
      instances: 6, // แบ่ง 6 core ตามที่เคยตั้งไว้
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3009, 
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3009,
      },
      watch: false,
      max_memory_restart: '1500M', // สั่ง Restart อัตโนมัติถ้า Instance ไหนกินแรมเกิน 1.5GB
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      merge_logs: true,
      time: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
