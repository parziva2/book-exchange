module.exports = {
  apps: [{
    name: 'book-exchange-server',
    script: 'index.js',
    watch: true,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    autorestart: true,
    no_daemon: false,
    windowsHide: true
  }]
}; 