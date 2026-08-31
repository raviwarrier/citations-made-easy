module.exports = {
  apps: [
    {
      name: 'citations-made-easy',
      script: 'dist/server.cjs',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Hardened: bind strictly to 127.0.0.1 (localhost only)
        HOST: '127.0.0.1',
      },
    },
  ],
};
