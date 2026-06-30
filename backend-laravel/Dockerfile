FROM php:8.4-fpm-alpine

# System dependencies
RUN apk add --no-cache \
    nginx \
    supervisor \
    curl \
    libpng-dev \
    libxml2-dev \
    oniguruma-dev \
    postgresql-dev \
    zip \
    unzip \
    git

# PHP extensions required by Laravel + PostgreSQL
RUN docker-php-ext-install \
    pdo \
    pdo_pgsql \
    mbstring \
    xml \
    bcmath \
    pcntl \
    opcache

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Nginx and Supervisor config
COPY nginx.conf /etc/nginx/http.d/default.conf
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Entrypoint checks for the Laravel project and boots services
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

WORKDIR /var/www

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
