#!/bin/bash

# PDF Converter Application - Automated VPS Deployment Script
# Usage: chmod +x deploy.sh && ./deploy.sh

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration variables
APP_NAME="pdf-converter"
APP_DIR="/var/www/pdf-converter"
DB_NAME="pdf_converter"
DB_USER="pdf_user"
NODE_VERSION="20"
DOMAIN="yourdomain.com"
REPO_URL="https://github.com/yourusername/pdf-converter.git"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
        exit 1
    fi
}

# Function to check system requirements
check_system() {
    print_status "Checking system requirements..."
    
    # Check Ubuntu version
    if ! lsb_release -d | grep -q "Ubuntu 20.04\|Ubuntu 22.04\|Ubuntu 24.04"; then
        print_warning "This script is tested on Ubuntu 20.04/22.04/24.04. Your system may not be supported."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Check available disk space (minimum 10GB)
    available_space=$(df / | awk 'NR==2 {print $4}')
    if [[ $available_space -lt 10485760 ]]; then
        print_error "Insufficient disk space. At least 10GB required."
        exit 1
    fi
    
    # Check available RAM (minimum 4GB)
    available_ram=$(free -m | awk 'NR==2{printf "%.0f", $7*100/$2}')
    if [[ $available_ram -lt 4000 ]]; then
        print_warning "Less than 4GB RAM available. Application may not perform optimally."
    fi
    
    print_success "System requirements check passed"
}

# Function to update system packages
update_system() {
    print_status "Updating system packages..."
    sudo apt update -y
    sudo apt upgrade -y
    sudo apt install -y curl wget unzip software-properties-common git ufw fail2ban
    print_success "System packages updated"
}

# Function to install Node.js
install_nodejs() {
    print_status "Installing Node.js v${NODE_VERSION}..."
    
    # Remove any existing Node.js installations
    sudo apt remove -y nodejs npm
    
    # Install Node.js from NodeSource
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Verify installation
    node_version=$(node --version)
    npm_version=$(npm --version)
    
    print_success "Node.js ${node_version} and npm ${npm_version} installed"
}

# Function to install PostgreSQL
install_postgresql() {
    print_status "Installing and configuring PostgreSQL..."
    
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    # Generate random password
    DB_PASSWORD=$(openssl rand -base64 32)
    
    # Create database and user
    sudo -u postgres psql << EOF
CREATE DATABASE ${DB_NAME};
CREATE USER ${DB_USER} WITH ENCRYPTED PASSWORD '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
EOF
    
    # Save database credentials
    echo "DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}" > /tmp/db_credentials.env
    
    print_success "PostgreSQL installed and configured"
}

# Function to install PM2
install_pm2() {
    print_status "Installing PM2..."
    sudo npm install -g pm2@latest
    print_success "PM2 installed"
}

# Function to install and configure Nginx
install_nginx() {
    print_status "Installing and configuring Nginx..."
    
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    
    # Remove default site
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Copy our Nginx configuration
    sudo cp nginx.conf /etc/nginx/sites-available/${APP_NAME}
    
    # Update domain name in configuration
    sudo sed -i "s/yourdomain.com/${DOMAIN}/g" /etc/nginx/sites-available/${APP_NAME}
    
    # Enable site
    sudo ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/
    
    # Test configuration
    sudo nginx -t
    
    print_success "Nginx installed and configured"
}

# Function to setup firewall
setup_firewall() {
    print_status "Configuring firewall..."
    
    sudo ufw --force reset
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    sudo ufw allow ssh
    sudo ufw allow 'Nginx Full'
    sudo ufw --force enable
    
    print_success "Firewall configured"
}

# Function to deploy application
deploy_application() {
    print_status "Deploying application..."
    
    # Create application directory
    sudo mkdir -p ${APP_DIR}
    sudo chown $USER:$USER ${APP_DIR}
    
    # Clone repository
    if [[ -d "${APP_DIR}/.git" ]]; then
        cd ${APP_DIR}
        git pull origin main
    else
        git clone ${REPO_URL} ${APP_DIR}
        cd ${APP_DIR}
    fi
    
    # Install dependencies
    npm install
    
    # Build application
    npm run build
    
    # Create necessary directories
    mkdir -p logs uploads temp
    
    # Set permissions
    chmod 755 ${APP_DIR}
    chmod -R 755 logs uploads temp
    
    print_success "Application deployed"
}

# Function to setup environment variables
setup_environment() {
    print_status "Setting up environment variables..."
    
    # Generate session secret
    SESSION_SECRET=$(openssl rand -base64 64)
    
    # Read database credentials
    source /tmp/db_credentials.env
    
    # Create .env file
    cat > ${APP_DIR}/.env << EOF
# Application Settings
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database Configuration
${DATABASE_URL}
DB_HOST=localhost
DB_PORT=5432
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}

# Session Configuration
SESSION_SECRET=${SESSION_SECRET}
SESSION_TIMEOUT=3600000

# File Upload Settings
MAX_FILE_SIZE=200
UPLOAD_DIR=${APP_DIR}/uploads
TEMP_DIR=${APP_DIR}/temp

# CORS Settings
ALLOWED_ORIGINS=https://${DOMAIN},https://www.${DOMAIN}

# Application URLs
BASE_URL=https://${DOMAIN}
API_URL=https://${DOMAIN}/api

# Security Settings
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=${APP_DIR}/logs/app.log
EOF
    
    # Set secure permissions
    chmod 600 ${APP_DIR}/.env
    
    # Clean up temporary file
    rm -f /tmp/db_credentials.env
    
    print_success "Environment variables configured"
}

# Function to setup database
setup_database() {
    print_status "Setting up database schema..."
    
    cd ${APP_DIR}
    npm run db:push
    
    print_success "Database schema created"
}

# Function to start application with PM2
start_application() {
    print_status "Starting application with PM2..."
    
    cd ${APP_DIR}
    
    # Update PM2 configuration with correct paths
    sed -i "s|/var/www/pdf-converter|${APP_DIR}|g" ecosystem.config.js
    
    # Start application
    pm2 start ecosystem.config.js --env production
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 startup
    pm2 startup | tail -1 | sudo bash
    
    print_success "Application started with PM2"
}

# Function to setup SSL certificate
setup_ssl() {
    print_status "Setting up SSL certificate..."
    
    # Install Certbot
    sudo apt install -y certbot python3-certbot-nginx
    
    # Obtain certificate
    sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos --email admin@${DOMAIN}
    
    # Setup auto-renewal
    echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
    
    # Reload Nginx
    sudo systemctl reload nginx
    
    print_success "SSL certificate configured"
}

# Function to run system tests
run_tests() {
    print_status "Running system tests..."
    
    # Test application health
    sleep 5
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        print_success "Application health check passed"
    else
        print_error "Application health check failed"
        pm2 logs --lines 50
        exit 1
    fi
    
    # Test database connection
    if cd ${APP_DIR} && npm run check > /dev/null 2>&1; then
        print_success "Database connection test passed"
    else
        print_warning "Database connection test failed - check configuration"
    fi
    
    # Test Nginx configuration
    if sudo nginx -t > /dev/null 2>&1; then
        print_success "Nginx configuration test passed"
    else
        print_error "Nginx configuration test failed"
        exit 1
    fi
    
    print_success "All system tests passed"
}

# Function to display final information
display_info() {
    print_success "\n🎉 Deployment completed successfully!"
    echo
    echo "📋 Deployment Summary:"
    echo "  • Application: ${APP_NAME}"
    echo "  • Directory: ${APP_DIR}"
    echo "  • Domain: https://${DOMAIN}"
    echo "  • Database: ${DB_NAME}"
    echo "  • Node.js: $(node --version)"
    echo "  • PM2 Status: $(pm2 list | grep ${APP_NAME} | awk '{print $10}')"
    echo
    echo "🔧 Useful Commands:"
    echo "  • Check app status: pm2 status"
    echo "  • View logs: pm2 logs ${APP_NAME}"
    echo "  • Restart app: pm2 restart ${APP_NAME}"
    echo "  • Check Nginx: sudo systemctl status nginx"
    echo "  • View Nginx logs: sudo tail -f /var/log/nginx/error.log"
    echo
    echo "🌐 Your PDF Converter is now available at: https://${DOMAIN}"
    echo
    echo "⚠️  Important: Update DNS records to point ${DOMAIN} to this server's IP address"
    echo
}

# Main deployment function
main() {
    echo "🚀 PDF Converter Application - VPS Deployment Script"
    echo "===================================================="
    echo
    
    # Get domain name from user
    read -p "Enter your domain name (e.g., example.com): " domain_input
    if [[ -n "$domain_input" ]]; then
        DOMAIN="$domain_input"
    fi
    
    # Get repository URL from user
    read -p "Enter your Git repository URL: " repo_input
    if [[ -n "$repo_input" ]]; then
        REPO_URL="$repo_input"
    fi
    
    echo
    print_status "Starting deployment for domain: ${DOMAIN}"
    print_status "Repository: ${REPO_URL}"
    echo
    
    # Confirm before proceeding
    read -p "Continue with deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 1
    fi
    
    # Run deployment steps
    check_root
    check_system
    update_system
    install_nodejs
    install_postgresql
    install_pm2
    install_nginx
    setup_firewall
    deploy_application
    setup_environment
    setup_database
    start_application
    setup_ssl
    run_tests
    display_info
    
    print_success "\n🎊 Deployment completed! Your PDF Converter application is ready!"
}

# Run main function
main "$@"