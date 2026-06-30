#!/bin/sh
set -e

# Guard: ensure the Laravel project has been scaffolded
if [ ! -f "/var/www/artisan" ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  ERROR: Laravel project not found in backend-laravel/"
    echo ""
    echo "  Run this once from the project root to scaffold it:"
    echo ""
    echo "    composer create-project laravel/laravel backend-laravel --prefer-dist"
    echo ""
    echo "  Then restart: docker compose up -d"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    exit 1
fi

# Install Composer dependencies if vendor/ is missing
if [ ! -d "/var/www/vendor" ]; then
    echo "Installing Composer dependencies..."
    cd /var/www && composer install --no-interaction --prefer-dist --optimize-autoloader
fi

# Ensure Laravel has an environment file inside the mounted project directory.
if [ ! -f "/var/www/.env" ] && [ -f "/var/www/.env.example" ]; then
    cp /var/www/.env.example /var/www/.env
fi

# Generate APP_KEY if not already set in the environment
if [ -z "$APP_KEY" ]; then
    echo "Generating application key..."
    cd /var/www && php artisan key:generate --force
fi

# Boot Nginx + PHP-FPM via Supervisor
exec /usr/bin/supervisord -n -c /etc/supervisor/conf.d/supervisord.conf
