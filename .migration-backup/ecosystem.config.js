module.exports = {
  apps: [{
    name: 'pdf-converter',
    script: 'dist/index.js',
    cwd: '/var/www/pdf-converter',
    instances: 'max', // Use all available CPU cores
    exec_mode: 'cluster',
    
    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    
    // PM2+ Monitoring
    pmx: true,
    
    // Logging
    log_file: '/var/www/pdf-converter/logs/combined.log',
    out_file: '/var/www/pdf-converter/logs/out.log',
    error_file: '/var/www/pdf-converter/logs/error.log',
    log_type: 'json',
    
    // Auto restart settings
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Memory management
    max_memory_restart: '1G',
    
    // Advanced settings
    node_args: '--max-old-space-size=4096',
    
    // Health monitoring
    health_check_grace_period: 3000,
    
    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 8000,
    
    // Process management
    restart_delay: 4000,
    
    // Watch and ignore settings (disabled for production)
    watch: false,
    ignore_watch: [
      'node_modules',
      'logs',
      'uploads',
      'temp'
    ],
    
    // Source map support
    source_map_support: true,
    
    // Disable merge logs
    merge_logs: false,
    
    // Environment-specific configurations
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      INSTANCES: 0,
    },
    
    env_staging: {
      NODE_ENV: 'staging',
      PORT: 3001,
      INSTANCES: 1,
    },
    
    env_development: {
      NODE_ENV: 'development',
      PORT: 3002,
      INSTANCES: 1,
      watch: true,
    }
  }],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/pdf-converter.git',
      path: '/var/www/pdf-converter',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt update && apt install git -y'
    },
    
    staging: {
      user: 'deploy',
      host: 'staging-server-ip',
      ref: 'origin/develop',
      repo: 'git@github.com:yourusername/pdf-converter.git',
      path: '/var/www/pdf-converter-staging',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging'
    }
  }
};