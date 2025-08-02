# Complete VPS Deployment Guide for PDF Conversion Tool

## Overview
This guide will help you deploy your PDF conversion tool from Replit to your own VPS server with enhanced multiple file upload capabilities and concurrent processing.

## Prerequisites
- VPS server (minimum 2GB RAM, 2 CPU cores, 20GB storage)
- Domain name pointed to your VPS IP
- Basic terminal/SSH knowledge

---

## STEP 1: VPS SERVER SETUP

### 1.1 Choose VPS Specifications
**Recommended minimum specs:**
- **RAM**: 4GB (for concurrent file processing)
- **CPU**: 2 cores (for parallel conversions)
- **Storage**: 50GB SSD (for temporary files)
- **Bandwidth**: Unmetered or high limit
- **OS**: Ubuntu 22.04 LTS

### 1.2 Initial Server Setup
```bash
# Connect to your VPS
ssh root@your-server-ip

# Update system packages
apt update && apt upgrade -y

# Create a new user (replace 'deploy' with your preferred username)
adduser deploy
usermod -aG sudo deploy

# Set up SSH key authentication
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Switch to deploy user
su - deploy
```

### 1.3 Security Configuration
```bash
# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Disable root login (edit SSH config)
sudo nano /etc/ssh/sshd_config
# Change: PermitRootLogin no
# Change: PasswordAuthentication no
sudo systemctl restart ssh
```

---

## STEP 2: SERVER ENVIRONMENT SETUP

### 2.1 Install Node.js (Latest LTS)
```bash
# Install Node.js via NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 2.2 Install PM2 Process Manager
```bash
# Install PM2 globally
sudo npm install -g pm2

# Set up PM2 to start on boot
pm2 startup
# Run the command that PM2 outputs
```

### 2.3 Install Nginx
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2.4 Install Additional Dependencies
```bash
# Install required system packages for PDF processing
sudo apt install -y \
  build-essential \
  python3-pip \
  imagemagick \
  ghostscript \
  poppler-utils \
  libreoffice \
  fonts-liberation \
  fonts-dejavu-core \
  fontconfig

# Install Puppeteer dependencies
sudo apt install -y \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libgcc1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  lsb-release \
  wget \
  xdg-utils
```

---

## STEP 3: DATABASE & STORAGE SETUP

### 3.1 Create Application Directories
```bash
# Create application directory
sudo mkdir -p /var/www/pdf-converter
sudo chown deploy:deploy /var/www/pdf-converter

# Create storage directories
sudo mkdir -p /var/www/pdf-converter/uploads
sudo mkdir -p /var/www/pdf-converter/downloads
sudo mkdir -p /var/www/pdf-converter/temp
sudo chown -R deploy:deploy /var/www/pdf-converter

# Set proper permissions
chmod 755 /var/www/pdf-converter
chmod 777 /var/www/pdf-converter/uploads
chmod 777 /var/www/pdf-converter/downloads
chmod 777 /var/www/pdf-converter/temp
```

### 3.2 Set up File Cleanup Cron Job
```bash
# Create cleanup script
cat > /var/www/pdf-converter/cleanup.sh << 'EOF'
#!/bin/bash
# Clean up temporary files older than 1 hour
find /var/www/pdf-converter/temp -type f -mmin +60 -delete
find /var/www/pdf-converter/uploads -type f -mmin +60 -delete
find /var/www/pdf-converter/downloads -type f -mmin +60 -delete
EOF

chmod +x /var/www/pdf-converter/cleanup.sh

# Add to crontab (runs every 30 minutes)
crontab -e
# Add this line:
# */30 * * * * /var/www/pdf-converter/cleanup.sh
```

### 3.3 Install PostgreSQL (Optional for Job Tracking)
```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres createuser --createdb --login --pwprompt pdfconverter
sudo -u postgres createdb pdfconverter_db --owner=pdfconverter
```

---

## STEP 4: APPLICATION DEPLOYMENT

### 4.1 Download Code from Replit
```bash
cd /var/www/pdf-converter

# Option 1: If you have Git repository
git clone https://github.com/yourusername/your-repo.git .

# Option 2: Download and extract from Replit
# Export your code from Replit as ZIP and upload to server
# Then extract: unzip your-project.zip
```

### 4.2 Install Dependencies
```bash
# Install all npm dependencies
npm install

# Install additional production dependencies
npm install express-rate-limit compression helmet cors morgan
```

### 4.3 Create Environment Configuration
```bash
# Create production environment file
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# File upload settings
MAX_FILE_SIZE=50MB
MAX_FILES_PER_REQUEST=10
UPLOAD_TIMEOUT=300000

# Storage paths
UPLOAD_DIR=/var/www/pdf-converter/uploads
DOWNLOAD_DIR=/var/www/pdf-converter/downloads
TEMP_DIR=/var/www/pdf-converter/temp

# Database (if using PostgreSQL)
DATABASE_URL=postgresql://pdfconverter:yourpassword@localhost:5432/pdfconverter_db

# Queue settings
MAX_CONCURRENT_JOBS=5
JOB_TIMEOUT=600000

# Security
SESSION_SECRET=your-super-secret-session-key-here
CORS_ORIGIN=https://yourdomain.com
EOF

# Secure the environment file
chmod 600 .env
```

### 4.4 Create PM2 Configuration
```bash
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'pdf-converter',
    script: 'server/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    max_memory_restart: '1G',
    error_file: '/var/www/pdf-converter/logs/err.log',
    out_file: '/var/www/pdf-converter/logs/out.log',
    log_file: '/var/www/pdf-converter/logs/combined.log',
    time: true,
    autorestart: true,
    max_restarts: 5,
    min_uptime: '10s'
  }]
};
EOF

# Create logs directory
mkdir -p logs
```

---

## STEP 5: MULTIPLE FILE UPLOAD ENHANCEMENT

### 5.1 Enhanced Server Configuration
Create `server/config/multer.js`:
```javascript
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB
    files: parseInt(process.env.MAX_FILES_PER_REQUEST) || 10
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

module.exports = upload;
```

### 5.2 Queue System Implementation
Create `server/queue/ConversionQueue.js`:
```javascript
class ConversionQueue {
  constructor(maxConcurrent = 5) {
    this.queue = [];
    this.processing = new Map();
    this.maxConcurrent = maxConcurrent;
    this.results = new Map();
  }

  async addJob(jobData) {
    const jobId = this.generateJobId();
    const job = {
      id: jobId,
      ...jobData,
      status: 'queued',
      createdAt: new Date(),
      progress: 0
    };

    this.queue.push(job);
    this.processQueue();
    return jobId;
  }

  async addBatchJob(files, conversionType) {
    const batchId = this.generateJobId();
    const jobs = files.map((file, index) => ({
      id: `${batchId}-${index}`,
      file,
      conversionType,
      batchId,
      status: 'queued',
      progress: 0,
      createdAt: new Date()
    }));

    this.queue.push(...jobs);
    this.processQueue();
    return { batchId, jobIds: jobs.map(j => j.id) };
  }

  async processQueue() {
    while (this.processing.size < this.maxConcurrent && this.queue.length > 0) {
      const job = this.queue.shift();
      this.processing.set(job.id, job);
      this.processJob(job);
    }
  }

  async processJob(job) {
    try {
      job.status = 'processing';
      job.startedAt = new Date();

      // Simulate conversion progress
      for (let progress = 0; progress <= 100; progress += 10) {
        job.progress = progress;
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Actual conversion logic would go here
      await this.performConversion(job);

      job.status = 'completed';
      job.completedAt = new Date();
      job.progress = 100;

    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
      job.failedAt = new Date();
    } finally {
      this.processing.delete(job.id);
      this.results.set(job.id, job);
      this.processQueue(); // Process next job
    }
  }

  async performConversion(job) {
    // Implementation depends on conversion type
    // This would call your existing conversion functions
    const { conversionType, file } = job;
    
    switch (conversionType) {
      case 'pdf-to-powerpoint':
        return await this.convertPdfToPowerpoint(file);
      case 'pdf-to-word':
        return await this.convertPdfToWord(file);
      // Add other conversion types...
      default:
        throw new Error(`Unknown conversion type: ${conversionType}`);
    }
  }

  getJobStatus(jobId) {
    if (this.processing.has(jobId)) {
      return this.processing.get(jobId);
    }
    return this.results.get(jobId);
  }

  getBatchStatus(batchId) {
    const jobs = [];
    for (const [id, job] of this.processing) {
      if (job.batchId === batchId) jobs.push(job);
    }
    for (const [id, job] of this.results) {
      if (job.batchId === batchId) jobs.push(job);
    }
    return jobs;
  }

  generateJobId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

module.exports = new ConversionQueue(
  parseInt(process.env.MAX_CONCURRENT_JOBS) || 5
);
```

### 5.3 Enhanced API Routes
Add to `server/routes.ts`:
```javascript
// Multiple file upload endpoint
app.post('/api/convert/batch', upload.array('files', 10), async (req, res) => {
  try {
    const { conversionType } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    const result = await conversionQueue.addBatchJob(files, conversionType);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Batch status endpoint
app.get('/api/batch/:batchId', (req, res) => {
  const { batchId } = req.params;
  const jobs = conversionQueue.getBatchStatus(batchId);
  
  res.json({
    success: true,
    data: {
      batchId,
      jobs,
      totalJobs: jobs.length,
      completedJobs: jobs.filter(j => j.status === 'completed').length,
      failedJobs: jobs.filter(j => j.status === 'failed').length,
      overallProgress: jobs.reduce((sum, job) => sum + job.progress, 0) / jobs.length
    }
  });
});
```

---

## STEP 6: NGINX CONFIGURATION

### 6.1 Create Nginx Site Configuration
```bash
sudo nano /etc/nginx/sites-available/pdf-converter

# Add this configuration:
```

```nginx
upstream pdf_converter {
    least_conn;
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (will be added in Step 7)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # File upload settings
    client_max_body_size 100M;
    client_body_timeout 300s;
    client_header_timeout 300s;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    location / {
        proxy_pass http://pdf_converter;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Static file serving with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://pdf_converter;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Download endpoint with proper headers
    location /api/download/ {
        proxy_pass http://pdf_converter;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Force download
        add_header Content-Disposition attachment;
    }
}
```

### 6.2 Enable Site and Test Configuration
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/pdf-converter /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## STEP 7: DOMAIN & SSL SETUP

### 7.1 Install Certbot for Let's Encrypt
```bash
sudo apt install snapd -y
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

### 7.2 Obtain SSL Certificate
```bash
# Stop Nginx temporarily
sudo systemctl stop nginx

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Start Nginx
sudo systemctl start nginx

# Test automatic renewal
sudo certbot renew --dry-run
```

### 7.3 Set up Automatic SSL Renewal
```bash
# Add to crontab
sudo crontab -e

# Add this line (runs twice daily):
0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx
```

---

## STEP 8: MONITORING & MAINTENANCE

### 8.1 Set up Log Rotation
```bash
sudo nano /etc/logrotate.d/pdf-converter

# Add this configuration:
```

```
/var/www/pdf-converter/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 deploy deploy
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 8.2 Health Check Script
```bash
cat > /var/www/pdf-converter/health-check.sh << 'EOF'
#!/bin/bash

APP_URL="https://yourdomain.com/api/health"
EMAIL="your-email@example.com"

response=$(curl -s -o /dev/null -w "%{http_code}" $APP_URL)

if [ $response != "200" ]; then
    echo "PDF Converter is DOWN! HTTP Status: $response" | mail -s "PDF Converter Alert" $EMAIL
    # Restart the application
    cd /var/www/pdf-converter
    pm2 restart pdf-converter
fi
EOF

chmod +x /var/www/pdf-converter/health-check.sh

# Add to crontab (check every 5 minutes)
crontab -e
# Add: */5 * * * * /var/www/pdf-converter/health-check.sh
```

### 8.3 Backup Script
```bash
cat > /var/www/pdf-converter/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/var/backups/pdf-converter"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup application code
tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C /var/www pdf-converter

# Backup database (if using PostgreSQL)
sudo -u postgres pg_dump pdfconverter_db > $BACKUP_DIR/db_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /var/www/pdf-converter/backup.sh

# Add to crontab (daily backup at 2 AM)
crontab -e
# Add: 0 2 * * * /var/www/pdf-converter/backup.sh
```

---

## STEP 9: DEPLOYMENT EXECUTION

### 9.1 Build and Start Application
```bash
cd /var/www/pdf-converter

# Build the application
npm run build

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
```

### 9.2 Verify Deployment
```bash
# Check PM2 status
pm2 status

# Check application logs
pm2 logs pdf-converter

# Test the API
curl https://yourdomain.com/api/health

# Check Nginx status
sudo systemctl status nginx

# Check SSL certificate
curl -I https://yourdomain.com
```

---

## TROUBLESHOOTING COMMON ISSUES

### Issue 1: File Upload Fails
```bash
# Check file permissions
ls -la /var/www/pdf-converter/uploads/

# Fix permissions if needed
sudo chown -R deploy:deploy /var/www/pdf-converter/
chmod 777 /var/www/pdf-converter/uploads/
```

### Issue 2: Conversion Process Hangs
```bash
# Check available memory
free -h

# Check running processes
ps aux | grep node

# Restart PM2 if needed
pm2 restart pdf-converter
```

### Issue 3: SSL Certificate Issues
```bash
# Check certificate validity
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Check Nginx configuration
sudo nginx -t
```

### Issue 4: High Memory Usage
```bash
# Monitor memory usage
pm2 monit

# Adjust PM2 configuration in ecosystem.config.js:
# max_memory_restart: '512M'  // Restart if memory exceeds 512MB
```

---

## PRODUCTION OPTIMIZATIONS

### Enable Node.js Clustering
Your PM2 configuration already enables clustering with 2 instances. Monitor performance and adjust based on your server specs.

### Database Connection Pooling
If using PostgreSQL, configure connection pooling in your database configuration.

### Redis for Session Storage
Consider implementing Redis for session storage and job queuing for better scalability.

### CDN Integration
For better performance, consider using a CDN for static assets.

---

## MAINTENANCE CHECKLIST

### Daily
- [ ] Check PM2 application status
- [ ] Review error logs
- [ ] Monitor disk space usage

### Weekly
- [ ] Review performance metrics
- [ ] Check SSL certificate status
- [ ] Update system packages

### Monthly
- [ ] Review and clean up old files
- [ ] Update Node.js dependencies
- [ ] Test backup restoration process

---

This completes your comprehensive VPS deployment guide. Your PDF conversion tool will now be running on your own server with enhanced multiple file upload capabilities, proper security, and monitoring in place.